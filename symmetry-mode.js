// ============================================
// РЕЖИМ СИММЕТРИИ
// ============================================

const SYMMETRY_CONFIG = {
  enabled: false,
  type: 'horizontal', // horizontal, vertical, both, radial
  showGuides: true
};

// Загрузка сохранённых настроек
function loadSymmetrySettings() {
  const saved = localStorage.getItem('symmetrySettings');
  if (saved) {
    const settings = JSON.parse(saved);
    SYMMETRY_CONFIG.enabled = settings.enabled || false;
    SYMMETRY_CONFIG.type = settings.type || 'horizontal';
    SYMMETRY_CONFIG.showGuides = settings.showGuides !== false;
  }
}

// Сохранение настроек
function saveSymmetrySettings() {
  localStorage.setItem('symmetrySettings', JSON.stringify(SYMMETRY_CONFIG));
}

// Создание панели управления симметрией
function createSymmetryPanel() {
  const panel = document.createElement('div');
  panel.id = 'symmetryPanel';
  panel.className = 'symmetry-panel';
  
  panel.innerHTML = `
    <div class="symmetry-header">
      <span>🪞 Симметрия</span>
      <button class="symmetry-toggle" onclick="toggleSymmetryPanel()" title="Свернуть">−</button>
    </div>
    
    <div class="symmetry-content">
      <div class="symmetry-switch">
        <label class="switch">
          <input type="checkbox" id="symmetryEnabled" ${SYMMETRY_CONFIG.enabled ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
        <span class="switch-label">Включить</span>
      </div>
      
      <div class="symmetry-types">
        <button class="symmetry-type-btn ${SYMMETRY_CONFIG.type === 'horizontal' ? 'active' : ''}" 
                onclick="setSymmetryType('horizontal')" title="Горизонтальная">
          ↔️
        </button>
        <button class="symmetry-type-btn ${SYMMETRY_CONFIG.type === 'vertical' ? 'active' : ''}" 
                onclick="setSymmetryType('vertical')" title="Вертикальная">
          ↕️
        </button>
        <button class="symmetry-type-btn ${SYMMETRY_CONFIG.type === 'both' ? 'active' : ''}" 
                onclick="setSymmetryType('both')" title="Обе оси">
          ✛
        </button>
        <button class="symmetry-type-btn ${SYMMETRY_CONFIG.type === 'radial' ? 'active' : ''}" 
                onclick="setSymmetryType('radial')" title="Радиальная">
          🌀
        </button>
      </div>
      
      <div class="symmetry-guides">
        <label>
          <input type="checkbox" id="showGuides" ${SYMMETRY_CONFIG.showGuides ? 'checked' : ''}>
          Показать линии
        </label>
      </div>
      
      <div class="symmetry-preview">
        <canvas id="symmetryPreview" width="100" height="100"></canvas>
        <p class="symmetry-hint">Рисуй с одной стороны — зеркалится с другой!</p>
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Обработчики
  document.getElementById('symmetryEnabled').addEventListener('change', (e) => {
    SYMMETRY_CONFIG.enabled = e.target.checked;
    saveSymmetrySettings();
    updateSymmetryGuides();
    updateSymmetryPreview();
  });
  
  document.getElementById('showGuides').addEventListener('change', (e) => {
    SYMMETRY_CONFIG.showGuides = e.target.checked;
    saveSymmetrySettings();
    updateSymmetryGuides();
  });
  
  console.log('✅ Symmetry panel created');
}

// Переключить панель
function toggleSymmetryPanel() {
  const panel = document.getElementById('symmetryPanel');
  if (panel) {
    panel.classList.toggle('collapsed');
  }
}

// Установить тип симметрии
function setSymmetryType(type) {
  SYMMETRY_CONFIG.type = type;
  saveSymmetrySettings();
  
  // Обновляем кнопки
  document.querySelectorAll('.symmetry-type-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.querySelector(`.symmetry-type-btn[onclick*="${type}"]`);
  if (activeBtn) activeBtn.classList.add('active');
  
  updateSymmetryPreview();
  updateSymmetryGuides();
  
  console.log('🪞 Symmetry type:', type);
}

// Получить зеркальные координаты
function getSymmetricPositions(x, y) {
  if (!SYMMETRY_CONFIG.enabled) return [{ x, y }];
  
  const positions = [{ x, y }];
  
  switch (SYMMETRY_CONFIG.type) {
    case 'horizontal':
      positions.push({ x: 99 - x, y });
      break;
    
    case 'vertical':
      positions.push({ x, y: 99 - y });
      break;
    
    case 'both':
      positions.push(
        { x: 99 - x, y },
        { x, y: 99 - y },
        { x: 99 - x, y: 99 - y }
      );
      break;
    
    case 'radial':
      // Радиальная симметрия от центра
      const centerX = 50;
      const centerY = 50;
      positions.push(
        { x: centerX - (x - centerX), y: centerY - (y - centerY) },
        { x: centerX + (y - centerY), y: centerY - (x - centerX) },
        { x: centerX - (y - centerY), y: centerY + (x - centerX) }
      );
      break;
  }
  
  // Фильтруем дубликаты и выход за границы
  return positions.filter(pos => 
    pos.x >= 0 && pos.x < 100 && pos.y >= 0 && pos.y < 100
  ).filter((pos, index, self) => 
    index === self.findIndex(p => p.x === pos.x && p.y === pos.y)
  );
}

// Применение симметрии при рисовании
function applySymmetry(x, y, color) {
  const positions = getSymmetricPositions(x, y);
  
  positions.forEach(pos => {
    const cell = document.querySelector(`.cell[data-x="${pos.x}"][data-y="${pos.y}"]`);
    if (cell && !cell.classList.contains('occupied')) {
      // Визуально показываем (но не сохраняем в базу - это делает основной код)
      cell.style.backgroundColor = color;
    }
  });
  
  return positions;
}

// Обновление линий симметрии
function updateSymmetryGuides() {
  let guides = document.getElementById('symmetryGuides');
  
  if (!SYMMETRY_CONFIG.showGuides || !SYMMETRY_CONFIG.enabled) {
    if (guides) guides.remove();
    return;
  }
  
  if (!guides) {
    guides = document.createElement('div');
    guides.id = 'symmetryGuides';
    guides.className = 'symmetry-guides-overlay';
    document.getElementById('grid').appendChild(guides);
  }
  
  guides.innerHTML = '';
  
  // Горизонтальная линия
  if (SYMMETRY_CONFIG.type === 'horizontal' || SYMMETRY_CONFIG.type === 'both') {
    const hLine = document.createElement('div');
    hLine.className = 'symmetry-guide symmetry-guide-h';
    guides.appendChild(hLine);
  }
  
  // Вертикальная линия
  if (SYMMETRY_CONFIG.type === 'vertical' || SYMMETRY_CONFIG.type === 'both') {
    const vLine = document.createElement('div');
    vLine.className = 'symmetry-guide symmetry-guide-v';
    guides.appendChild(vLine);
  }
  
  // Радиальные линии
  if (SYMMETRY_CONFIG.type === 'radial') {
    const center = document.createElement('div');
    center.className = 'symmetry-guide symmetry-guide-center';
    guides.appendChild(center);
  }
}

// Предпросмотр симметрии
function updateSymmetryPreview() {
  const canvas = document.getElementById('symmetryPreview');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  
  // Очистка
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, size, size);
  
  // Рисуем линии симметрии
  ctx.strokeStyle = '#667eea';
  ctx.lineWidth = 2;
  
  if (SYMMETRY_CONFIG.type === 'horizontal' || SYMMETRY_CONFIG.type === 'both') {
    ctx.beginPath();
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();
  }
  
  if (SYMMETRY_CONFIG.type === 'vertical' || SYMMETRY_CONFIG.type === 'both') {
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.stroke();
  }
  
  if (SYMMETRY_CONFIG.type === 'radial') {
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();
  }
  
  // Показываем пример
  if (SYMMETRY_CONFIG.enabled) {
    ctx.fillStyle = '#667eea';
    ctx.fillRect(10, 10, 15, 15);
    
    const mirrors = getSymmetricPositions(10, 10);
    mirrors.forEach(pos => {
      if (pos.x !== 10 || pos.y !== 10) {
        ctx.fillStyle = '#764ba2';
        ctx.fillRect(pos.x * size / 100, pos.y * size / 100, 15, 15);
      }
    });
  }
}

// Интеграция с основным кодом рисования
function hookIntoDrawing() {
  // Перехватываем клики по клеткам
  document.getElementById('grid')?.addEventListener('click', (e) => {
    if (!SYMMETRY_CONFIG.enabled) return;
    if (!e.target.classList.contains('cell')) return;
    
    const x = parseInt(e.target.dataset.x);
    const y = parseInt(e.target.dataset.y);
    
    // Показываем зеркальные клетки (подсветка)
    const positions = getSymmetricPositions(x, y);
    positions.forEach(pos => {
      const cell = document.querySelector(`.cell[data-x="${pos.x}"][data-y="${pos.y}"]`);
      if (cell && cell !== e.target) {
        cell.classList.add('symmetry-preview');
        setTimeout(() => cell.classList.remove('symmetry-preview'), 500);
      }
    });
  });
  
  console.log('✅ Symmetry drawing hook initialized');
}

// Кнопка для быстрого включения
function createSymmetryButton() {
  const btn = document.createElement('button');
  btn.id = 'symmetryQuickBtn';
  btn.className = 'symmetry-quick-btn';
  btn.textContent = '🪞';
  btn.title = 'Режим симметрии';
  btn.onclick = () => {
    SYMMETRY_CONFIG.enabled = !SYMMETRY_CONFIG.enabled;
    document.getElementById('symmetryEnabled').checked = SYMMETRY_CONFIG.enabled;
    saveSymmetrySettings();
    updateSymmetryGuides();
  };
  
  document.body.appendChild(btn);
}

// Инициализация
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadSymmetrySettings();
    createSymmetryPanel();
    createSymmetryButton();
    hookIntoDrawing();
    updateSymmetryGuides();
    updateSymmetryPreview();
  });
} else {
  loadSymmetrySettings();
  createSymmetryPanel();
  createSymmetryButton();
  hookIntoDrawing();
  updateSymmetryGuides();
  updateSymmetryPreview();
}

// Делаем функции доступными
window.toggleSymmetryPanel = toggleSymmetryPanel;
window.setSymmetryType = setSymmetryType;
window.getSymmetricPositions = getSymmetricPositions;
window.applySymmetry = applySymmetry;
window.SYMMETRY_CONFIG = SYMMETRY_CONFIG;
