// ============================================
// КОНФИГУРАЦИЯ
// ============================================
const SUPABASE_URL = 'https://10000arts.vercel.app';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzaHlyc3hocWV2dnFiYnFibnRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDAyMzEsImV4cCI6MjA5MjM3NjIzMX0.Owrda92DRalj6uNzoMDUEkOEThfdNLtCn9m-5xM03q8';

// ============================================
// СОСТОЯНИЕ ПРИЛОЖЕНИЯ
// ============================================
let currentColor = '#ff0000';
let currentTool = 'brush';
let currentSize = 2;
let currentUserPosition = null;
let gridOffset = { x: 0, y: 0 };
let scale = 1;
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let lastTouchDistance = 0;
let drawnPixels = new Set();
let cellsData = {};
let canvas, ctx, isDrawingOnCanvas = false, lastPos = { x: 0, y: 0 };

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  loadUserPosition();
  setupWelcomeScreen();
  createGrid();
  createColorPalette();
  setupToolbar();
  setupCanvasDrawing();
  setupViewportControls();
  setupShare();
  setupToolbarButtons();
  loadGridData();
  updateCounter();
});

// ============================================
// ЗАГРУЗКА ПОЗИЦИИ ПОЛЬЗОВАТЕЛЯ
// ============================================
function loadUserPosition() {
  const saved = localStorage.getItem('currentUserPosition');
  if (saved) {
    currentUserPosition = JSON.parse(saved);
  }
}

// ============================================
// 🔧 ПРИВЕТСТВЕННЫЙ ЭКРАН (ИСПРАВЛЕНО!)
// ============================================
function setupWelcomeScreen() {
  const welcomeScreen = document.getElementById('welcomeScreen');
  const agreeButton = document.getElementById('btnAgree');
  
  // Меню ВСЕГДА видно при заходе
  if (welcomeScreen) {
    welcomeScreen.classList.remove('hidden');
  }
  
  // Скрываем ТОЛЬКО после нажатия кнопки
  if (agreeButton && welcomeScreen) {
    agreeButton.addEventListener('click', () => {
      localStorage.setItem('agreedToRules', 'true');
      welcomeScreen.classList.add('hidden');
    });
  }
}

// ============================================
// СОЗДАНИЕ СЕТКИ
// ============================================
function createGrid() {
  const viewport = document.getElementById('viewport');
  const grid = document.getElementById('grid');
  if (!viewport || !grid) return;
  
  const gridSize = 100;
  const cellSize = 32;
  
  grid.style.position = 'absolute';
  grid.style.width = (gridSize * cellSize) + 'px';
  grid.style.height = (gridSize * cellSize) + 'px';
  grid.style.left = '0';
  grid.style.top = '0';
  grid.style.transformOrigin = '0 0';
  grid.style.willChange = 'transform';
  
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.style.width = cellSize + 'px';
      cell.style.height = cellSize + 'px';
      cell.style.left = (x * cellSize) + 'px';
      cell.style.top = (y * cellSize) + 'px';
      cell.style.position = 'absolute';
      cell.addEventListener('click', () => handleCellClick(x, y));
      grid.appendChild(cell);
    }
  }
}

// ============================================
// ОБРАБОТКА КЛИКОВ
// ============================================
async function handleCellClick(x, y) {
  if (currentUserPosition) {
    alert('⚠️ Вы уже нарисовали на позиции ' + currentUserPosition.x + ', ' + currentUserPosition.y + '!\n\nМожно рисовать только ОДИН раз.');
    return;
  }
  
  if (drawnPixels.has(`${x},${y}`)) {
    showReportModal(x, y);
    return;
  }
  
  const toolbar = document.getElementById('toolbar');
  const cellInfo = document.getElementById('cellInfo');
  if (toolbar && cellInfo) {
    toolbar.classList.remove('hidden');
    cellInfo.textContent = `📍 ${x}, ${y}`;
    toolbar.dataset.x = x;
    toolbar.dataset.y = y;
  }
}

// ============================================
// СОХРАНЕНИЕ РИСУНКА
// ============================================
async function saveDrawing() {
  const toolbar = document.getElementById('toolbar');
  if (!toolbar) return;
  
  const x = parseInt(toolbar.dataset.x);
  const y = parseInt(toolbar.dataset.y);
  
  if (!canvas) {
    alert('Ошибка: холст не найден');
    return;
  }
  
  const imageData = canvas.toDataURL('image/png');
  
  const cellData = {
    x: x,
    y: y,
    image_data: imageData,
    status: 'active'
  };
  
  try {
    const path = `/rest/v1/cells?select=*`;
    const url = `${SUPABASE_URL}/api/proxy?path=${encodeURIComponent(path)}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(cellData)
    });
    
    if (response.ok) {
      currentUserPosition = { x, y };
      localStorage.setItem('currentUserPosition', JSON.stringify(currentUserPosition));
      
      drawnPixels.add(`${x},${y}`);
      cellsData[`${x},${y}`] = cellData;
      
      updateCellVisual(x, y, imageData);
      updateCounter();
      
      toolbar.classList.add('hidden');
      alert('✅ Рисунок сохранён! Теперь вы не можете рисовать снова.');
      
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    } else {
      const error = await response.json();
      alert('Ошибка: ' + (error.message || 'Не удалось сохранить'));
    }
  } catch (error) {
    alert('Ошибка соединения: ' + error.message);
  }
}

// ============================================
// ВИЗУАЛИЗАЦИЯ ЯЧЕЕК
// ============================================
function updateCellVisual(x, y, imageData) {
  const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
  if (cell) {
    cell.classList.add('occupied');
    cell.style.backgroundImage = `url(${imageData})`;
    cell.style.backgroundSize = 'contain';
    cell.style.backgroundPosition = 'center';
    cell.style.backgroundRepeat = 'no-repeat';
  }
}

// ============================================
// ЗАГРУЗКА ДАННЫХ
// ============================================
async function loadGridData() {
  try {
    const path = `/rest/v1/cells?select=*&status=eq.active&order=created_at.asc`;
    const url = `${SUPABASE_URL}/api/proxy?path=${encodeURIComponent(path)}`;
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      const cells = await response.json();
      cells.forEach(cell => {
        drawnPixels.add(`${cell.x},${cell.y}`);
        cellsData[`${cell.x},${cell.y}`] = cell;
        updateCellVisual(cell.x, cell.y, cell.image_data);
      });
      updateCounter();
    }
  } catch (error) {
    console.error('Error loading cells:', error);
  }
}

// ============================================
// СЧЁТЧИК
// ============================================
async function updateCounter() {
  try {
    const path = `/rest/v1/cells?select=x,y&status=eq.active`;
    const url = `${SUPABASE_URL}/api/proxy?path=${encodeURIComponent(path)}`;
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const count = Array.isArray(data) ? data.length : 0;
      const counterEl = document.getElementById('counter');
      if (counterEl) counterEl.textContent = count;
    }
  } catch (error) {
    console.error('Error counting:', error);
  }
}

// ============================================
// ПАЛИТРА ЦВЕТОВ
// ============================================
function createColorPalette() {
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff', '#000000', '#ffa500', '#800080', '#008000', '#ff69b4'];
  const palette = document.getElementById('colorPalette');
  if (!palette) return;
  
  colors.forEach(color => {
    const btn = document.createElement('button');
    btn.className = 'color-btn';
    btn.style.backgroundColor = color;
    btn.dataset.color = color;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentColor = color;
    });
    palette.appendChild(btn);
  });
  
  if (palette.firstChild) palette.firstChild.classList.add('active');
}

// ============================================
// ПАНЕЛЬ ИНСТРУМЕНТОВ
// ============================================
function setupToolbar() {
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTool = btn.dataset.tool;
      if (currentTool === 'eraser') {
        currentColor = '#ffffff';
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      }
    });
  });
  
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSize = parseInt(btn.dataset.size);
    });
  });
}

function setupToolbarButtons() {
  const btnClose = document.getElementById('btnCloseToolbar');
  if (btnClose) btnClose.addEventListener('click', () => document.getElementById('toolbar').classList.add('hidden'));
  
  const btnClear = document.getElementById('btnClear');
  if (btnClear) btnClear.addEventListener('click', () => { if (ctx) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); } });
  
  const btnSave = document.getElementById('btnSave');
  if (btnSave) btnSave.addEventListener('click', saveDrawing);
}

// ============================================
// РИСОВАНИЕ НА CANVAS
// ============================================
function setupCanvasDrawing() {
  canvas = document.getElementById('drawCanvas');
  if (!canvas) return;
  
  ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }
  
  function startDrawing(e) {
    isDrawingOnCanvas = true;
    lastPos = getPos(e);
    draw(e);
  }
  
  function stopDrawing() {
    isDrawingOnCanvas = false;
  }
  
  function draw(e) {
    if (!isDrawingOnCanvas) return;
    e.preventDefault();
    const pos = getPos(e);
    if (currentTool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
    } else {
      ctx.strokeStyle = currentColor;
    }
    ctx.lineWidth = currentSize * 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos = pos;
  }
  
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);
  canvas.addEventListener('touchstart', startDrawing, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDrawing);
}

// ============================================
// ZOOM / PAN (ТЕЛЕФОН + ПК)
// ============================================
// ============================================
// ZOOM / PAN (ИСПРАВЛЕНО ДЛЯ ТЕЛЕФОНА!)
// ============================================
function setupViewportControls() {
  const viewport = document.getElementById('viewport');
  const grid = document.getElementById('grid');
  if (!viewport || !grid) return;
  
  // Mouse events (ПК)
  viewport.addEventListener('mousedown', startDrag);
  viewport.addEventListener('mousemove', drag);
  viewport.addEventListener('mouseup', stopDrag);
  viewport.addEventListener('mouseout', stopDrag);
  viewport.addEventListener('wheel', handleWheel, { passive: false });
  
  // Touch events (ТЕЛЕФОН) - ТОЛЬКО для пустого места!
  viewport.addEventListener('touchstart', handleTouchStart, { passive: false });
  viewport.addEventListener('touchmove', handleTouchMove, { passive: false });
  viewport.addEventListener('touchend', handleTouchEnd);
  
  let touchStartTime = 0;
  let touchStartPos = { x: 0, y: 0 };
  
  function startDrag(e) {
    // Drag только если кликнули по пустому месту (не по клетке)
    if (e.target === viewport || e.target === grid) {
      isDragging = true;
      dragStart = { x: e.clientX - gridOffset.x, y: e.clientY - gridOffset.y };
      viewport.style.cursor = 'grabbing';
      e.preventDefault();
    }
  }
  function drag(e) {
    if (!isDragging) return;
    gridOffset.x = e.clientX - dragStart.x;
    gridOffset.y = e.clientY - dragStart.y;
    updateGridTransform();
  }
  function stopDrag() {
    isDragging = false;
    viewport.style.cursor = 'grab';
  }
  function handleWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    scale *= delta;
    scale = Math.max(0.1, Math.min(3, scale));
    updateGridTransform();
  }
  
  // 🔧 TOUCH ФУНКЦИИ - НЕ ПЕРЕКРЫВАЮТ КЛИКИ ПО КЛЕТКАМ
  function handleTouchStart(e) {
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Если коснулись КЛЕТКИ - не начинаем drag, пусть сработает click
    if (target && target.classList.contains('cell')) {
      return; // Не предотвращаем, пусть click сработает
    }
    
    // Если коснулись ПУСТОГО МЕСТА - начинаем drag
    if (e.touches.length === 1) {
      isDragging = true;
      dragStart = { 
        x: touch.clientX - gridOffset.x, 
        y: touch.clientY - gridOffset.y 
      };
      touchStartTime = Date.now();
      touchStartPos = { x: touch.clientX, y: touch.clientY };
      e.preventDefault();
    } else if (e.touches.length === 2) {
      // Два пальца = зум
      lastTouchDistance = getTouchDistance(e.touches);
      e.preventDefault();
    }
  }
  
  function handleTouchMove(e) {
    // Если начали drag по пустому месту
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartPos.x);
      const dy = Math.abs(touch.clientY - touchStartPos.y);
      
      // Если переместили палец больше чем на 10px - это точно drag, не click
      if (dx > 10 || dy > 10) {
        gridOffset.x = touch.clientX - dragStart.x;
        gridOffset.y = touch.clientY - dragStart.y;
        updateGridTransform();
      }
      e.preventDefault();
    } else if (e.touches.length === 2) {
      // Зум двумя пальцами
      const newDistance = getTouchDistance(e.touches);
      const delta = newDistance / lastTouchDistance;
      scale *= delta;
      scale = Math.max(0.1, Math.min(3, scale));
      lastTouchDistance = newDistance;
      updateGridTransform();
      e.preventDefault();
    }
  }
  
  function handleTouchEnd() {
    isDragging = false;
  }
  
  function getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  function updateGridTransform() {
    grid.style.transform = `translate(${gridOffset.x}px, ${gridOffset.y}px) scale(${scale})`;
  }
}

// ============================================
// МОДАЛЬНОЕ ОКНО ЖАЛОБЫ
// ============================================
function showReportModal(x, y) {
  const modal = document.getElementById('reportModal');
  const btnReport = document.getElementById('btnReport');
  const btnClose = document.getElementById('btnReportClose');
  if (!modal) return;
  
  modal.classList.remove('hidden');
  
  const handleClose = () => modal.classList.add('hidden');
  if (btnClose) btnClose.onclick = handleClose;
  if (btnReport) {
    btnReport.onclick = async () => {
      try {
        const path = `/rest/v1/cells?select=report_count&x=eq.${x}&y=eq.${y}`;
        const url = `${SUPABASE_URL}/api/proxy?path=${encodeURIComponent(path)}`;
        const response = await fetch(url, { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } });
        if (response.ok) {
          const data = await response.json();
          if (data[0]) {
            const newCount = (data[0].report_count || 0) + 1;
            const updatePath = `/rest/v1/cells`;
            const updateUrl = `${SUPABASE_URL}/api/proxy?path=${encodeURIComponent(updatePath)}`;
            await fetch(updateUrl, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
              body: JSON.stringify({ report_count: newCount })
            });
            alert('🚩 Жалоба отправлена!');
          }
        }
      } catch (error) { console.error('Report error:', error); }
      handleClose();
    };
  }
  modal.addEventListener('click', (e) => { if (e.target === modal) handleClose(); });
}

// ============================================
// КНОПКА ПОДЕЛИТЬСЯ
// ============================================
function setupShare() {
  const shareBtn = document.getElementById('btnShare');
  if (!shareBtn) return;
  shareBtn.addEventListener('click', async () => {
    try {
      await navigator.share({ title: '🎨 Коллективное Полотно 10000', text: 'Присоединяйся к созданию коллективного полотна!', url: window.location.href });
    } catch (err) {
      await navigator.clipboard.writeText(window.location.href);
      alert('🔗 Ссылка скопирована в буфер обмена!');
    }
  });
}
