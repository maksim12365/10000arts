// ⚙️ НАСТРОЙКИ SUPABASE
const SUPABASE_URL = 'https://dshyrsxhqevvqbbqbnto.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzaHlyc3hocWV2dnFiYnFibnRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDAyMzEsImV4cCI6MjA5MjM3NjIzMX0.Owrda92DRalj6uNzoMDUEkOEThfdNLtCn9m-5xM03q8';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const GRID_SIZE = 100;
const CELL_SIZE = 32;
const CANVAS_SIZE = 256;

let scale = 1;
let panX = 0;
let panY = 0;
let isDragging = false;
let startX, startY;
let currentCell = null;
let isDrawing = false;
let brushSize = 2;
let currentColor = '#000000';
let currentTool = 'brush';

const welcomeScreen = document.getElementById('welcomeScreen');
const grid = document.getElementById('grid');
const viewport = document.getElementById('viewport');
const counter = document.getElementById('counter');
const toolbar = document.getElementById('toolbar');
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
const cellInfo = document.getElementById('cellInfo');
const colorPalette = document.getElementById('colorPalette');

const colors = [
  '#000000', '#ffffff', '#dc2626', '#ea580c', '#d97706',
  '#65a30d', '#16a34a', '#059669', '#0891b2', '#0284c7',
  '#2563eb', '#4f46e5', '#7c3aed', '#a855f7', '#c026d3',
  '#db2777', '#e11d48', '#991b1b', '#78350f', '#57534e'
];

function init() {
  setupWelcomeScreen();
  createGrid();
  createColorPalette();
  setupToolbar();
  setupCanvasDrawing();
  setupViewportControls();
  loadGridData();
  subscribeToUpdates();
  updateCounter();
}

function setupWelcomeScreen() {
  const btnAgree = document.getElementById('btnAgree');
  
  if (btnAgree) {
    btnAgree.addEventListener('click', () => {
      try {
        localStorage.setItem('agreedToRules', 'true');
      } catch(e) {}
      welcomeScreen.classList.add('hidden');
    });
  }
  
  try {
    if (localStorage.getItem('agreedToRules') === 'true') {
      welcomeScreen.classList.add('hidden');
    }
  } catch(e) {}
}

function createGrid() {
  grid.style.width = `${GRID_SIZE * CELL_SIZE}px`;
  grid.style.height = `${GRID_SIZE * CELL_SIZE}px`;
  
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.style.left = `${x * CELL_SIZE}px`;
      cell.style.top = `${y * CELL_SIZE}px`;
      cell.style.width = `${CELL_SIZE}px`;
      cell.style.height = `${CELL_SIZE}px`;
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.addEventListener('click', () => handleCellClick(x, y));
      grid.appendChild(cell);
    }
  }
}

function createColorPalette() {
  colors.forEach((color, index) => {
    const btn = document.createElement('div');
    btn.className = 'color-btn';
    btn.style.background = color;
    if (index === 0) btn.classList.add('active');
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentColor = color;
      currentTool = 'brush';
      updateToolButtons();
    });
    colorPalette.appendChild(btn);
  });
}

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
      brushSize = parseInt(btn.dataset.size);
    });
  });
  
  // 🔧 ЗАКРЫТИЕ ТОЛЬКО ПО КНОПКЕ ✕
  document.getElementById('btnCloseToolbar').addEventListener('click', closeToolbar);
  document.getElementById('btnClear').addEventListener('click', clearCanvas);
  document.getElementById('btnSave').addEventListener('click', saveDrawing);
  document.getElementById('btnReport').addEventListener('click', handleReport);
  document.getElementById('btnReportClose').addEventListener('click', () => {
    document.getElementById('reportModal').classList.add('hidden');
  });
}

function updateToolButtons() {
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === currentTool);
  });
}

function setupCanvasDrawing() {
  clearCanvas();
  
  let lastX = 0;
  let lastY = 0;

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    const pos = getPos(e);
    lastX = pos.x;
    lastY = pos.y;
    draw(e);
  }

  function stopDrawing() {
    isDrawing = false;
  }

  function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    
    const pos = getPos(e);
    
    ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : currentColor;
    ctx.lineWidth = brushSize * (canvas.width / 32);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    lastX = pos.x;
    lastY = pos.y;
  }

  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);
  
  canvas.addEventListener('touchstart', startDrawing, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDrawing);
}

function setupViewportControls() {
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    zoom(e.clientX, e.clientY, delta);
  });

  viewport.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
    viewport.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      e.preventDefault();
      panX = e.clientX - startX;
      panY = e.clientY - startY;
      updateTransform();
    }
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    viewport.style.cursor = 'grab';
  });

  let initialPinchDistance = null;

  viewport.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      initialPinchDistance = getPinchDistance(e.touches);
    } else if (e.touches.length === 1) {
      isDragging = true;
      startX = e.touches[0].clientX - panX;
      startY = e.touches[0].clientY - panY;
    }
  });

  viewport.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && initialPinchDistance) {
      e.preventDefault();
      const distance = getPinchDistance(e.touches);
      const delta = distance / initialPinchDistance;
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      zoom(centerX, centerY, delta);
      initialPinchDistance = distance;
    } else if (e.touches.length === 1 && isDragging) {
      e.preventDefault();
      panX = e.touches[0].clientX - startX;
      panY = e.touches[0].clientY - startY;
      updateTransform();
    }
  });

  viewport.addEventListener('touchend', () => {
    isDragging = false;
    initialPinchDistance = null;
  });
}

function getPinchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function zoom(centerX, centerY, delta) {
  const rect = viewport.getBoundingClientRect();
  const x = centerX - rect.left;
  const y = centerY - rect.top;
  
  const newScale = Math.min(Math.max(scale * delta, 0.3), 5);
  panX = x - (x - panX) * (newScale / scale);
  panY = y - (y - panY) * (newScale / scale);
  scale = newScale;
  
  updateTransform();
}

function updateTransform() {
  grid.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

function handleCellClick(x, y) {
  // 🔧 Если панель уже открыта - клик по полотну НЕ закрывает её
  if (!toolbar.classList.contains('hidden')) {
    return; // Игнорируем клики пока панель открыта
  }
  
  const cell = grid.children[y * GRID_SIZE + x];
  
  if (cell.classList.contains('occupied')) {
    currentCell = { x, y };
    document.getElementById('reportModal').classList.remove('hidden');
    return;
  }

  if (localStorage.getItem('hasDrawn') === 'true') {
    alert('Вы уже нарисовали свой рисунок. Можно только один раз!');
    return;
  }

  openToolbar(x, y);
}

function openToolbar(x, y) {
  currentCell = { x, y };
  cellInfo.textContent = `📍 Область: ${x}, ${y}`;
  clearCanvas();
  toolbar.classList.remove('hidden');
}

// 🔧 Закрывает ТОЛЬКО по кнопке ✕
function closeToolbar() {
  toolbar.classList.add('hidden');
  currentCell = null;
}

function clearCanvas() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

async function saveDrawing() {
  if (!currentCell) return;

  if (localStorage.getItem('hasDrawn') === 'true') {
    alert('Вы уже использовали свою попытку!');
    return;
  }

  const { x, y } = currentCell;
  const imageData = canvas.toDataURL('image/png');

  try {
    const { error } = await supabaseClient
      .from('cells')
      .insert({
        x: x,
        y: y,
        image_ imageData,
        status: 'active',
        report_count: 0
      });

    if (error) {
      if (error.code === '23505') {
        alert('Этот участок только что занял другой пользователь! Выберите другой.');
        return;
      }
      throw error;
    }

    localStorage.setItem('hasDrawn', 'true');
    
    const cell = grid.children[y * GRID_SIZE + x];
    cell.style.background = `url(${imageData}) center/cover no-repeat`;
    cell.classList.add('occupied');
    
    closeToolbar(); // 🔧 Закрывается ПОСЛЕ сохранения
    updateCounter();
    
    alert('🎨 Рисунок сохранён! Теперь он часть общего полотна.');
  } catch (err) {
    console.error('Error saving:', err);
    alert('Ошибка при сохранении. Попробуйте ещё раз.');
  }
}

async function handleReport() {
  if (!currentCell) return;
  const { x, y } = currentCell;

  try {
    const { data, error: fetchError } = await supabaseClient
      .from('cells')
      .select('report_count')
      .eq('x', x)
      .eq('y', y)
      .single();

    if (fetchError) throw fetchError;

    const newCount = (data.report_count || 0) + 1;
    
    const { error: updateError } = await supabaseClient
      .from('cells')
      .update({ report_count: newCount })
      .eq('x', x)
      .eq('y', y);

    if (updateError) throw updateError;

    document.getElementById('reportModal').classList.add('hidden');
    alert('Жалоба отправлена. Спасибо!');
  } catch (err) {
    console.error('Error reporting:', err);
    alert('Ошибка при отправке жалобы.');
  }
}

async function loadGridData() {
  try {
    const { data, error } = await supabaseClient
      .from('cells')
      .select('x, y, image_data, status')
      .eq('status', 'active');

    if (error) throw error;

    data.forEach(cell => {
      const index = cell.y * GRID_SIZE + cell.x;
      const cellEl = grid.children[index];
      if (cellEl) {
        cellEl.style.background = `url(${cell.image_data}) center/cover no-repeat`;
        cellEl.classList.add('occupied');
      }
    });

    counter.textContent = data.length;
  } catch (err) {
    console.error('Error loading ', err);
  }
}

function subscribeToUpdates() {
  supabaseClient
    .channel('cells_changes')
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'cells',
        filter: 'status=eq.active'
      }, 
      payload => {
        const { x, y, image_data } = payload.new;
        const index = y * GRID_SIZE + x;
        const cell = grid.children[index];
        if (cell) {
          cell.style.background = `url(${image_data}) center/cover no-repeat`;
          cell.classList.add('occupied');
          updateCounter();
        }
      }
    )
    .subscribe();
}

async function updateCounter() {
  try {
    const { count, error } = await supabaseClient
      .from('cells')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (error) throw error;
    counter.textContent = count || 0;
  } catch (err) {
    console.error('Error counting:', err);
  }
}

init();
