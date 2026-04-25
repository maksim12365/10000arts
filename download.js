// ============================================
// СКАЧАТЬ СВОЙ РИСУНОК (ДЛЯ 10000 ARTS)
// ============================================

function downloadDrawing() {
  // 1. Проверяем, рисовал ли пользователь
  const userPos = localStorage.getItem('currentUserPosition');
  
  if (!userPos) {
    alert('❌ Вы ещё не нарисовали свой рисунок!\n\nСначала выберите клетку, нарисуйте и нажмите "Сохранить".');
    return;
  }
  
  const position = JSON.parse(userPos);
  const { x, y } = position;
  
  // 2. Находим клетку с рисунком
  const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
  
  if (!cell || !cell.style.backgroundImage) {
    alert('❌ Не удалось найти ваш рисунок. Попробуйте обновить страницу.');
    return;
  }
  
  // 3. Извлекаем URL картинки из backgroundImage
  // Формат: url("data:image/png;base64,...")
  const bgImage = cell.style.backgroundImage;
  const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
  
  if (!match || !match[1]) {
    alert('❌ Ошибка: не удалось получить изображение');
    return;
  }
  
  const imageUrl = match[1];
  
  // 4. Создаём canvas и рисуем картинку
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Размер как у канваса для рисования (100x100 пикселей)
  canvas.width = 100;
  canvas.height = 100;
  
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  img.onload = function() {
    // Рисуем картинку на канвас
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // 5. Скачиваем файл
    const link = document.createElement('a');
    link.download = `my-art-${x}-${y}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    console.log('✅ Рисунок скачан:', x, y);
  };
  
  img.onerror = function() {
    alert('❌ Не удалось загрузить изображение. Попробуйте ещё раз.');
    console.error('❌ Image load error');
  };
  
  img.src = imageUrl;
}

// Инициализация кнопки
document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('downloadBtn');
  if (button) {
    button.addEventListener('click', downloadDrawing);
    console.log('✅ Download button ready');
  }
});
