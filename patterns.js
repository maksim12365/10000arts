// ============================================
// ГЕНЕРАТОР ПАТТЕРНОВ
// ============================================

const PATTERNS = {
  // Шахматная доска
  checker: {
    name: '◫ Шахматы',
    icon: '◫',
    generate: (x, y, color) => {
      return (x + y) % 2 === 0 ? color : null;
    }
  },
  
  // Волны
  waves: {
    name: '〰️ Волны',
    icon: '〰️',
    generate: (x, y, color) => {
      return Math.sin(x * 0.3) * Math.cos(y * 0.3) > 0 ? color : null;
    }
  },
  
  // Шум
  noise: {
    name: '✨ Шум',
    icon: '✨',
    generate: (x, y, color) => {
      return Math.random() > 0.5 ? color : null;
    }
  },
  
  // Вертикальные полосы
  stripesV: {
    name: '⬇️ Полосы',
    icon: '⬇️',
    generate: (x, y, color) => {
      return Math.floor(x / 5) % 2 === 0 ? color : null;
    }
  },
  
  // Горизонтальные полосы
  stripesH: {
    name: '➡️ Полосы',
    icon: '➡️',
    generate: (x, y, color) => {
      return Math.floor(y / 5) % 2 === 0 ? color : null;
    }
  },
  
  // Диагональные линии
  diagonal: {
    name: '↗️ Диагональ',
    icon: '↗️',
    generate: (x, y, color) => {
      return (x + y) % 10 < 5 ? color : null;
    }
  },
  
  // Круги
  circles: {
    name: '⭕ Круги',
    icon: '⭕',
    generate: (x, y, color, centerX = 50, centerY = 50) => {
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      return Math.sin(dist * 0.5) > 0 ? color : null;
    }
  },
  
  // Спираль
  spiral: {
    name: '🌀 Спираль',
    icon: '🌀',
    generate: (x, y, color, centerX = 50, centerY = 50) => {
      const angle = Math.atan2(y - centerY, x - centerX);
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      return Math.sin(angle * 5 + dist * 0.5) > 0 ? color : null;
    }
  },
  
  // Сердце
  heart: {
    name: '❤️ Сердце',
    icon: '❤️',
    generate: (x, y, color) => {
      const X = x - 50;
      const Y = y - 50;
      const heart = Math.pow(X * 0.1, 2) + Math.pow(Y * 0.1, 2) - 1;
      return heart <= 0 ? color : null;
    }
  },
  
  // Звезда
  star: {
    name: '⭐ Звезда',
    icon: '⭐',
    generate: (x, y, color) => {
      const X = x - 50;
      const Y = y - 50;
      const angle = Math.atan2(Y, X);
      const dist = Math.sqrt(X * X + Y * Y);
      const starRadius = 20 + 10 * Math.sin(angle * 5);
      return dist < starRadius ? color : null;
    }
  }
};

// Создаём панель паттернов
function createPatternPanel() {
  const panel = document.createElement('div');
  panel.id = 'patternPanel';
  panel.className = 'pattern-panel hidden';
  
  panel.innerHTML = `
    <div class="pattern-header">
      <span>🎲 Генератор паттернов</span>
      <button class="pattern-close" onclick="togglePatternPanel()">✕</button>
    </div>
    <div class="pattern-grid">
      ${Object.entries(PATTERNS).map(([key, pattern]) => `
        <button class="pattern-btn" onclick="applyPattern('${key}')" title="${pattern.name}">
          ${pattern.icon}
        </button>
      `).join('')}
    </div>
    <div class="pattern-preview">
      <canvas id="patternPreview" width="100" height="100"></canvas>
      <p class="pattern-hint">Выбери паттерн → Нарисуй на холсте → Сохрани</p>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Предпросмотр при наведении
  document.querySelectorAll('.pattern-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      const patternKey = btn.onclick.toString().match(/'([^']+)'/)[1];
      showPatternPreview(patternKey);
    });
  });
  
  console.log('✅ Pattern panel created');
}

// Показать/скрыть панель
function togglePatternPanel() {
  const panel = document.getElementById('patternPanel');
  if (panel) {
    panel.classList.toggle('hidden');
  }
}

// Применить паттерн к канвасу
function applyPattern(patternKey) {
  const canvas = document.getElementById('drawCanvas');
  const ctx = canvas?.getContext('2d');
  
  if (!canvas || !ctx) {
    alert('❌ Холст не найден! Сначала выбери клетку для рисования.');
    return;
  }
  
  const pattern = PATTERNS[patternKey];
  if (!pattern) return;
  
  const size = canvas.width;
  const color = currentColor || '#ff0000';
  
  // Очищаем канвас
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  
  // Рисуем паттерн (масштабируем под размер канваса)
  const scale = size / 100;
  
  for (let py = 0; py < 100; py++) {
    for (let px = 0; px < 100; px++) {
      const result = pattern.generate(px, py, color);
      if (result) {
        ctx.fillStyle = result;
        ctx.fillRect(
          Math.floor(px * scale),
          Math.floor(py * scale),
          Math.ceil(scale),
          Math.ceil(scale)
        );
      }
    }
  }
  
  console.log('🎨 Pattern applied:', pattern.name);
  
  // Анимация кнопки
  const btn = document.querySelector(`.pattern-btn[onclick*="${patternKey}"]`);
  if (btn) {
    btn.classList.add('applied');
    setTimeout(() => btn.classList.remove('applied'), 500);
  }
  
  // Закрываем панель (опционально)
  // togglePatternPanel();
}

// Предпросмотр паттерна
function showPatternPreview(patternKey) {
  const previewCanvas = document.getElementById('patternPreview');
  if (!previewCanvas) return;
  
  const ctx = previewCanvas.getContext('2d');
  const pattern = PATTERNS[patternKey];
  if (!pattern) return;
  
  const color = currentColor || '#ff0000';
  const size = previewCanvas.width;
  const scale = size / 100;
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  
  for (let py = 0; py < 100; py++) {
    for (let px = 0; px < 100; px++) {
      const result = pattern.generate(px, py, color);
      if (result) {
        ctx.fillStyle = result;
        ctx.fillRect(
          Math.floor(px * scale),
          Math.floor(py * scale),
          Math.ceil(scale),
          Math.ceil(scale)
        );
      }
    }
  }
}

// Кнопка для открытия панели
function createPatternButton() {
  const btn = document.createElement('button');
  btn.id = 'patternBtn';
  btn.className = 'pattern-toggle-btn';
  btn.textContent = '🎲 Паттерны';
  btn.onclick = togglePatternPanel;
  btn.title = 'Генератор паттернов';
  
  // Вставляем после палитры цветов
  const palette = document.getElementById('colorPalette');
  if (palette && palette.parentNode) {
    palette.parentNode.insertBefore(btn, palette.nextSibling);
  }
}

// Инициализация
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    createPatternPanel();
    createPatternButton();
  });
} else {
  createPatternPanel();
  createPatternButton();
}

// Делаем функции доступными
window.togglePatternPanel = togglePatternPanel;
window.applyPattern = applyPattern;
window.showPatternPreview = showPatternPreview;
window.PATTERNS = PATTERNS;
