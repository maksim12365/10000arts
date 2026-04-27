// ============================================
// АНИМАЦИЯ С ONION SKINNING (3 кадра макс)
// ============================================

const ANIMATION_CONFIG = {
  MAX_FRAMES: 3,
  DEFAULT_FPS: 8,
  frames: [],
  currentFrame: 0,
  isOpen: false,
  isPlaying: false,
  playInterval: null,
  onionSkinOpacity: 0.3  // 30% прозрачности
};

// ============================================
// ОТКРЫТЬ РЕДАКТОР
// ============================================

window.openAnimationEditor = function() {
  if (ANIMATION_CONFIG.isOpen) return;
  
  // Проверяем что выбрана клетка
  const toolbar = document.getElementById('toolbar');
  const x = toolbar?.dataset?.x;
  const y = toolbar?.dataset?.y;
  
  if (!x || !y) {
    alert('❌ Сначала выбери клетку на полотне!');
    return;
  }
  
  // Создаём модальное окно
  const modal = document.createElement('div');
  modal.id = 'animationModal';
  modal.className = 'animation-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>🎬 Анимация (макс. 3 кадра)</h3>
        <button onclick="closeAnimationEditor()">✕</button>
      </div>
      
      <div class="canvas-container">
        <canvas id="animationCanvas" width="256" height="256"></canvas>
        <canvas id="onionSkinCanvas" width="256" height="256"></canvas>
      </div>
      
      <div class="animation-controls">
        <div class="frame-info">
          Кадр: <strong id="frameNum">1</strong> / ${ANIMATION_CONFIG.MAX_FRAMES}
        </div>
        
        <div class="frame-buttons">
          <button onclick="previousFrame()" id="prevBtn" disabled>⏮️</button>
          <button onclick="togglePlay()" id="playBtn">▶️</button>
          <button onclick="nextFrame()" id="nextBtn" disabled>⏭️</button>
        </div>
        
        <button onclick="addFrame()" id="addFrameBtn" class="btn-secondary">
          + Добавить кадр
        </button>
        
        <div class="onion-skin-control">
          <label>
            <input type="checkbox" id="onionSkinToggle" checked onchange="toggleOnionSkin()">
            🧅 Onion Skinning (вкл)
          </label>
        </div>
        
        <div class="fps-control">
          <label>FPS: <input type="range" min="4" max="12" value="8" onchange="updateFPS(this.value)"></label>
          <span id="fpsValue">8</span>
        </div>
      </div>
      
      <div class="modal-actions">
        <button onclick="closeAnimationEditor()" class="btn-secondary">❌ Отмена</button>
        <button onclick="saveAnimation()" class="btn-primary">✅ Сохранить</button>
        <button onclick="exportGIF()" class="btn-success">💾 GIF</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  ANIMATION_CONFIG.isOpen = true;
  ANIMATION_CONFIG.frames = [getCanvasSnapshot()];
  ANIMATION_CONFIG.currentFrame = 0;
  
  // Копируем текущий рисунок на animationCanvas
  copyToAnimationCanvas();
  
  updateFrameUI();
  updateOnionSkin();
  
  console.log('🎬 Animation editor opened');
};

// ============================================
// ЗАКРЫТЬ РЕДАКТОР
// ============================================

window.closeAnimationEditor = function() {
  if (ANIMATION_CONFIG.playInterval) {
    clearInterval(ANIMATION_CONFIG.playInterval);
    ANIMATION_CONFIG.playInterval = null;
  }
  
  const modal = document.getElementById('animationModal');
  if (modal) modal.remove();
  
  ANIMATION_CONFIG.isOpen = false;
  ANIMATION_CONFIG.frames = [];
  ANIMATION_CONFIG.currentFrame = 0;
  ANIMATION_CONFIG.isPlaying = false;
  
  console.log('🎬 Animation editor closed');
};

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

function getCanvasSnapshot() {
  const canvas = document.getElementById('drawCanvas');
  if (!canvas) return null;
  return canvas.toDataURL('image/jpeg', 0.6);
}

function copyToAnimationCanvas() {
  const source = document.getElementById('drawCanvas');
  const target = document.getElementById('animationCanvas');
  if (!source || !target) return;
  
  const ctx = target.getContext('2d');
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, target.width, target.height);
    ctx.drawImage(img, 0, 0);
  };
  img.src = source.toDataURL();
}

function restoreFrameToDrawCanvas(frameIndex) {
  const drawCanvas = document.getElementById('drawCanvas');
  const animCanvas = document.getElementById('animationCanvas');
  if (!drawCanvas || !animCanvas) return;
  
  const ctx = drawCanvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    ctx.drawImage(img, 0, 0);
  };
  img.src = ANIMATION_CONFIG.frames[frameIndex];
}

function updateOnionSkin() {
  const onionCanvas = document.getElementById('onionSkinCanvas');
  const checkbox = document.getElementById('onionSkinToggle');
  if (!onionCanvas || !checkbox) return;
  
  const ctx = onionCanvas.getContext('2d');
  ctx.clearRect(0, 0, onionCanvas.width, onionCanvas.height);
  
  if (!checkbox.checked || ANIMATION_CONFIG.currentFrame === 0) {
    onionCanvas.style.display = 'none';
    return;
  }
  
  // Показываем предыдущий кадр полупрозрачным
  const prevFrame = ANIMATION_CONFIG.frames[ANIMATION_CONFIG.currentFrame - 1];
  if (prevFrame) {
    const img = new Image();
    img.onload = () => {
      ctx.globalAlpha = ANIMATION_CONFIG.onionSkinOpacity;
      ctx.drawImage(img, 0, 0);
      ctx.globalAlpha = 1.0;
    };
    img.src = prevFrame;
    onionCanvas.style.display = 'block';
  }
}

// ============================================
// УПРАВЛЕНИЕ КАДРАМИ
// ============================================

window.addFrame = function() {
  if (ANIMATION_CONFIG.frames.length >= ANIMATION_CONFIG.MAX_FRAMES) {
    alert('❌ Максимум 3 кадра!');
    return;
  }
  
  // Сохраняем текущее состояние как новый кадр
  ANIMATION_CONFIG.frames.push(getCanvasSnapshot());
  ANIMATION_CONFIG.currentFrame = ANIMATION_CONFIG.frames.length - 1;
  
  updateFrameUI();
  updateOnionSkin();
  
  console.log('🎬 Frame added:', ANIMATION_CONFIG.frames.length);
};

window.previousFrame = function() {
  if (ANIMATION_CONFIG.currentFrame > 0) {
    ANIMATION_CONFIG.currentFrame--;
    restoreFrameToDrawCanvas(ANIMATION_CONFIG.currentFrame);
    setTimeout(() => {
      copyToAnimationCanvas();
      updateFrameUI();
      updateOnionSkin();
    }, 100);
  }
};

window.nextFrame = function() {
  if (ANIMATION_CONFIG.currentFrame < ANIMATION_CONFIG.frames.length - 1) {
    ANIMATION_CONFIG.currentFrame++;
    restoreFrameToDrawCanvas(ANIMATION_CONFIG.currentFrame);
    setTimeout(() => {
      copyToAnimationCanvas();
      updateFrameUI();
      updateOnionSkin();
    }, 100);
  }
};

function updateFrameUI() {
  const frameNum = document.getElementById('frameNum');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const addBtn = document.getElementById('addFrameBtn');
  
  if (frameNum) frameNum.textContent = ANIMATION_CONFIG.currentFrame + 1;
  if (prevBtn) prevBtn.disabled = ANIMATION_CONFIG.currentFrame === 0;
  if (nextBtn) nextBtn.disabled = ANIMATION_CONFIG.currentFrame >= ANIMATION_CONFIG.frames.length - 1;
  if (addBtn) addBtn.disabled = ANIMATION_CONFIG.frames.length >= ANIMATION_CONFIG.MAX_FRAMES;
}

// ============================================
// PLAY / PAUSE
// ============================================

window.togglePlay = function() {
  const btn = document.getElementById('playBtn');
  if (!btn) return;
  
  if (ANIMATION_CONFIG.isPlaying) {
    clearInterval(ANIMATION_CONFIG.playInterval);
    ANIMATION_CONFIG.playInterval = null;
    ANIMATION_CONFIG.isPlaying = false;
    btn.textContent = '▶️';
    restoreFrameToDrawCanvas(ANIMATION_CONFIG.currentFrame);
    setTimeout(copyToAnimationCanvas, 100);
  } else {
    ANIMATION_CONFIG.isPlaying = true;
    let frame = 0;
    ANIMATION_CONFIG.playInterval = setInterval(() => {
      restoreFrameToDrawCanvas(frame);
      setTimeout(copyToAnimationCanvas, 100);
      frame = (frame + 1) % ANIMATION_CONFIG.frames.length;
    }, 1000 / ANIMATION_CONFIG.DEFAULT_FPS);
    btn.textContent = '⏸️';
  }
};

// ============================================
// НАСТРОЙКИ
// ============================================

window.updateFPS = function(value) {
  ANIMATION_CONFIG.DEFAULT_FPS = parseInt(value);
  const fpsValue = document.getElementById('fpsValue');
  if (fpsValue) fpsValue.textContent = value;
};

window.toggleOnionSkin = function() {
  updateOnionSkin();
};

// ============================================
// СОХРАНЕНИЕ АНИМАЦИИ
// ============================================

window.saveAnimation = function() {
  if (ANIMATION_CONFIG.frames.length === 0) {
    alert('❌ Нет кадров!');
    return;
  }
  
  const toolbar = document.getElementById('toolbar');
  const x = toolbar?.dataset?.x;
  const y = toolbar?.dataset?.y;
  
  if (!x || !y) {
    alert('❌ Выбери клетку на полотне!');
    return;
  }
  
  const animationData = {
    type: 'animated',
    frames: ANIMATION_CONFIG.frames,
    fps: ANIMATION_CONFIG.DEFAULT_FPS,
    timestamp: Date.now()
  };
  
  localStorage.setItem(`cell_${x}_${y}`, JSON.stringify(animationData));
  updateCellOnGrid(x, y, animationData);
  
  closeAnimationEditor();
  alert('✅ Анимация сохранена!');
  console.log('✅ Animation saved at:', x, y);
};

function updateCellOnGrid(x, y, data) {
  const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
  if (!cell) return;
  
  cell.classList.add('occupied', 'animated-cell');
  cell.dataset.type = 'animated';
  cell.dataset.animation = JSON.stringify(data);
  
  animateCell(cell, data);
}

function animateCell(cell, data) {
  let frame = 0;
  setInterval(() => {
    const img = new Image();
    img.onload = () => {
      cell.style.backgroundImage = `url(${img.src})`;
      cell.style.backgroundSize = 'contain';
      cell.style.backgroundPosition = 'center';
      cell.style.backgroundRepeat = 'no-repeat';
    };
    img.src = data.frames[frame];
    frame = (frame + 1) % data.frames.length;
  }, 1000 / data.fps);
}

// ============================================
// ЭКСПОРТ В GIF
// ============================================

window.exportGIF = function() {
  if (ANIMATION_CONFIG.frames.length === 0) {
    alert('❌ Нет кадров!');
    return;
  }
  
  if (typeof GIF === 'undefined') {
    alert('❌ Библиотека GIF.js не загружена!');
    return;
  }
  
  const gif = new GIF({
    workers: 2,
    quality: 10,
    width: 256,
    height: 256
  });
  
  ANIMATION_CONFIG.frames.forEach(frame => {
    const img = new Image();
    img.src = frame;
    gif.addFrame(img, { delay: 1000 / ANIMATION_CONFIG.DEFAULT_FPS });
  });
  
  gif.on('finished', blob => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `animation-${Date.now()}.gif`;
    link.click();
    URL.revokeObjectURL(url);
  });
  
  gif.render();
  console.log('💾 GIF exported');
};

// ============================================
// ЗАГРУЗКА АНИМАЦИЙ ПРИ СТАРТЕ
// ============================================

function loadAnimations() {
  const cells = document.querySelectorAll('.cell[data-type="animated"]');
  cells.forEach(cell => {
    try {
      const data = JSON.parse(cell.dataset.animation);
      animateCell(cell, data);
    } catch (e) {
      console.error('❌ Error loading animation:', e);
    }
  });
  console.log('🎬 Animations loaded:', cells.length);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAnimations);
} else {
  setTimeout(loadAnimations, 500);
}
