// ============================================
// ГЕНЕРАТОР ПАЛИТР (ОБНОВЛЕНО)
// ============================================

const PALETTE_CONFIG = {
  colors: [],
  lastGenerated: null
};

// HEX → HSL
function hexToHsl(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0.5, l: 0.5 };
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

// HSL → HEX
function hslToHex(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  const toHex = x => { const hex = Math.round(x * 255).toString(16); return hex.length === 1 ? '0' + hex : hex; };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function randomColor() { return hslToHex(Math.random() * 360, 70, 50); }

// Типы палитр
const PALETTE_TYPES = {
  random: () => Array(8).fill().map(() => randomColor()),
  analogous: (base) => {
    const hsl = hexToHsl(base);
    return [hslToHex((hsl.h-60)%360,hsl.s,hsl.l), hslToHex((hsl.h-40)%360,hsl.s,hsl.l), hslToHex((hsl.h-20)%360,hsl.s,hsl.l), base, hslToHex((hsl.h+20)%360,hsl.s,hsl.l), hslToHex((hsl.h+40)%360,hsl.s,hsl.l), hslToHex((hsl.h+60)%360,hsl.s,hsl.l), hslToHex((hsl.h+80)%360,hsl.s,hsl.l)];
  },
  complementary: (base) => {
    const hsl = hexToHsl(base), comp = (hsl.h + 180) % 360;
    return [base, hslToHex(comp,hsl.s,hsl.l), hslToHex(hsl.h,hsl.s,Math.min(95,hsl.l+20)), hslToHex(hsl.h,hsl.s,Math.max(5,hsl.l-20)), hslToHex(comp,hsl.s,Math.min(95,hsl.l+20)), hslToHex(comp,hsl.s,Math.max(5,hsl.l-20)), hslToHex(hsl.h,Math.min(90,hsl.s+10),hsl.l), '#ffffff'];
  },
  triadic: (base) => {
    const hsl = hexToHsl(base);
    return [base, hslToHex((hsl.h+120)%360,hsl.s,hsl.l), hslToHex((hsl.h+240)%360,hsl.s,hsl.l), hslToHex(hsl.h,hsl.s,Math.min(95,hsl.l+25)), hslToHex((hsl.h+120)%360,hsl.s,Math.min(95,hsl.l+25)), hslToHex((hsl.h+240)%360,hsl.s,Math.min(95,hsl.l+25)), hslToHex(hsl.h,Math.max(5,hsl.s-20),hsl.l), '#000000'];
  },
  monochromatic: (base) => {
    const hsl = hexToHsl(base);
    return [hslToHex(hsl.h,hsl.s,Math.max(5,hsl.l-40)), hslToHex(hsl.h,hsl.s,Math.max(5,hsl.l-25)), hslToHex(hsl.h,hsl.s,Math.max(5,hsl.l-10)), base, hslToHex(hsl.h,hsl.s,Math.min(95,hsl.l+10)), hslToHex(hsl.h,hsl.s,Math.min(95,hsl.l+25)), hslToHex(hsl.h,Math.min(90,hsl.s+10),hsl.l), hslToHex(hsl.h,Math.max(5,hsl.s-30),hsl.l)];
  },
  warm: () => ['#ff6b6b','#feca57','#ff9ff3','#f368e0','#ff9f43','#feca57','#ff6b6b','#f368e0'],
  cold: () => ['#5f27cd','#54a0ff','#48dbfb','#00d2d3','#1dd1a1','#5f27cd','#54a0ff','#48dbfb'],
  pastel: () => Array(8).fill().map(() => hslToHex(Math.random()*360, 50, 80))
};

// Создание панели
function createPaletteGenerator() {
  const panel = document.createElement('div');
  panel.id = 'paletteGenerator';
  panel.className = 'palette-generator collapsed';
  
  panel.innerHTML = `
    <div class="generator-header">
      <span>🎨 Палитры</span>
      <button class="generator-toggle" onclick="togglePaletteGenerator()">−</button>
    </div>
    <div class="generator-types">
      <button class="gen-type-btn" onclick="generatePalette('random')">🎲</button>
      <button class="gen-type-btn" onclick="generatePalette('analogous')">🔄</button>
      <button class="gen-type-btn" onclick="generatePalette('complementary')">⚖️</button>
      <button class="gen-type-btn" onclick="generatePalette('triadic')">🔺</button>
      <button class="gen-type-btn" onclick="generatePalette('monochromatic')">⬛</button>
      <button class="gen-type-btn" onclick="generatePalette('warm')">🔥</button>
      <button class="gen-type-btn" onclick="generatePalette('cold')">❄️</button>
      <button class="gen-type-btn" onclick="generatePalette('pastel')">🌸</button>
    </div>
    <div class="generated-palette" id="generatedPalette">
      <p class="palette-hint">Нажми на тип палитры</p>
    </div>
    <button class="apply-palette-btn" onclick="applyGeneratedPalette()" id="applyPaletteBtn" style="display:none;">✅ Применить</button>
  `;
  
  // 🔧 Вставляем ВНУТРИ toolbar, ПОСЛЕ colorPalette
  setTimeout(() => {
    const colorPalette = document.getElementById('colorPalette');
    if (colorPalette && colorPalette.parentNode) {
      colorPalette.parentNode.insertBefore(panel, colorPalette.nextSibling);
      console.log('✅ Palette generator inserted in toolbar');
    } else {
      console.error('❌ colorPalette not found');
    }
  }, 100);
}

// Переключить панель
function togglePaletteGenerator() {
  const panel = document.getElementById('paletteGenerator');
  const btn = panel?.querySelector('.generator-toggle');
  if (panel) {
    panel.classList.toggle('collapsed');
    if (btn) btn.textContent = panel.classList.contains('collapsed') ? '+' : '−';
  }
}

// Генерация палитры
function generatePalette(type) {
  const base = currentColor || '#667eea';
  const generator = PALETTE_TYPES[type];
  if (!generator) return;
  const colors = generator(base);
  PALETTE_CONFIG.colors = colors;
  PALETTE_CONFIG.lastGenerated = type;
  displayGeneratedPalette(colors);
  console.log('🎨 Palette generated:', type);
}

// Отображение палитры
function displayGeneratedPalette(colors) {
  const container = document.getElementById('generatedPalette');
  const applyBtn = document.getElementById('applyPaletteBtn');
  if (!container) return;
  container.innerHTML = '';
  colors.forEach(color => {
    const btn = document.createElement('button');
    btn.className = 'generated-color-btn';
    btn.style.backgroundColor = color;  /* ← ВАЖНО: показываем цвет! */
    btn.title = color;
    btn.onclick = () => {
      currentColor = color;
      document.querySelectorAll('.generated-color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
    container.appendChild(btn);
  });
  if (applyBtn) applyBtn.style.display = 'block';
}

// Применить палитру
function applyGeneratedPalette() {
  if (PALETTE_CONFIG.colors.length === 0) return;
  const palette = document.getElementById('colorPalette');
  if (!palette) return;
  palette.innerHTML = '';
  PALETTE_CONFIG.colors.forEach(color => {
    const btn = document.createElement('button');
    btn.className = 'color-btn';
    btn.style.backgroundColor = color;
    btn.dataset.color = color;
    btn.onclick = () => {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentColor = color;
    };
    palette.appendChild(btn);
  });
  const randomBtn = document.createElement('button');
  randomBtn.className = 'color-btn random-btn';
  randomBtn.textContent = '🎲';
  randomBtn.title = 'Случайный цвет';
  randomBtn.onclick = () => {
    currentColor = randomColor();
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
    randomBtn.classList.add('active');
  };
  palette.appendChild(randomBtn);
  palette.classList.add('palette-applied');
  setTimeout(() => palette.classList.remove('palette-applied'), 500);
  console.log('✅ Palette applied');
}

// Инициализация
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createPaletteGenerator);
} else {
  createPaletteGenerator();
}

// Глобальные функции
window.togglePaletteGenerator = togglePaletteGenerator;
window.generatePalette = generatePalette;
window.applyGeneratedPalette = applyGeneratedPalette;
window.PALETTE_CONFIG = PALETTE_CONFIG;
