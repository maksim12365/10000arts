// ============================================
// АНИМАЦИЯ — ПРОСТАЯ ВЕРСИЯ
// ============================================

const ANIM = {
  max: 3,
  fps: 8,
  frames: [],
  current: 0,
  playing: false,
  interval: null
};

// Открыть
window.openAnim = function() {
  const toolbar = document.getElementById('toolbar');
  const x = toolbar?.dataset?.x;
  const y = toolbar?.dataset?.y;
  
  if (!x || !y) {
    alert('Выбери клетку сначала!');
    return;
  }
  
  // Закрыть toolbar
  document.getElementById('btnCloseToolbar')?.click();
  
  // Создать модалку
  const modal = document.createElement('div');
  modal.id = 'animModal';
  modal.innerHTML = `
    <div class="anim-box">
      <div class="anim-head">
        <span>🎬 Анимация (3 кадра)</span>
        <button onclick="closeAnim()">✕</button>
      </div>
      
      <div class="anim-canvas-wrap">
        <canvas id="animCanvas" width="256" height="256"></canvas>
        <canvas id="onionCanvas" width="256" height="256"></canvas>
      </div>
      
      <div class="anim-info">Кадр: <b id="fNum">1</b> / 3</div>
      
      <div class="anim-btns">
        <button onclick="prevFrame()" id="prevB">⏮️</button>
        <button onclick="playAnim()" id="playB">▶️</button>
        <button onclick="nextFrame()" id="nextB">⏭️</button>
      </div>
      
      <button onclick="addFrame()" id="addB" style="width:100%;margin:10px 0;padding:10px;background:#667eea;color:white;border:none;border-radius:8px;cursor:pointer;">+ Кадр</button>
      
      <label style="display:flex;align-items:center;justify-content:center;gap:5px;margin:10px 0;">
        <input type="checkbox" id="onionCheck" checked onchange="updateOnion()">
        🧅 Onion
      </label>
      
      <div style="text-align:center;margin:10px 0;">
        FPS: <input type="range" min="4" max="12" value="8" oninput="ANIM.fps=this.value;document.getElementById('fpsV').textContent=this.value">
        <span id="fpsV">8</span>
      </div>
      
      <div class="anim-actions">
        <button onclick="closeAnim()" style="padding:10px 20px;background:#999;color:white;border:none;border-radius:8px;cursor:pointer;">❌</button>
        <button onclick="saveAnim()" style="padding:10px 20px;background:#11998e;color:white;border:none;border-radius:8px;cursor:pointer;">✅</button>
        <button onclick="exportGIF()" style="padding:10px 20px;background:#667eea;color:white;border:none;border-radius:8px;cursor:pointer;">💾</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  ANIM.frames = [getSnap()];
  ANIM.current = 0;
  
  setTimeout(() => {
    copyCanvas();
    updateOnion();
    updateUI();
  }, 100);
};

// Закрыть
window.closeAnim = function() {
  if (ANIM.interval) {
    clearInterval(ANIM.interval);
    ANIM.interval = null;
  }
  document.getElementById('animModal')?.remove();
  ANIM.frames = [];
  ANIM.current = 0;
  ANIM.playing = false;
};

// Снимок
function getSnap() {
  const c = document.getElementById('drawCanvas');
  return c ? c.toDataURL('image/jpeg', 0.6) : null;
}

// Копировать
function copyCanvas() {
  const src = document.getElementById('drawCanvas');
  const dst = document.getElementById('animCanvas');
  if (!src || !dst) return;
  
  const ctx = dst.getContext('2d');
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, 256, 256);
    ctx.drawImage(img, 0, 0);
  };
  img.src = src.toDataURL();
}

// Восстановить
function restoreFrame(i) {
  const c = document.getElementById('drawCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, 256, 256);
    ctx.drawImage(img, 0, 0);
  };
  img.src = ANIM.frames[i];
}

// Onion
window.updateOnion = function() {
  const c = document.getElementById('onionCanvas');
  const check = document.getElementById('onionCheck');
  if (!c || !check) return;
  
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 256, 256);
  
  if (!check.checked || ANIM.current === 0) {
    c.style.opacity = '0';
    return;
  }
  
  const img = new Image();
  img.onload = () => {
    ctx.globalAlpha = 0.3;
    ctx.drawImage(img, 0, 0);
    ctx.globalAlpha = 1;
  };
  img.src = ANIM.frames[ANIM.current - 1];
  c.style.opacity = '1';
};

// Добавить кадр
window.addFrame = function() {
  if (ANIM.frames.length >= ANIM.max) {
    alert('Максимум 3 кадра!');
    return;
  }
  ANIM.frames.push(getSnap());
  ANIM.current = ANIM.frames.length - 1;
  updateUI();
  updateOnion();
};

// Назад
window.prevFrame = function() {
  if (ANIM.current > 0) {
    ANIM.current--;
    restoreFrame(ANIM.current);
    setTimeout(() => { copyCanvas(); updateUI(); updateOnion(); }, 100);
  }
};

// Вперёд
window.nextFrame = function() {
  if (ANIM.current < ANIM.frames.length - 1) {
    ANIM.current++;
    restoreFrame(ANIM.current);
    setTimeout(() => { copyCanvas(); updateUI(); updateOnion(); }, 100);
  }
};

function updateUI() {
  document.getElementById('fNum').textContent = ANIM.current + 1;
  document.getElementById('prevB').disabled = ANIM.current === 0;
  document.getElementById('nextB').disabled = ANIM.current >= ANIM.frames.length - 1;
  document.getElementById('addB').disabled = ANIM.frames.length >= ANIM.max;
}

// Play
window.playAnim = function() {
  const btn = document.getElementById('playB');
  if (ANIM.playing) {
    clearInterval(ANIM.interval);
    ANIM.interval = null;
    ANIM.playing = false;
    btn.textContent = '▶️';
    restoreFrame(ANIM.current);
    setTimeout(copyCanvas, 100);
  } else {
    ANIM.playing = true;
    let f = 0;
    ANIM.interval = setInterval(() => {
      restoreFrame(f);
      setTimeout(copyCanvas, 100);
      f = (f + 1) % ANIM.frames.length;
    }, 1000 / ANIM.fps);
    btn.textContent = '⏸️';
  }
};

// Сохранить
window.saveAnim = function() {
  if (ANIM.frames.length === 0) { alert('Нет кадров!'); return; }
  
  const toolbar = document.getElementById('toolbar');
  const x = toolbar?.dataset?.x;
  const y = toolbar?.dataset?.y;
  
  if (!x || !y) { alert('Выбери клетку!'); return; }
  
  const data = {
    type: 'animated',
    frames: ANIM.frames,
    fps: ANIM.fps,
    time: Date.now()
  };
  
  localStorage.setItem(`cell_${x}_${y}`, JSON.stringify(data));
  
  const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
  if (cell) {
    cell.classList.add('occupied', 'anim-cell');
    cell.dataset.type = 'animated';
    cell.dataset.animation = JSON.stringify(data);
    animateCell(cell, data);
  }
  
  closeAnim();
  alert('Сохранено!');
};

function animateCell(cell, data) {
  let f = 0;
  setInterval(() => {
    const img = new Image();
    img.onload = () => {
      cell.style.backgroundImage = `url(${img.src})`;
      cell.style.backgroundSize = 'contain';
      cell.style.backgroundPosition = 'center';
    };
    img.src = data.frames[f];
    f = (f + 1) % data.frames.length;
  }, 1000 / data.fps);
}

// GIF
window.exportGIF = function() {
  if (ANIM.frames.length === 0) { alert('Нет кадров!'); return; }
  if (typeof GIF === 'undefined') { alert('GIF.js не загружен!'); return; }
  
  const gif = new GIF({ workers: 2, quality: 10, width: 256, height: 256 });
  ANIM.frames.forEach(f => {
    const img = new Image();
    img.src = f;
    gif.addFrame(img, { delay: 1000 / ANIM.fps });
  });
  
  gif.on('finished', blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anim-${Date.now()}.gif`;
    a.click();
    URL.revokeObjectURL(url);
  });
  gif.render();
};

// Загрузка
function loadAnims() {
  document.querySelectorAll('.cell[data-type="animated"]').forEach(cell => {
    try {
      const data = JSON.parse(cell.dataset.animation);
      animateCell(cell, data);
    } catch(e) { console.error(e); }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAnims);
} else {
  setTimeout(loadAnims, 500);
}
