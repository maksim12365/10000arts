// ============================================
// МОЯ ПОЗИЦИЯ (БЫСТРЫЙ ПЕРЕХОД)
// ============================================

function goToMyPosition() {
  // Проверяем, рисовал ли пользователь
  const userPos = localStorage.getItem('currentUserPosition');
  
  if (!userPos) {
    alert('❌ Вы ещё не нарисовали!\n\nСначала выберите клетку, нарисуйте и нажмите "Сохранить".');
    return;
  }
  
  const position = JSON.parse(userPos);
  const { x, y } = position;
  
  // Находим клетку
  const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
  
  if (!cell) {
    alert('❌ Не удалось найти вашу клетку. Попробуйте обновить страницу.');
    return;
  }
  
  // Плавная прокрутка к клетке
  cell.scrollIntoView({ 
    behavior: 'smooth', 
    block: 'center',
    inline: 'center'
  });
  
  // Подсветка клетки
  const originalBoxShadow = cell.style.boxShadow;
  const originalTransform = cell.style.transform;
  
  cell.style.boxShadow = '0 0 30px 8px gold';
  cell.style.zIndex = '1000';
  cell.style.transform = 'scale(1.2)';
  
  // Убираем подсветку через 3 секунды
  setTimeout(() => {
    cell.style.boxShadow = originalBoxShadow;
    cell.style.zIndex = '';
    cell.style.transform = originalTransform;
  }, 3000);
  
  console.log('✅ Переход к позиции:', x, y);
}

// Инициализация (если нужно)
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ My Position module loaded');
});

// Делаем функцию доступной глобально
window.goToMyPosition = goToMyPosition;
