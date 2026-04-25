// ============================================
// МИНИ-КАРТА ПОЛОТНА
// ============================================

const MINIMAP_CONFIG = {
  cellSize: 3,  // Размер клетки на карте (пиксели)
  gap: 0,       // Расстояние между клетками
  scale: 1      // Масштаб карты
};

let minimapElement = null;
let minimapGrid = null;

function initMinimap() {
  // Создаём контейнер мини-карты
  minimapElement = document.createElement('div');
  minimapElement.id = 'minimap-container';
  minimapElement.innerHTML = `
    <div class="minimap-header">
      <span>🗺️ Карта полотна</span>
      <button class="minimap-toggle" onclick="toggleMinimap()">−</button>
    </div>
    <div class="minimap-wrapper">
      <div id="minimap-grid" class="minimap-grid"></div>
    </div>
    <div class="minimap-legend">
      <span class="legend-item"><span class="legend-dot empty"></span> Пусто</span>
      <span class="legend-item"><span class="legend-dot occupied"></span> Занято</span>
    </div>
  `;
  
  document.body.appendChild(minimapElement);
  minimapGrid = document.getElementById('minimap-grid');
  
  // Создаём сетку 100x100
  createMinimapGrid();
  
  // Обновляем при загрузке страницы
  setTimeout(updateMinimap, 1000);
  
  // Клик по мини-карте — переход к клетке
  minimapGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('minimap-cell')) {
      const x = parseInt(e.target.dataset.x);
      const y = parseInt(e.target.dataset.y);
      goToCellPosition(x, y);
    }
  });
  
  console.log('✅ Minimap initialized');
}

function createMinimapGrid() {
  if (!minimapGrid) return;
  
  minimapGrid.innerHTML = '';
  const gridSize = 100;
  
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cell = document.createElement('div');
      cell.className = 'minimap-cell';
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.style.left = (x * MINIMAP_CONFIG.cellSize) + 'px';
      cell.style.top = (y * MINIMAP_CONFIG.cellSize) + 'px';
      minimapGrid.appendChild(cell);
    }
  }
  
  // Устанавливаем размер сетки
  minimapGrid.style.width = (gridSize * MINIMAP_CONFIG.cellSize) + 'px';
  minimapGrid.style.height = (gridSize * MINIMAP_CONFIG.cellSize) + 'px';
}

function updateMinimap() {
  if (!minimapGrid) return;
  
  // Находим все занятые клетки
  const occupiedCells = document.querySelectorAll('.cell.occupied');
  
  // Сбрасываем все клетки
  minimapGrid.querySelectorAll('.minimap-cell').forEach(cell => {
    cell.classList.remove('occupied');
  });
  
  // Отмечаем занятые
  occupiedCells.forEach(cell => {
    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);
    const minimapCell = minimapGrid.querySelector(`.minimap-cell[data-x="${x}"][data-y="${y}"]`);
    if (minimapCell) {
      minimapCell.classList.add('occupied');
    }
  });
  
  // Обновляем счётчик
  const count = occupiedCells.length;
  const percent = ((count / 10000) * 100).toFixed(2);
  document.getElementById('minimap-count').textContent = `${count} / 10000 (${percent}%)`;
  
  console.log('🗺️ Minimap updated:', count, 'cells');
}

function goToCellPosition(x, y) {
  const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
  if (!cell) return;
  
  // Плавно прокручиваем к клетке
  cell.scrollIntoView({ 
    behavior: 'smooth', 
    block: 'center',
    inline: 'center'
  });
  
  // Подсветка
  const originalBoxShadow = cell.style.boxShadow;
  cell.style.boxShadow = '0 0 20px 5px #667eea';
  cell.style.zIndex = '1000';
  
  setTimeout(() => {
    cell.style.boxShadow = originalBoxShadow;
    cell.style.zIndex = '';
  }, 2000);
  
  console.log('📍 Navigated to:', x, y);
}

function toggleMinimap() {
  const container = document.getElementById('minimap-container');
  const wrapper = container.querySelector('.minimap-wrapper');
  const toggle = container.querySelector('.minimap-toggle');
  
  if (wrapper.style.display === 'none') {
    wrapper.style.display = 'block';
    toggle.textContent = '−';
  } else {
    wrapper.style.display = 'none';
    toggle.textContent = '+';
  }
}

// Обновляем мини-карту при загрузке данных
const originalLoadGridData = window.loadGridData;
if (originalLoadGridData) {
  window.loadGridData = async function() {
    await originalLoadGridData();
    setTimeout(updateMinimap, 500);
  };
}

// Инициализация
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMinimap);
} else {
  initMinimap();
}

// Делаем функции доступными
window.updateMinimap = updateMinimap;
window.toggleMinimap = toggleMinimap;
window.goToCellPosition = goToCellPosition;
