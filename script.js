// ⚙️ НАСТРОЙКИ SUPABASE
const SUPABASE_URL = 'https://dshyrsxhqevvqbbqbnto.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzaHlyc3hocWV2dnFiYnFibnRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDAyMzEsImV4cCI6MjA5MjM3NjIzMX0.Owrda92DRalj6uNzoMDUEkOEThfdNLtCn9m-5xM03q8';

// Создаём клиент (имя переменной изменено на supabaseClient)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const GRID_SIZE = 100;
const CELL_SIZE = 32;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

let scale = 1;
let panX = 0;
let panY = 0;
let isDragging = false;
let startX, startY;
let currentCell = null;
let isDrawing = false;
let brushSize = 1;
let currentColor = '#000000';

const grid = document.getElementById('grid');
const viewport = document.getElementById('viewport');
const counter = document.getElementById('counter');
const modal = document.getElementById('modal');
const reportModal = document.getElementById('reportModal');
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
const cellCoords = document.getElementById('cell-coords');

const colors = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#78350f', '#57534e'
];

async function init() {
  createGrid();
  createColorPalette();
  setupEventListeners();
  setupBrushSizes();
  await loadGridData();
  subscribeToUpdates();
  updateCounter();
}

function createGrid() {
  grid.innerHTML = '';
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.addEventListener('click', () => handleCellClick(x, y));
      grid.appendChild(cell);
    }
  }
}

function createColorPalette() {
  const container = document.getElementById('colors');
  colors.forEach(color => {
    const btn = document.createElement('div');
    btn.className = 'color-btn';
    btn.style.background = color;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentColor = color;
    });
    container.appendChild(btn);
  });
  container.firstChild.classList.add('active');
}

function setupEventListeners() {
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    zoom(e.clientX, e.clientY, delta);
  });

  viewport.addEventListener('mousedown', (e) => {
    if (e.target === grid || e.target === viewport) {
      isDragging = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
      viewport.style.cursor = 'grabbing';
    }
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
      if (e.target === grid || e.target === viewport) {
        isDragging = true;
        startX = e.touches[0].clientX - panX;
        startY = e.touches[0].clientY - panY;
      }
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

  document.getElementById('btnClose').addEventListener('click', closeModal);
  document.getElementById('btnReportClose').addEventListener('click', () => {
    reportModal.classList.add('hidden');
  });
  document.getElementById('btnReport').addEventListener('click', handleReport);
  document.getElementById('btnSave').addEventListener('click', saveDrawing);
  document.getElementById('btnClear').addEventListener('click', clearCanvas);

  setupCanvasDrawing();
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
  const newScale = Math.min(Math.max(scale * delta, 0.1), 5);
  panX = x - (x - panX) * (newScale / scale);
  panY = y - (y - panY) * (newScale / scale);
  scale = newScale;
  updateTransform();
}

function updateTransform() {
  grid.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

function setupCanvasDrawing() {
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
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
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

function setupBrushSizes() {
  document.querySelectorAll('.brush-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.brush-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      brushSize = parseInt(btn.dataset.size);
    });
  });
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

async function handleCellClick(x, y) {
  const cell = grid.children[y * GRID_SIZE + x];
  
  if (cell.classList.contains('occupied')) {
    currentCell = { x, y };
    reportModal.classList.remove('hidden');
    return;
  }

  if (localStorage.getItem('hasDrawn') === 'true') {
    alert('Вы уже нарисовали свой рисунок. Можно только один раз!');
    return;
  }

  currentCell = { x, y };
  cellCoords.textContent = `Клетка: ${x}, ${y}`;
  clearCanvas();
  modal.classList.remove('hidden');
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
        image_data: imageData,
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
    cell.style.background = `url(${imageData}) center/cover`;
    cell.classList.add('occupied');
    
    closeModal();
    updateCounter();
    
    alert('🎨 Рисунок сохранён!');
  } catch (err) {
    console.error('Error saving:', err);
    alert('Ошибка при сохранении.');
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

    reportModal.classList.add('hidden');
    alert('Жалоба отправлена. Спасибо!');
  } catch (err) {
    console.error('Error reporting:', err);
    alert('Ошибка при отправке жалобы.');
  }
}

function closeModal() {
  modal.classList.add('hidden');
  currentCell = null;
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
        cellEl.style.background = `url(${cell.image_data}) center/cover`;
        cellEl.classList.add('occupied');
      }
    });

    counter.textContent = data.length;
  } catch (err) {
    console.error('Error loading data:', err);
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
          cell.style.background = `url(${image_data}) center/cover`;
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
