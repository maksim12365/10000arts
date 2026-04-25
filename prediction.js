// ============================================
// ПРЕДСКАЗАНИЕ ЗАПОЛНЕНИЯ ПОЛОТНА
// ============================================

const PREDICTION_CONFIG = {
  totalCells: 10000,
  storageKey: 'predictionData',
  updateInterval: 60000 // Обновляем каждые 60 секунд
};

let predictionData = {
  firstVisit: null,
  lastCount: 0,
  lastUpdate: null,
  samples: [] // Для усреднения скорости
};

// Инициализация
function initPrediction() {
  loadPredictionData();
  createPredictionWidget();
  updatePrediction();
  
  // Обновляем периодически
  setInterval(updatePrediction, PREDICTION_CONFIG.updateInterval);
  
  console.log('✅ Prediction system initialized');
}

// Загрузка данных
function loadPredictionData() {
  const saved = localStorage.getItem(PREDICTION_CONFIG.storageKey);
  if (saved) {
    predictionData = JSON.parse(saved);
  } else {
    predictionData.firstVisit = Date.now();
    predictionData.lastUpdate = Date.now();
  }
}

// Сохранение данных
function savePredictionData() {
  localStorage.setItem(PREDICTION_CONFIG.storageKey, JSON.stringify(predictionData));
}

// Создание виджета
function createPredictionWidget() {
  const widget = document.createElement('div');
  widget.id = 'predictionWidget';
  widget.className = 'prediction-widget';
  
  widget.innerHTML = `
    <div class="prediction-header">
      <span>🔮 Прогноз заполнения</span>
    </div>
    
    <div class="prediction-progress">
      <div class="progress-bar-container">
        <div class="progress-bar" id="predictionProgressBar"></div>
      </div>
      <div class="progress-stats">
        <span id="predictionCount">0 / 10000</span>
        <span id="predictionPercent">0.00%</span>
      </div>
    </div>
    
    <div class="prediction-details">
      <div class="prediction-item">
        <span class="prediction-icon">⏱️</span>
        <div class="prediction-info">
          <span class="prediction-label">Скорость</span>
          <span class="prediction-value" id="predictionSpeed">-- клеток/день</span>
        </div>
      </div>
      
      <div class="prediction-item">
        <span class="prediction-icon">📅</span>
        <div class="prediction-info">
          <span class="prediction-label">Заполнится</span>
          <span class="prediction-value" id="predictionDate">--</span>
        </div>
      </div>
      
      <div class="prediction-item">
        <span class="prediction-icon">🎯</span>
        <div class="prediction-info">
          <span class="prediction-label">Осталось</span>
          <span class="prediction-value" id="predictionRemaining">10000</span>
        </div>
      </div>
    </div>
    
    <div class="prediction-milestones">
      <div class="milestone-item" id="milestone10">
        <span class="milestone-dot">🟢</span>
        <span class="milestone-label">10% (1000)</span>
        <span class="milestone-date" id="milestone10Date">--</span>
      </div>
      <div class="milestone-item" id="milestone50">
        <span class="milestone-dot">🟡</span>
        <span class="milestone-label">50% (5000)</span>
        <span class="milestone-date" id="milestone50Date">--</span>
      </div>
      <div class="milestone-item" id="milestone100">
        <span class="milestone-dot">🔴</span>
        <span class="milestone-label">100% (10000)</span>
        <span class="milestone-date" id="milestone100Date">--</span>
      </div>
    </div>
    
    <div class="prediction-history">
      <span class="history-label">📊 История:</span>
      <span class="history-value" id="predictionHistory">-- дней</span>
    </div>
  `;
  
  document.body.appendChild(widget);
}

// Обновление прогноза
async function updatePrediction() {
  const count = await getCurrentCount();
  const now = Date.now();
  
  // Сохраняем данные для расчёта скорости
  if (predictionData.lastUpdate) {
    const timeDiff = now - predictionData.lastUpdate;
    const countDiff = count - predictionData.lastCount;
    
    if (timeDiff > 0 && countDiff >= 0) {
      // Добавляем образец скорости
      predictionData.samples.push({
        time: timeDiff,
        count: countDiff,
        timestamp: now
      });
      
      // Храним только последние 10 образцов
      if (predictionData.samples.length > 10) {
        predictionData.samples.shift();
      }
    }
  }
  
  predictionData.lastCount = count;
  predictionData.lastUpdate = now;
  savePredictionData();
  
  // Расчёт статистики
  const percent = ((count / PREDICTION_CONFIG.totalCells) * 100).toFixed(2);
  const remaining = PREDICTION_CONFIG.totalCells - count;
  const cellsPerDay = calculateCellsPerDay();
  const daysLeft = cellsPerDay > 0 ? Math.ceil(remaining / cellsPerDay) : null;
  
  // Обновляем UI
  updatePredictionUI(count, percent, remaining, cellsPerDay, daysLeft);
  updateMilestones(count, cellsPerDay);
  updateHistory();
}

// Получение текущего количества заполненных клеток
async function getCurrentCount() {
  // Пробуем получить из существующего счётчика
  const counterEl = document.getElementById('counter');
  if (counterEl && counterEl.textContent) {
    return parseInt(counterEl.textContent) || 0;
  }
  
  // Если нет - пробуем через Supabase
  try {
    const SUPABASE_URL = 'https://10000arts.vercel.app';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzaHlyc3hocWV2dnFiYnFibnRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDAyMzEsImV4cCI6MjA5MjM3NjIzMX0.Owrda92DRalj6uNzoMDUEkOEThfdNLtCn9m-5xM03q8';
    
    const path = `/rest/v1/cells?select=x,y&status=eq.active`;
    const url = `${SUPABASE_URL}/api/proxy?path=${encodeURIComponent(path)}`;
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data) ? data.length : 0;
    }
  } catch (error) {
    console.error('❌ Prediction count error:', error);
  }
  
  return 0;
}

// Расчёт клеток в день
function calculateCellsPerDay() {
  if (predictionData.samples.length === 0) {
    // Если нет данных - предполагаем 5 клеток в день
    return 5;
  }
  
  const totalTime = predictionData.samples.reduce((sum, s) => sum + s.time, 0);
  const totalCount = predictionData.samples.reduce((sum, s) => sum + s.count, 0);
  
  if (totalTime === 0) return 5;
  
  // Конвертируем в клетки в день
  const msPerDay = 24 * 60 * 60 * 1000;
  const cellsPerDay = (totalCount / totalTime) * msPerDay;
  
  return Math.max(1, Math.round(cellsPerDay));
}

// Обновление UI
function updatePredictionUI(count, percent, remaining, cellsPerDay, daysLeft) {
  // Прогресс бар
  const progressBar = document.getElementById('predictionProgressBar');
  if (progressBar) {
    progressBar.style.width = `${percent}%`;
  }
  
  // Счётчики
  const countEl = document.getElementById('predictionCount');
  if (countEl) countEl.textContent = `${count.toLocaleString()} / ${PREDICTION_CONFIG.totalCells.toLocaleString()}`;
  
  const percentEl = document.getElementById('predictionPercent');
  if (percentEl) percentEl.textContent = `${percent}%`;
  
  // Скорость
  const speedEl = document.getElementById('predictionSpeed');
  if (speedEl) speedEl.textContent = `~${cellsPerDay.toLocaleString()} клеток/день`;
  
  // Осталось
  const remainingEl = document.getElementById('predictionRemaining');
  if (remainingEl) remainingEl.textContent = remaining.toLocaleString();
  
  // Дата заполнения
  const dateEl = document.getElementById('predictionDate');
  if (dateEl) {
    if (daysLeft !== null && daysLeft > 0) {
      const fillDate = new Date(Date.now() + daysLeft * 24 * 60 * 60 * 1000);
      dateEl.textContent = formatDate(fillDate);
    } else if (count >= PREDICTION_CONFIG.totalCells) {
      dateEl.textContent = '🎉 ЗАПОЛНЕНО!';
      dateEl.style.color = '#10b981';
    } else {
      dateEl.textContent = 'Неизвестно';
    }
  }
}

// Обновление этапов
function updateMilestones(currentCount, cellsPerDay) {
  const milestones = [
    { id: 'milestone10', target: 1000, dateId: 'milestone10Date' },
    { id: 'milestone50', target: 5000, dateId: 'milestone50Date' },
    { id: 'milestone100', target: 10000, dateId: 'milestone100Date' }
  ];
  
  milestones.forEach(ms => {
    const el = document.getElementById(ms.id);
    const dateEl = document.getElementById(ms.dateId);
    
    if (!el || !dateEl) return;
    
    if (currentCount >= ms.target) {
      // Уже достигнуто
      el.classList.add('achieved');
      dateEl.textContent = '✅';
    } else if (cellsPerDay > 0) {
      // Рассчитываем дату
      const remaining = ms.target - currentCount;
      const daysLeft = Math.ceil(remaining / cellsPerDay);
      const date = new Date(Date.now() + daysLeft * 24 * 60 * 60 * 1000);
      dateEl.textContent = formatDate(date);
    } else {
      dateEl.textContent = '--';
    }
  });
}

// Обновление истории
function updateHistory() {
  const historyEl = document.getElementById('predictionHistory');
  if (historyEl && predictionData.firstVisit) {
    const days = Math.floor((Date.now() - predictionData.firstVisit) / (24 * 60 * 60 * 1000));
    historyEl.textContent = `${days} дней`;
  }
}

// Форматирование даты
function formatDate(date) {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Инициализация после загрузки страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPrediction);
} else {
  initPrediction();
}

// Делаем функции доступными
window.updatePrediction = updatePrediction;
window.initPrediction = initPrediction;
