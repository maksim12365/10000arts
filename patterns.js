// ============================================
// ГЕНЕРАТОР ПАТТЕРНОВ (ОБНОВЛЕНО)
// ============================================

const PATTERNS = {
  checker: { name: '◫ Шахматы', icon: '◫', generate: (x, y, color) => (x + y) % 2 === 0 ? color : null },
  waves: { name: '〰️ Волны', icon: '〰️', generate: (x, y, color) => Math.sin(x * 0.3) * Math.cos(y * 0.3) > 0 ? color : null },
  noise: { name: '✨ Шум', icon: '✨', generate: (x, y, color) => Math.random() > 0.5 ? color : null },
  stripesV: { name: '⬇️ Полосы', icon: '⬇️', generate: (x, y, color) => Math.floor(x / 5) % 2 === 0 ? color : null },
  stripesH: { name: '➡️ Полосы', icon: '➡️', generate: (x, y, color) => Math.floor(y / 5) % 2 === 0 ? color : null },
  diagonal: { name: '↗️ Диагональ', icon: '↗️', generate: (x, y, color) => (x + y) % 10 < 5 ? color : null },
  circles: { name: '⭕ Круги', icon: '⭕', generate: (x, y, color, cx = 50, cy = 50) => Math.sin(Math.sqrt((x-cx)**2 + (y-cy)**2) * 0.5) > 0 ? color : null },
  spiral: { name: '🌀 Спираль', icon: '🌀', generate: (x, y, color, cx = 50, cy = 50) => { const a = Math.atan2(y-cy, x-cx), d = Math.sqrt((x-cx)**2 + (y-cy)**2); return Math.sin(a*5 + d*0.5) > 0 ? color : null; }},
  heart: { name: '❤️ Сердце', icon: '❤️', generate: (x, y, color) => { const X = x-50, Y = y-50; return (X*0.1)**2 + (Y*0.1)**2 - 1 <= 0 ? color : null; }},
  star: { name: '⭐ Звезда', icon: '⭐', generate: (x, y, color) => { const X = x-50, Y = y-50, a = Math.atan2(Y, X), d = Math.sqrt(X*X + Y*Y); return d < (20 + 10*Math.sin(a*5)) ? color : null; }}
};

// Создаём панель паттернов
function createPatternPanel() {
  const panel = document.createElement('div');
  panel.id = 'patternPanel';
  panel.className = 'pattern-panel collapsed';
  
  panel.innerHTML = `
    <div class="pattern-header">
      <span>🎲 Паттерны</span>
      <button class="pattern-toggle" onclick="togglePatternPanel()">−</button>
    </div>
    <div class="pattern-content">
      <div class="pattern-grid">
        ${Object.entries(PATTERNS).map(([key, p]) => 
          `<button class="pattern-btn" onclick="applyPattern('${key}')" title="${p.name}">${p.icon}</button>`
        ).join('')}
      </div>
      <div class="pattern-preview">
        <canvas id="patternPreview" width="100" height="100"></canvas>
        <p class="pattern-hint">Выбери → Нарисуй → Сохрани</p>
      </div>
    </div>
  `;
  
  // 🔧 Вставляем В #panelsContainer (если есть)
  setTimeout(() => {
    const container = document.getElementById('panelsContainer');
    if (container) {
      container.appendChild(panel);
      console.log('✅ Pattern panel added to #panelsContainer');
    } else {
      // Фолбэк: после фильтров или палитры
      const filters = document.getElementById('filtersPanel');
      const palette = document.getElementById('paletteGenerator');
      if (filters?.parentNode) {
        filters.parentNode.insertBefore(panel, filters.nextSibling);
      } else if (palette?.parentNode) {
        palette.parentNode.insertBefore(panel, palette.nextSibling);
      } else {
        document.body.appendChild(panel);
      }
      console.log('⚠️ Pattern panel added via fallback');
    }
  }, 100);
}

// Переключить панель
function togglePatternPanel() {
  const panel = document.getElementById('patternPanel');
  const btn = panel?.querySelector('.pattern-toggle');
  if (panel) {
    panel.classList.toggle('collapsed');
    if (btn) btn.textContent = panel.classList.contains('collapsed') ? '+' : '−';
  }
}

// Применить паттерн
function applyPattern(key) {
  const canvas = document.getElementById('drawCanvas');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) { alert('❌ Холст не найден!'); return; }
  
  const pattern = PATTERNS[key];
  if (!pattern) return;
  
  const size = canvas.width;
  const color = currentColor || '#ff0000';
  const scale = size / 100;
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  
  for (let py = 0; py < 100; py++) {
    for (let px = 0; px < 100; px++) {
      const result = pattern.generate(px, py, color);
      if (result) {
        ctx.fillStyle = result;
        ctx.fillRect(Math.floor(px * scale), Math.floor(py * scale), Math.ceil(scale), Math.ceil(scale));
      }
    }
  }
  
  // Анимация кнопки
  const btn = document.querySelector(`.pattern-btn[onclick*="${key}"]`);
  if (btn) { btn.classList.add('applied'); setTimeout(() => btn.classList.remove('applied'), 500); }
  
  // Авто-закрытие
  setTimeout(() => {
    const panel = document.getElementById('patternPanel');
    if (panel && !panel.classList.contains('collapsed')) {
      togglePatternPanel();
    }
  }, 300);
}

// Предпросмотр
function showPatternPreview(key) {
  const preview = document.getElementById('patternPreview');
  if (!preview) return;
  const ctx = preview.getContext('2d');
  const pattern = PATTERNS[key];
  if (!pattern) return;
  
  const color = currentColor || '#ff0000';
  const size = preview.width;
  const scale = size / 100;
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  
  for (let py = 0; py < 100; py++) {
    for (let px = 0; px < 100; px++) {
      const result = pattern.generate(px, py, color);
      if (result) {
        ctx.fillStyle = result;
        ctx.fillRect(Math.floor(px * scale), Math.floor(py * scale), Math.ceil(scale), Math.ceil(scale));
      }
    }
  }
}

// Инициализация
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createPatternPanel);
} else {
  createPatternPanel();
}

// Глобальные функции
window.togglePatternPanel = togglePatternPanel;
window.applyPattern = applyPattern;
window.showPatternPreview = showPatternPreview;
window.PATTERNS = PATTERNS;
