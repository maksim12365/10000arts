// ============================================
// АНИМАЦИЯ С ONION SKINNING (ИСПРАВЛЕНО)
// ============================================

const ANIMATION_CONFIG = {
  MAX_FRAMES: 3,
  DEFAULT_FPS: 8,
  frames: [],
  currentFrame: 0,
  isOpen: false,
  isPlaying: false,
  playInterval: null,
  onionSkinOpacity: 0.3
};

// Открыть редактор
window.openAnimationEditor = function() {
  if (ANIMATION_CONFIG.isOpen) return;
  
  const toolbar = document.getElementById('toolbar');
  const x = toolbar?.dataset?.x;
  const y = toolbar?.dataset?.y;
  
  if (!x || !y) {
    alert('❌ Сначала выбери клетку на полотне!');
    return;
  }
  
  // Закрываем toolbar
  const closeBtn = document.getElementById('btnCloseToolbar');
  if (closeBtn) closeBtn.click();
  
  // Создаём модальное окно
  const modal = document.createElement('div');
  modal.id = 'animationModal';
  modal.innerHTML = `
    <div class="animation-modal-content">
      <div class="animation-modal-header">
        <h3>🎬 Анимация (макс. 3 кадра)</h3>
        <button class="animation-close-btn" onclick="closeAnimationEditor()">✕</button>
      </div>
      
      <div class="animation-canvas-wrapper">
        <canvas id="animationCanvas" width="256" height="256"></canvas>
        <canvas id="onionSkinCanvas" width="256" height="256"></canvas>
      </div>
      
      <div class="animation-controls">
        <div class="frame-info">
          Кадр: <strong id="frameNum">1</strong> / 3
        </div>
        
        <div class="frame-nav-buttons">
          <button onclick="previousFrame()" id="prevBtn" disabled>⏮️</button>
          <button onclick="togglePlay()" id="playBtn">▶️</button>
          <button onclick="nextFrame()" id="nextBtn" disabled>⏭️</button>
        </div>
        
        <button onclick="addFrame()" id="addFrameBtn" class="animation-btn-primary">
          + Добавить кадр
        </button>
        
        <label class="onion-toggle">
          <input type="checkbox" id="onionSkinToggle" checked onchange="updateOnionSkin()">
          🧅 Onion Skinning
        </label>
        
        <div class="fps-slider">
          <label>FPS: <input type="range" min="4" max="12" value="8" oninput="updateFPS(this.value)"></label>
          <span id="fpsValue">8</span>
        </div>
      </div>
      
      <div class="animation-modal-actions">
        <button onclick="closeAnimationEditor()" class="animation-btn-secondary">❌ Отмена</button>
        <button onclick="saveAnimation()" class="animation-btn-success">✅ Сохранить</button>
        <button onclick="exportGIF()" class="animation-btn-info">💾 GIF</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  ANIMATION_CONFIG.isOpen = true;
  ANIMATION_CONFIG.frames = [getCanvasSnapshot()];
  ANIMATION_CONFIG.currentFrame = 0;
  
  setTimeout(() => {
    copyToAnimationCanvas();
    updateOnionSkin();
    updateFrameUI();
  }, 100);
  
  console.log('🎬 Animation opened');
};

// Закрыть
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
  
  // Показываем toolbar обратно
  const toolbar = document.getElementById('toolbar');
  if (toolbar) toolbar.classList.remove('hidden');
};

// Снимок canvas
function getCanvasSnapshot() {
  const canvas = document.getElementById('drawCanvas');
  if (!canvas) return null;
  return canvas.toDataURL('image/jpeg', 0.6);
}

// Копировать на animation canvas
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

// Восстановить кадр
function restoreFrameToDrawCanvas(frameIndex) {
  const drawCanvas = document.getElementById('drawCanvas');
  if (!drawCanvas) return;
  
  const ctx = drawCanvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    ctx.drawImage(img, 0, 0);
  };
  img.src = ANIMATION_CONFIG.frames[frameIndex];
}

// Onion skin
window.updateOnionSkin = function() {
  const onionCanvas = document.getElementById('onionSkinCanvas');
  const checkbox = document.getElementById('onionSkinToggle');
  if (!onionCanvas || !checkbox) return;
  
  const ctx = onionCanvas.getContext('2d');
  ctx.clearRect(0, 0, onionCanvas.width, onionCanvas.height);
  
  if (!checkbox.checked || ANIMATION_CONFIG.currentFrame === 0) {
    onionCanvas.style.opacity = '0';
    return;
  }
  
  const prevFrame = ANIMATION_CONFIG.frames[ANIMATION_CONFIG.currentFrame - 1];
  if (prevFrame) {
    const img = new Image();
    img.onload = () => {
      ctx.globalAlpha = ANIMATION_CONFIG.onionSkinOpacity;
      ctx.drawImage(img, 0, 0);
      ctx.globalAlpha = 1.0;
    };
    img.src = prevFrame;
    onionCanvas.style.opacity = '1';
  }
};

// Добавить кадр
window.addFrame = function() {
  if (ANIMATION_CONFIG.frames.length >= ANIMATION_CONFIG.MAX_FRAMES) {
    alert('❌ Максимум 3 кадра!');
    return;
  }
  
  ANIMATION_CONFIG.frames.push(getCanvasSnapshot());
  ANIMATION_CONFIG.currentFrame = ANIMATION_CONFIG.frames.length - 1;
  
  updateFrameUI();
  updateOnionSkin();
};

// Назад
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

// Вперёд
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

// Play
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

// FPS
window.updateFPS = function(value) {
  ANIMATION_CONFIG.DEFAULT_FPS = parseInt(value);
  const fpsValue = document.getElementById('fpsValue');
  if (fpsValue) fpsValue.textContent = value;
};

// Сохранить
window.saveAnimation = function() {
  if (ANIMATION_CONFIG.frames.length === 0) {
    alert('❌ Нет кадров!');
    return;
  }
  
  const toolbar = document.getElementById('toolbar');
  const x = toolbar?.dataset?.x;
  const y = toolbar?.dataset?.y;
  
  if (!x || !y) {
    alert('❌ Выбери клетку!');
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
  alert('✅ Сохранено!');
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

// GIF
window.exportGIF = function() {
  if (ANIMATION_CONFIG.frames.length === 0) {
    alert('❌ Нет кадров!');
    return;
  }
  
  if (typeof GIF === 'undefined') {
    alert('❌ GIF.js не загружен!');
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
};

// Загрузка анимаций
function loadAnimations() {
  const cells = document.querySelectorAll('.cell[data-type="animated"]');
  cells.forEach(cell => {
    try {
      const data = JSON.parse(cell.dataset.animation);
      animateCell(cell, data);
    } catch (e) {
      console.error('❌ Animation error:', e);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAnimations);
} else {
  setTimeout(loadAnimations, 500);
}
