// ============================================
// СПИДРАН РИСУНОК (TIME ATTACK)
// ============================================

const SPEEDRUN_CONFIG = {
  active: false,
  startTime: null,
  cellsDrawn: 0,
  bestTime: null,
  bestCells: 0,
  history: []
};

// Загрузка данных
function loadSpeedrunData() {
  const saved = localStorage.getItem('speedrunData');
  if (saved) {
    const data = JSON.parse(saved);
    SPEEDRUN_CONFIG.bestTime = data.bestTime || null;
    SPEEDRUN_CONFIG.bestCells = data.bestCells || 0;
    SPEEDRUN_CONFIG.history = data.history || [];
  }
}

// Сохранение данных
function saveSpeedrunData() {
  localStorage.setItem('speedrunData', JSON.stringify({
    bestTime: SPEEDRUN_CONFIG.bestTime,
    bestCells: SPEEDRUN_CONFIG.bestCells,
    history: SPEEDRUN_CONFIG.history.slice(-10) // Последние 10
  }));
}

// Начало спидрана
function startSpeedrun(x, y) {
  if (SPEEDRUN_CONFIG.active) return;
  
  SPEEDRUN_CONFIG.active = true;
  SPEEDRUN_CONFIG.startTime = Date.now();
  SPEEDRUN_CONFIG.cellsDrawn = 0;
  
  console.log('⏱️ Speedrun started at:', x, y);
}

// Добавление клетки
function addSpeedrunCell() {
  if (!SPEEDRUN_CONFIG.active) return;
  SPEEDRUN_CONFIG.cellsDrawn++;
}

// Завершение спидрана
function finishSpeedrun(x, y) {
  if (!SPEEDRUN_CONFIG.active) return;
  
  const endTime = Date.now();
  const totalTime = Math.floor((endTime - SPEEDRUN_CONFIG.startTime) / 1000);
  const cellsPerSecond = SPEEDRUN_CONFIG.cellsDrawn > 0 
    ? (SPEEDRUN_CONFIG.cellsDrawn / totalTime).toFixed(2) 
    : 0;
  
  // Проверяем рекорд
  const isNewRecord = !SPEEDRUN_CONFIG.bestTime || 
    (totalTime < SPEEDRUN_CONFIG.bestTime && SPEEDRUN_CONFIG.cellsDrawn >= SPEEDRUN_CONFIG.bestCells);
  
  if (isNewRecord && SPEEDRUN_CONFIG.cellsDrawn > 0) {
    SPEEDRUN_CONFIG.bestTime = totalTime;
    SPEEDRUN_CONFIG.bestCells = SPEEDRUN_CONFIG.cellsDrawn;
  }
  
  // Добавляем в историю
  SPEEDRUN_CONFIG.history.push({
    date: new Date().toISOString(),
    time: totalTime,
    cells: SPEEDRUN_CONFIG.cellsDrawn,
    speed: cellsPerSecond
  });
  
  saveSpeedrunData();
  
  // Показываем результаты
  showSpeedrunResults(totalTime, SPEEDRUN_CONFIG.cellsDrawn, cellsPerSecond, isNewRecord);
  
  // Сброс
  SPEEDRUN_CONFIG.active = false;
  SPEEDRUN_CONFIG.startTime = null;
  SPEEDRUN_CONFIG.cellsDrawn = 0;
  
  console.log('🏁 Speedrun finished:', totalTime, 's', cellsPerSecond, 'cells/s');
}

// Показ результатов
function showSpeedrunResults(time, cells, speed, isNewRecord) {
  const modal = document.createElement('div');
  modal.id = 'speedrunResults';
  modal.className = 'speedrun-modal';
  
  modal.innerHTML = `
    <div class="speedrun-content">
      <div class="speedrun-header">
        <span class="speedrun-icon">⏱️</span>
        <h2>Спидран завершён!</h2>
        ${isNewRecord ? '<span class="new-record-badge">🏆 НОВЫЙ РЕКОРД!</span>' : ''}
      </div>
      
      <div class="speedrun-stats">
        <div class="stat-item">
          <span class="stat-icon">⏱️</span>
          <div class="stat-info">
            <span class="stat-label">Время</span>
            <span class="stat-value">${formatTime(time)}</span>
          </div>
        </div>
        
        <div class="stat-item">
          <span class="stat-icon">🎨</span>
          <div class="stat-info">
            <span class="stat-label">Клеток</span>
            <span class="stat-value">${cells}</span>
          </div>
        </div>
        
        <div class="stat-item">
          <span class="stat-icon">⚡</span>
          <div class="stat-info">
            <span class="stat-label">Скорость</span>
            <span class="stat-value">${speed} кл/с</span>
          </div>
        </div>
      </div>
      
      ${SPEEDRUN_CONFIG.bestTime ? `
      <div class="speedrun-best">
        <span class="best-label">🏆 Лучший результат:</span>
        <span class="best-value">${formatTime(SPEEDRUN_CONFIG.bestTime)} (${SPEEDRUN_CONFIG.bestCells} кл)</span>
      </div>
      ` : ''}
      
      <div class="speedrun-actions">
        <button class="speedrun-btn primary" onclick="closeSpeedrunResults()">✅ Круто!</button>
        <button class="speedrun-btn secondary" onclick="showSpeedrunHistory()">📊 История</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  setTimeout(() => modal.classList.add('show'), 100);
}

// Закрытие результатов
function closeSpeedrunResults() {
  const modal = document.getElementById('speedrunResults');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  }
}

// Показать историю
function showSpeedrunHistory() {
  const history = SPEEDRUN_CONFIG.history.slice(-5).reverse();
  
  if (history.length === 0) {
    alert('📊 История пуста. Нарисуй что-нибудь!');
    return;
  }
  
  let historyText = '📊 Твоя история спидранов:\n\n';
  history.forEach((run, index) => {
    const date = new Date(run.date).toLocaleDateString('ru-RU');
    historyText += `${index + 1}. ${formatTime(run.time)} | ${run.cells} кл | ${run.speed} кл/с (${date})\n`;
  });
  
  alert(historyText);
  closeSpeedrunResults();
}

// Форматирование времени
function formatTime(seconds) {
  if (seconds < 60) {
    return `${seconds} сек`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins} мин ${secs} сек`;
}

// Создание кнопки статистики
function createSpeedrunStatsButton() {
  const btn = document.createElement('button');
  btn.id = 'speedrunStatsBtn';
  btn.className = 'speedrun-stats-btn';
  btn.textContent = '🏆';
  btn.title = 'Статистика спидрана';
  btn.onclick = showSpeedrunStats;
  document.body.appendChild(btn);
}

// Показать общую статистику
function showSpeedrunStats() {
  const totalRuns = SPEEDRUN_CONFIG.history.length;
  const avgTime = totalRuns > 0 
    ? Math.floor(SPEEDRUN_CONFIG.history.reduce((sum, r) => sum + r.time, 0) / totalRuns)
    : 0;
  const avgCells = totalRuns > 0
    ? Math.floor(SPEEDRUN_CONFIG.history.reduce((sum, r) => sum + r.cells, 0) / totalRuns)
    : 0;
  
  let stats = `📊 Статистика спидранов:\n\n`;
  stats += `Всего забегов: ${totalRuns}\n`;
  stats += `Среднее время: ${formatTime(avgTime)}\n`;
  stats += `Среднее клеток: ${avgCells}\n`;
  stats += `Лучший результат: ${SPEEDRUN_CONFIG.bestTime ? formatTime(SPEEDRUN_CONFIG.bestTime) : '—'}\n`;
  stats += `Лучше всего клеток: ${SPEEDRUN_CONFIG.bestCells}\n`;
  
  alert(stats);
}

// Интеграция с основным кодом
function hookIntoDrawing() {
  // Отслеживаем клик по клетке (начало)
  const grid = document.getElementById('grid');
  if (!grid) return;
  
  grid.addEventListener('click', (e) => {
    if (!e.target.classList.contains('cell')) return;
    if (e.target.classList.contains('occupied')) return;
    
    const x = parseInt(e.target.dataset.x);
    const y = parseInt(e.target.dataset.y);
    
    // Начинаем спидран при выборе клетки
    startSpeedrun(x, y);
  });
  
  // Отслеживаем рисование на канвасе
  const canvas = document.getElementById('drawCanvas');
  if (canvas) {
    let lastCellCount = 0;
    
    const observer = new MutationObserver(() => {
      if (SPEEDRUN_CONFIG.active) {
        // Простой способ: считаем изменения
        SPEEDRUN_CONFIG.cellsDrawn++;
      }
    });
    
    observer.observe(canvas, { attributes: true });
  }
  
  console.log('✅ Speedrun hook initialized');
}

// Интеграция с сохранением
function hookIntoSaveDrawing() {
  const originalSaveDrawing = window.saveDrawing;
  
  if (originalSaveDrawing) {
    window.saveDrawing = async function() {
      // Завершаем спидран перед сохранением
      if (SPEEDRUN_CONFIG.active) {
        const toolbar = document.getElementById('toolbar');
        if (toolbar) {
          const x = parseInt(toolbar.dataset.x);
          const y = parseInt(toolbar.dataset.y);
          finishSpeedrun(x, y);
        }
      }
      
      await originalSaveDrawing();
    };
  }
  
  console.log('✅ Speedrun save hook initialized');
}

// Инициализация
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadSpeedrunData();
    createSpeedrunStatsButton();
    hookIntoDrawing();
    hookIntoSaveDrawing();
  });
} else {
  loadSpeedrunData();
  createSpeedrunStatsButton();
  hookIntoDrawing();
  hookIntoSaveDrawing();
}

// Делаем функции доступными
window.startSpeedrun = startSpeedrun;
window.finishSpeedrun = finishSpeedrun;
window.showSpeedrunHistory = showSpeedrunHistory;
window.showSpeedrunStats = showSpeedrunStats;
window.closeSpeedrunResults = closeSpeedrunResults;
window.SPEEDRUN_CONFIG = SPEEDRUN_CONFIG;
