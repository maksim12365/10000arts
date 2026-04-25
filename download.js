// ============================================
// СКАЧАТЬ РИСУНОК (БЕЗОПАСНО!)
// ============================================

function downloadDrawing() {
  const grid = document.getElementById('grid');
  if (!grid) {
    alert('❌ Полотно не найдено!');
    return;
  }
  
  // Создаём canvas для экспорта
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Получаем размеры сетки
  const cells = grid.querySelectorAll('.cell');
  if (cells.length === 0) {
    alert('❌ Нет клеток для сохранения!');
    return;
  }
  
  // Считаем размер сетки (100x100 клеток)
  const gridSize = 100;
  const cellSize = 32; // Размер клетки в пикселях
  
  canvas.width = gridSize * cellSize;
  canvas.height = gridSize * cellSize;
  
  // Рисуем белый фон
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Копируем цвета всех клеток
  cells.forEach(cell => {
    const col = parseInt(cell.dataset.col);
    const row = parseInt(cell.dataset.row);
    const style = window.getComputedStyle(cell);
    const bgColor = style.backgroundColor;
    
    // Рисуем только закрашенные клетки (не белые)
    if (bgColor !== 'rgb(255, 255, 255)' && bgColor !== 'rgba(0, 0, 0, 0)') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
  });
  
  // Скачиваем файл
  const link = document.createElement('a');
  link.download = `my-art-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  
  console.log('✅ Drawing downloaded!');
}

// Добавляем кнопку при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('downloadBtn');
  if (button) {
    button.addEventListener('click', downloadDrawing);
    console.log('✅ Download button initialized');
  }
});
