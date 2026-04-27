// ============================================
// МАСКИ И ФИЛЬТРЫ ДЛЯ РИСУНКОВ (ОБНОВЛЕНО)
// ============================================

const FILTERS = {
  sepia: (ctx, w, h) => {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      data[i] = (r * 0.393) + (g * 0.769) + (b * 0.189);
      data[i+1] = (r * 0.349) + (g * 0.686) + (b * 0.168);
      data[i+2] = (r * 0.272) + (g * 0.534) + (b * 0.131);
    }
    ctx.putImageData(imageData, 0, 0);
  },
  
  invert: (ctx, w, h) => {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i+1] = 255 - data[i+1];
      data[i+2] = 255 - data[i+2];
    }
    ctx.putImageData(imageData, 0, 0);
  },
  
  grayscale: (ctx, w, h) => {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i+1] + data[i+2]) / 3;
      data[i] = avg; data[i+1] = avg; data[i+2] = avg;
    }
    ctx.putImageData(imageData, 0, 0);
  },
  
  neon: (ctx, w, h) => {
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#fff';
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 200 || data[i+1] > 200 || data[i+2] > 200) {
        data[i] = Math.min(255, data[i] + 30);
        data[i+1] = Math.min(255, data[i+1] + 30);
        data[i+2] = Math.min(255, data[i+2] + 30);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  },
  
  night: (ctx, w, h) => {
    ctx.fillStyle = 'rgba(0, 0, 50, 0.4)';
    ctx.fillRect(0, 0, w, h);
  },
  
  warm: (ctx, w, h) => {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] + 30);
      data[i+1] = Math.min(255, data[i+1] + 10);
    }
    ctx.putImageData(imageData, 0, 0);
  },
  
  cold: (ctx, w, h) => {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i+2] = Math.min(255, data[i+2] + 40);
    }
    ctx.putImageData(imageData, 0, 0);
  },
  
  pixelate: (ctx, w, h) => {
    const pixelSize = 8;
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    for (let y = 0; y < h; y += pixelSize) {
      for (let x = 0; x < w; x += pixelSize) {
        const i = (y * w + x) * 4;
        const r = data[i], g = data[i+1], b = data[i+2];
        for (let py = 0; py < pixelSize && y + py < h; py++) {
          for (let px = 0; px < pixelSize && x + px < w; px++) {
            const pi = ((y + py) * w + (x + px)) * 4;
            data[pi] = r; data[pi+1] = g; data[pi+2] = b;
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  },
  
  outline: (ctx, w, h) => {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const copy = new Uint8ClampedArray(data);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4;
        const left = (y * w + (x - 1)) * 4;
        const right = (y * w + (x + 1)) * 4;
        const diff = Math.abs(copy[i] - copy[left]) + Math.abs(copy[i] - copy[right]);
        const edge = diff > 30 ? 255 : 0;
        data[i] = edge; data[i+1] = edge; data[i+2] = edge;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  },
  
  vintage: (ctx, w, h) => {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] + 40);
      data[i+1] = Math.min(255, data[i+1] + 20);
      data[i+2] = Math.max(0, data[i+2] - 20);
      const noise = (Math.random() - 0.5) * 20;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
      data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);
  }
};

const FILTER_LIST = [
  { id: 'sepia', name: '📷 Сепия', icon: '📷' },
  { id: 'invert', name: '🔄 Инверсия', icon: '🔄' },
  { id: 'grayscale', name: '⬜ Ч/Б', icon: '⬜' },
  { id: 'neon', name: '✨ Неон', icon: '✨' },
  { id: 'night', name: '🌙 Ночь', icon: '🌙' },
  { id: 'warm', name: '🔥 Тепло', icon: '🔥' },
  { id: 'cold', name: '❄️ Холод', icon: '❄️' },
  { id: 'pixelate', name: '📦 Пиксели', icon: '📦' },
  { id: 'outline', name: '🖊️ Контур', icon: '🖊️' },
  { id: 'vintage', name: '📜 Винтаж', icon: '📜' }
];

// Создание панели фильтров
function createFiltersPanel() {
  const panel = document.createElement('div');
  panel.id = 'filtersPanel';
  panel.className = 'filters-panel collapsed';
  
  panel.innerHTML = `
    <div class="filters-header">
      <span>🎭 Фильтры</span>
      <button class="filters-toggle" onclick="toggleFiltersPanel()">−</button>
    </div>
    <div class="filters-grid">
      ${FILTER_LIST.map(f => `<button class="filter-btn" onclick="applyFilter('${f.id}')" title="${f.name}">${f.icon}</button>`).join('')}
    </div>
    <div class="filters-actions">
      <button class="filter-reset-btn" onclick="resetCanvas()">↩️ Сбросить</button>
    </div>
  `;
  
  // 🔧 Вставляем ВНУТРИ toolbar, ПОСЛЕ paletteGenerator
  setTimeout(() => {
    const paletteGen = document.getElementById('paletteGenerator');
    if (paletteGen && paletteGen.parentNode) {
      paletteGen.parentNode.insertBefore(panel, paletteGen.nextSibling);
      console.log('✅ Filters panel inserted in toolbar');
    } else {
      console.error('❌ paletteGenerator not found');
    }
  }, 100);
}
// Переключить панель
function toggleFiltersPanel() {
  const panel = document.getElementById('filtersPanel');
  const btn = panel?.querySelector('.filters-toggle');
  if (panel) {
    panel.classList.toggle('collapsed');
    if (btn) btn.textContent = panel.classList.contains('collapsed') ? '+' : '−';
  }
}

// Применить фильтр
function applyFilter(filterId) {
  const canvas = document.getElementById('drawCanvas');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) { alert('❌ Сначала нарисуй что-нибудь!'); return; }
  
  const filter = FILTERS[filterId];
  if (!filter) return;
  
  saveCanvasState();
  filter(ctx, canvas.width, canvas.height);
  
  const btn = document.querySelector(`.filter-btn[onclick*="${filterId}"]`);
  if (btn) { btn.classList.add('applied'); setTimeout(() => btn.classList.remove('applied'), 500); }
  
  console.log('🎭 Filter applied:', filterId);
}

// Сохранение состояния канваса
let canvasState = null;
function saveCanvasState() {
  const canvas = document.getElementById('drawCanvas');
  if (!canvas) return;
  canvasState = canvas.toDataURL();
}

// Сброс
function resetCanvas() {
  if (!canvasState) { alert('❌ Нечего сбрасывать!'); return; }
  const canvas = document.getElementById('drawCanvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0); };
  img.src = canvasState;
  console.log('↩️ Canvas reset');
}

// Хук для сохранения
function hookIntoSaveDrawing() {
  const original = window.saveDrawing;
  if (original) {
    window.saveDrawing = async function() {
      saveCanvasState();
      await original();
    };
  }
}

// Инициализация
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { createFiltersPanel(); hookIntoSaveDrawing(); });
} else {
  createFiltersPanel();
  hookIntoSaveDrawing();
}

// Глобальные функции
window.toggleFiltersPanel = toggleFiltersPanel;
window.applyFilter = applyFilter;
window.resetCanvas = resetCanvas;
window.FILTERS = FILTERS;
window.FILTER_LIST = FILTER_LIST;
