// ============================================
// ПРЕДПРОСМОТР ПРИ НАВЕДЕНИИ
// ============================================

let previewElement = null;

function initPreview() {
  const grid = document.getElementById('grid');
  if (!grid) return;
  
  // Создаём элемент предпросмотра
  previewElement = document.createElement('div');
  previewElement.id = 'cellPreview';
  previewElement.className = 'cell-preview';
  previewElement.innerHTML = `
    <div class="preview-content">
      <img src="" alt="Preview" class="preview-image">
      <div class="preview-coords"></div>
    </div>
  `;
  document.body.appendChild(previewElement);
  
  // Наведение на клетку
  grid.addEventListener('mouseover', (e) => {
    if (e.target.classList.contains('cell') && e.target.classList.contains('occupied')) {
      showPreview(e.target);
    }
  });
  
  // Уход с клетки
  grid.addEventListener('mouseout', (e) => {
    if (e.target.classList.contains('cell')) {
      hidePreview();
    }
  });
  
  // Движение мыши (для следования за курсором)
  document.addEventListener('mousemove', (e) => {
    if (previewElement && previewElement.style.display === 'block') {
      movePreview(e.clientX, e.clientY);
    }
  });
  
  console.log('✅ Preview module initialized');
}

function showPreview(cell) {
  if (!previewElement) return;
  
  // Извлекаем URL изображения
  const bgImage = cell.style.backgroundImage;
  const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
  
  if (!match || !match[1]) return;
  
  const imageUrl = match[1];
  const x = cell.dataset.x;
  const y = cell.dataset.y;
  
  // Устанавливаем изображение
  const img = previewElement.querySelector('.preview-image');
  const coords = previewElement.querySelector('.preview-coords');
  
  img.src = imageUrl;
  coords.textContent = `📍 ${x}, ${y}`;
  
  // Показываем предпросмотр
  previewElement.style.display = 'block';
  
  console.log('🔍 Preview:', x, y);
}

function hidePreview() {
  if (previewElement) {
    previewElement.style.display = 'none';
  }
}

function movePreview(x, y) {
  if (!previewElement) return;
  
  // Смещение чтобы не закрывать курсор
  const offsetX = 20;
  const offsetY = 20;
  
  // Проверяем чтобы не выходило за экран
  const rect = previewElement.getBoundingClientRect();
  const maxX = window.innerWidth - rect.width - 10;
  const maxY = window.innerHeight - rect.height - 10;
  
  previewElement.style.left = Math.min(x + offsetX, maxX) + 'px';
  previewElement.style.top = Math.min(y + offsetY, maxY) + 'px';
}

// Инициализация после загрузки страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPreview);
} else {
  initPreview();
}
