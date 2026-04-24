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
let drawnPixels = new Set();
let cellsData = {};
let canvas = null;
let ctx = null;
let isDrawingOnCanvas = false;
let lastPos = { x: 0, y: 0 };

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
// ПРИВЕТСТВЕННЫЙ ЭКРАН
// ============================================
function setupWelcomeScreen() {
  const welcomeScreen = document.getElementById('welcomeScreen');
  const agreeButton = document.getElementById('btnAgree');
  
  if (welcomeScreen) {
    welcomeScreen.classList.remove('hidden');
  }
  
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
      
      cell.addEventListener('click', (e) => {
        e.stopPropagation();
        handleCellClick(x, y);
      });
      
      grid.appendChild(cell);
    }
  }
}

// ============================================
// ОБРАБОТКА КЛИКОВ
// ============================================
async function handleCellClick(x, y) {
  const isOccupied = drawnPixels.has(`${x},${y}`);
  
  if (isOccupied) {
    showReportModal(x, y);
    return;
  }
  
  if (currentUserPosition) {
    alert('⚠️ Вы уже нарисовали на позиции ' + currentUserPosition.x + ', ' + currentUserPosition.y + '!\n\nМожно рисовать только ОДИН раз.');
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
// ZOOM / PAN (РАБОТАЕТ!)
// ============================================
function setupViewportControls() {
  const viewport = document.getElementById('viewport');
  const grid = document.getElementById('grid');
  if (!viewport || !grid) return;
  
  // ПК - Mouse
  viewport.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('cell')) return;
    
    isDragging = true;
    dragStart = { x: e.clientX - gridOffset.x, y: e.clientY - gridOffset.y };
    viewport.style.cursor = 'grabbing';
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    gridOffset.x = e.clientX - dragStart.x;
    gridOffset.y = e.clientY - dragStart.y;
    grid.style.transform = `translate(${gridOffset.x}px, ${gridOffset.y}px) scale(${scale})`;
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
    viewport.style.cursor = 'grab';
  });
  
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.95 : 1.05;
    scale *= delta;
    scale = Math.max(0.3, Math.min(2, scale));
    grid.style.transform = `translate(${gridOffset.x}px, ${gridOffset.y}px) scale(${scale})`;
  }, { passive: false });
  
  // Телефон - Touch
  let touchStartX = 0, touchStartY = 0;
  
  viewport.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      
      if (target && target.classList.contains('cell')) {
        target.classList.add('touch-highlight');
        isDragging = false;
        return;
      }
      
      isDragging = true;
      touchStartX = touch.clientX - gridOffset.x;
      touchStartY = touch.clientY - gridOffset.y;
    }
  }, { passive: true });
  
  viewport.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      gridOffset.x = touch.clientX - touchStartX;
      gridOffset.y = touch.clientY - touchStartY;
      grid.style.transform = `translate(${gridOffset.x}px, ${gridOffset.y}px) scale(${scale})`;
      e.preventDefault();
    }
  }, { passive: false });
  
  viewport.addEventListener('touchend', () => {
    isDragging = false;
    document.querySelectorAll('.touch-highlight').forEach(el => {
      el.classList.remove('touch-highlight');
    });
  });
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
        
        const response = await fetch(url, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && data[0]) {
            const newCount = (data[0].report_count || 0) + 1;
            
            const updatePath = `/rest/v1/cells?x=eq.${x}&y=eq.${y}`;
            const updateUrl = `${SUPABASE_URL}/api/proxy?path=${encodeURIComponent(updatePath)}`;
            
            await fetch(updateUrl, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
              },
              body: JSON.stringify({ report_count: newCount })
            });
            
            alert('🚩 Жалоба отправлена!');
          }
        }
      } catch (error) {
        console.error('Report error:', error);
      }
      handleClose();
    };
  }
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) handleClose();
  });
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
