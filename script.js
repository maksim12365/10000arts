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
let currentSize = 1;
let isDrawing = false;
let hasDrawn = false;
let currentUserPosition = null;
let gridOffset = { x: 0, y: 0 };
let scale = 1;
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let drawnPixels = new Set();
let cellsData = {};

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  setupWelcomeScreen();
  createGrid();
  createColorPalette();
  setupToolbar();
  setupCanvasDrawing();
  setupViewportControls();
  setupShare();
  loadGridData();
  subscribeToUpdates();
  updateCounter();
});

// ============================================
// ПРИВЕТСТВЕННЫЙ ЭКРАН
// ============================================
function setupWelcomeScreen() {
  const welcomeScreen = document.getElementById('welcomeScreen');
  const agreeButton = document.getElementById('agreeButton');
  
  if (localStorage.getItem('agreedToRules') === 'true') {
    welcomeScreen.classList.add('hidden');
  }
  
  agreeButton?.addEventListener('click', () => {
    localStorage.setItem('agreedToRules', 'true');
    welcomeScreen.classList.add('hidden');
  });
}

// ============================================
// СОЗДАНИЕ СЕТКИ
// ============================================
function createGrid() {
  const viewport = document.getElementById('viewport');
  const gridSize = 100;
  const cellSize = 32;
  
  const grid = document.createElement('div');
  grid.id = 'grid';
  grid.style.position = 'absolute';
  grid.style.width = (gridSize * cellSize) + 'px';
  grid.style.height = (gridSize * cellSize) + 'px';
  
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
      
      cell.addEventListener('click', () => handleCellClick(x, y));
      
      grid.appendChild(cell);
    }
  }
  
  viewport.appendChild(grid);
}

// ============================================
// ОБРАБОТКА КЛИКОВ
// ============================================
async function handleCellClick(x, y) {
  if (currentUserPosition) {
    alert('Вы уже нарисовали! Можно только один раз.');
    return;
  }
  
  if (drawnPixels.has(`${x},${y}`)) {
    alert('Эта клетка уже занята!');
    return;
  }
  
  const canvas = document.getElementById('drawCanvas');
  const ctx = canvas.getContext('2d');
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
      drawnPixels.add(`${x},${y}`);
      cellsData[`${x},${y}`] = cellData;
      
      updateCellVisual(x, y, imageData);
      updateCounter();
      
      alert('Рисунок сохранён!');
      document.getElementById('toolbar').classList.add('hidden');
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
    } else {
      console.error('Error loading data:', await response.text());
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// ============================================
// СЧЁТЧИК
// ============================================
async function updateCounter() {
  try {
    const path = `/rest/v1/cells?select=count&status=eq.active`;
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
      if (counterEl) {
        counterEl.textContent = `${count} / 10000`;
      }
    }
  } catch (error) {
    console.error('Error counting:', error);
  }
}

// ============================================
// ПАЛИТРА ЦВЕТОВ
// ============================================
function createColorPalette() {
  const colors = [
    '#ff0000', '#00ff00', '#0000ff', '#ffff00', 
    '#ff00ff', '#00ffff', '#ffffff', '#000000',
    '#ffa500', '#800080', '#008000', '#ff69b4'
  ];
  
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
  
  if (palette.firstChild) {
    palette.firstChild.classList.add('active');
  }
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

// ============================================
// РИСОВАНИЕ НА CANVAS
// ============================================
function setupCanvasDrawing() {
  const canvas = document.getElementById('drawCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  let isDrawingOnCanvas = false;
  let lastPos = { x: 0, y: 0 };
  
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }
  
  function startDrawing(e) {
    isDrawingOnCanvas = true;
    hasDrawn = true;
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
    ctx.strokeStyle = currentColor;
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
  
  canvas.addEventListener('touchstart', startDrawing);
  canvas.addEventListener('touchmove', draw);
  canvas.addEventListener('touchend', stopDrawing);
}

// ============================================
// УПРАВЛЕНИЕ ВИДОМ (ZOOM/PAN)
// ============================================
function setupViewportControls() {
  const viewport = document.getElementById('viewport');
  if (!viewport) return;
  
  viewport.addEventListener('mousedown', startDrag);
  viewport.addEventListener('mousemove', drag);
  viewport.addEventListener('mouseup', stopDrag);
  viewport.addEventListener('mouseout', stopDrag);
  
  viewport.addEventListener('wheel', handleWheel, { passive: false });
  
  function startDrag(e) {
    if (e.target === viewport || e.target.classList.contains('cell')) {
      isDragging = true;
      dragStart = { x: e.clientX - gridOffset.x, y: e.clientY - gridOffset.y };
      viewport.style.cursor = 'grabbing';
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
  
  function updateGridTransform() {
    const grid = document.getElementById('grid');
    if (grid) {
      grid.style.transform = `translate(${gridOffset.x}px, ${gridOffset.y}px) scale(${scale})`;
      grid.style.transformOrigin = '0 0';
    }
  }
}

// ============================================
// ПОДПИСКА НА ОБНОВЛЕНИЯ
// ============================================
function subscribeToUpdates() {
  // Realtime отключён для экономии
}

// ============================================
// КНОПКА ПОДЕЛИТЬСЯ
// ============================================
function setupShare() {
  const shareBtn = document.querySelector('.btn-share');
  if (!shareBtn) return;
  
  shareBtn.addEventListener('click', async () => {
    try {
      await navigator.share({
        title: 'Коллективное Полотно 10000',
        text: 'Присоединяйся к созданию коллективного полотна!',
        url: window.location.href
      });
    } catch (err) {
      alert('Ссылка скопирована в буфер обмена!');
    }
  });
}
