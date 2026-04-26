// ============================================
// ГЕНЕРАТОР ПАЛИТР (ВСТРОЕННЫЙ В МЕНЮ)
// ============================================

const PALETTE_CONFIG = {
  colors: [],
  lastGenerated: null
};

// Конвертация HEX в HSL
function hexToHsl(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0.5, l: 0.5 };
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
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

// Конвертация HSL в HEX
function hslToHex(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
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
  
  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Генерация случайного цвета
function randomColor() {
  return hslToHex(Math.random() * 360, 70, 50);
}

// Типы палитр
const PALETTE_TYPES = {
  // Случайная
  random: (base) => {
    return Array(8).fill().map(() => randomColor());
  },
  
  // Аналоговая (соседние цвета)
  analogous: (base) => {
    const hsl = hexToHsl(base);
    return [
      hslToHex((hsl.h - 60) % 360, hsl.s, hsl.l),
      hslToHex((hsl.h - 40) % 360, hsl.s, hsl.l),
      hslToHex((hsl.h - 20) % 360, hsl.s, hsl.l),
      base,
      hslToHex((hsl.h + 20) % 360, hsl.s, hsl.l),
      hslToHex((hsl.h + 40) % 360, hsl.s, hsl.l),
      hslToHex((hsl.h + 60) % 360, hsl.s, hsl.l),
      hslToHex((hsl.h + 80) % 360, hsl.s, hsl.l)
    ];
  },
  
  // Комплементарная (противоположные)
  complementary: (base) => {
    const hsl = hexToHsl(base);
    const comp = (hsl.h + 180) % 360;
    return [
      base,
      hslToHex(comp, hsl.s, hsl.l),
      hslToHex(hsl.h, hsl.s, Math.min(95, hsl.l + 20)),
      hslToHex(hsl.h, hsl.s, Math.max(5, hsl.l - 20)),
      hslToHex(comp, hsl.s, Math.min(95, hsl.l + 20)),
      hslToHex(comp, hsl.s, Math.max(5, hsl.l - 20)),
      hslToHex(hsl.h, Math.min(90, hsl.s + 10), hsl.l),
      '#ffffff'
    ];
  },
  
  // Триадная (треугольник)
  triadic: (base) => {
    const hsl = hexToHsl(base);
    return [
      base,
      hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
      hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l),
      hslToHex(hsl.h, hsl.s, Math.min(95, hsl.l + 25)),
      hslToHex((hsl.h + 120) % 360, hsl.s, Math.min(95, hsl.l + 25)),
      hslToHex((hsl.h + 240) % 360, hsl.s, Math.min(95, hsl.l + 25)),
      hslToHex(hsl.h, Math.max(5, hsl.s - 20), hsl.l),
      '#000000'
    ];
  },
  
  // Монохромная (оттенки одного цвета)
  monochromatic: (base) => {
    const hsl = hexToHsl(base);
    return [
      hslToHex(hsl.h, hsl.s, Math.max(5, hsl.l - 40)),
      hslToHex(hsl.h, hsl.s, Math.max(5, hsl.l - 25)),
      hslToHex(hsl.h, hsl.s, Math.max(5, hsl.l - 10)),
      base,
      hslToHex(hsl.h, hsl.s, Math.min(95, hsl.l + 10)),
      hslToHex(hsl.h, hsl.s, Math.min(95, hsl.l + 25)),
      hslToHex(hsl.h, Math.min(90, hsl.s + 10), hsl.l),
      hslToHex(hsl.h, Math.max(5, hsl.s - 30), hsl.l)
    ];
  },
  
  // Тёплая палитра
  warm: (base) => {
    return [
      '#ff6b6b', '#feca57', '#ff9ff3', '#f368e0',
      '#ff9f43', '#feca57', '#ff6b6b', '#f368e0'
    ];
  },
  
  // Холодная палитра
  cold: (base) => {
    return [
      '#5f27cd', '#54a0ff', '#48dbfb', '#00d2d3',
      '#1dd1a1', '#5f27cd', '#54a0ff', '#48dbfb'
    ];
  },
  
  // Пастельная
  pastel: (base) => {
    return Array(8).fill().map(() => hslToHex(Math.random() * 360, 50, 80));
  }
};

// Создание кнопки генератора в панели цветов
function createPaletteGenerator() {
  const palette = document.getElementById('colorPalette');
  if (!palette) return;
  
  // Контейнер для генератора
  const generatorContainer = document.createElement('div');
  generatorContainer.id = 'paletteGenerator';
  generatorContainer.className = 'palette-generator';
  
  generatorContainer.innerHTML = `
    <div class="generator-header">
      <span>🎨 Палитры</span>
      <button class="generator-toggle" onclick="togglePaletteGenerator()" title="Свернуть">−</button>
    </div>
    
    <div class="generator-types">
      <button class="gen-type-btn" onclick="generatePalette('random')" title="Случайная">🎲</button>
      <button class="gen-type-btn" onclick="generatePalette('analogous')" title="Аналоговая">🔄</button>
      <button class="gen-type-btn" onclick="generatePalette('complementary')" title="Комплементарная">⚖️</button>
      <button class="gen-type-btn" onclick="generatePalette('triadic')" title="Триадная">🔺</button>
      <button class="gen-type-btn" onclick="generatePalette('monochromatic')" title="Монохромная">⬛</button>
      <button class="gen-type-btn" onclick="generatePalette('warm')" title="Тёплая">🔥</button>
      <button class="gen-type-btn" onclick="generatePalette('cold')" title="Холодная">❄️</button>
      <button class="gen-type-btn" onclick="generatePalette('pastel')" title="Пастельная">🌸</button>
    </div>
    
    <div class="generated-palette" id="generatedPalette">
      <p class="palette-hint">Нажми на тип палитры чтобы сгенерировать</p>
    </div>
    
    <button class="apply-palette-btn" onclick="applyGeneratedPalette()" id="applyPaletteBtn" style="display: none;">
      ✅ Применить палитру
    </button>
  `;
  
  // Вставляем после палитры цветов
  palette.parentNode.insertBefore(generatorContainer, palette.nextSibling);
  
  console.log('✅ Palette generator created');
}

// Переключить видимость генератора
function togglePaletteGenerator() {
  const container = document.getElementById('paletteGenerator');
  if (container) {
    container.classList.toggle('collapsed');
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
  
  console.log('🎨 Palette generated:', type, colors);
}

// Отображение сгенерированной палитры
function displayGeneratedPalette(colors) {
  const container = document.getElementById('generatedPalette');
  const applyBtn = document.getElementById('applyPaletteBtn');
  
  if (!container) return;
  
  container.innerHTML = '';
  
  colors.forEach((color, index) => {
    const colorBtn = document.createElement('button');
    colorBtn.className = 'generated-color-btn';
    colorBtn.style.backgroundColor = color;
    colorBtn.title = color;
    colorBtn.onclick = () => {
      currentColor = color;
      // Визуальная обратная связь
      document.querySelectorAll('.generated-color-btn').forEach(b => b.classList.remove('active'));
      colorBtn.classList.add('active');
    };
    container.appendChild(colorBtn);
  });
  
  // Показываем кнопку применения
  if (applyBtn) applyBtn.style.display = 'block';
}

// Применить палитру к основной палитре цветов
function applyGeneratedPalette() {
  if (PALETTE_CONFIG.colors.length === 0) return;
  
  const palette = document.getElementById('colorPalette');
  if (!palette) return;
  
  // Сохраняем оригинальные кнопки (первые 8)
  const originalBtns = palette.querySelectorAll('.color-btn:not(.generator-related)');
  
  // Очищаем палитру
  palette.innerHTML = '';
  
  // Добавляем сгенерированные цвета
  PALETTE_CONFIG.colors.forEach(color => {
    const btn = document.createElement('button');
    btn.className = 'color-btn';
    btn.style.backgroundColor = color;
    btn.dataset.color = color;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentColor = color;
    });
    palette.appendChild(btn);
  });
  
  // Возвращаем кнопку "Случайный цвет" если была
  const randomBtn = document.createElement('button');
  randomBtn.className = 'color-btn random-btn';
  randomBtn.textContent = '🎲';
  randomBtn.title = 'Случайный цвет';
  randomBtn.addEventListener('click', () => {
    currentColor = randomColor();
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
    randomBtn.classList.add('active');
  });
  palette.appendChild(randomBtn);
  
  // Анимация успеха
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

// Делаем функции доступными
window.togglePaletteGenerator = togglePaletteGenerator;
window.generatePalette = generatePalette;
window.applyGeneratedPalette = applyGeneratedPalette;
window.PALETTE_CONFIG = PALETTE_CONFIG;
