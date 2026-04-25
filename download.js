// ============================================
// СКАЧАТЬ СВОЙ РИСУНОК (РАБОТАЕТ!)
// ============================================

// Генерируем уникальный ID для пользователя
let userId = localStorage.getItem('userId');
if (!userId) {
  userId = 'user_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('userId', userId);
}

// Храним клетки которые нарисовал текущий пользователь
let userCells = [];

function downloadDrawing() {
  const grid = document.getElementById('grid');
  if (!grid) {
    alert('❌ Полотно не найдено!');
    return;
  }
  
  // Создаём canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Размер 100x100 клеток по 32 пикселя
  const gridSize = 100;
  const cellSize = 32;
  canvas.width = gridSize * cellSize;
  canvas.height = gridSize * cellSize;
  
  // Белый фон
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Получаем ВСЕ клетки
  const cells = grid.querySelectorAll('.cell');
  
  // Если есть сохранённые клетки пользователя
  if (userCells.length > 0) {
    // Рисуем ТОЛЬКО клетки пользователя
    userCells.forEach(cellData => {
      ctx.fillStyle = cellData.color;
      ctx.fillRect(
        cellData.col * cellSize,
        cellData.row * cellSize,
        cellSize,
        cellSize
      );
    });
    console.log('✅ Скачан ТОЛЬКО твой рисунок:', userCells.length, 'клеток');
  } else {
    // Если нет сохранённых - скачиваем всё полотно
    cells.forEach(cell => {
      const col = parseInt(cell.dataset.col || 0);
      const row = parseInt(cell.dataset.row || 0);
      const bgColor = window.getComputedStyle(cell).backgroundColor;
      
      // Рисуем только закрашенные клетки
      if (bgColor && bgColor !== 'rgb(255, 255, 255)' && bgColor !== 'rgba(0, 0, 0, 0)') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    });
    console.log('✅ Скачано всё полотно');
  }
  
  // Скачиваем файл
  const link = document.createElement('a');
  link.download = `my-art-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  
  console.log('🎨 Drawing downloaded!');
}

// Функция для отслеживания клеток пользователя
function trackUserCell(col, row, color) {
  // Удаляем старую клетку с этими координатами если есть
  userCells = userCells.filter(c => c.col !== col || c.row !== row);
  
  // Добавляем новую
  userCells.push({ col, row, color, userId });
  
  // Сохраняем в localStorage (на случай перезагрузки)
  localStorage.setItem('userCells', JSON.stringify(userCells));
}

// Загружаем сохранённые клетки при старте
function loadUserCells() {
  const saved = localStorage.getItem('userCells');
  if (saved) {
    userCells = JSON.parse(saved);
    console.log('✅ Загружено сохранённых клеток:', userCells.length);
  }
}

// Добавляем кнопку при загрузке
document.addEventListener('DOMContentLoaded', () => {
  loadUserCells();
  
  const button = document.getElementById('downloadBtn');
  if (button) {
    button.addEventListener('click', downloadDrawing);
    console.log('✅ Download button initialized');
  }
});

// Делаем функции доступными извне
window.trackUserCell = trackUserCell;
window.userId = userId;
