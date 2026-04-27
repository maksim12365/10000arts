// ============================================
// АНИМАЦИЯ — ИСПРАВЛЕНО (CANVAS ДОСТУПЕН)
// ============================================

const ANIM = {
  max: 3,
  fps: 8,
  frames: [],
  current: 0,
  playing: false,
  interval: null,
  cellX: null,
  cellY: null,
  isDrawing: false
};

// Открыть редактор
window.openAnim = function() {
  const toolbar = document.getElementById('toolbar');
  const x = toolbar?.dataset?.x;
  const y = toolbar?.dataset?.y;
  
  if (!x || !y) {
    alert('Выбери клетку сначала!');
    return;
  }
  
  ANIM.cellX = x;
  ANIM.cellY = y;
  
  // Проверяем есть ли уже анимация
  const existingData = localStorage.getItem(`cell_${x}_${y}`);
  
  // Закрываем toolbar
  const closeBtn = document.getElementById('btnCloseToolbar');
  if (closeBtn) closeBtn.click();
  
  // Показываем toolbar обратно (чтобы можно было рисовать!)
  setTimeout(() => {
    if (toolbar) toolbar.classList.remove('hidden');
  }, 200);
  
  // Создаём модалку
  const modal = document.createElement('div');
  modal.id = 'animModal';
  modal.innerHTML = `
    <div class="anim-box">
      <div class="anim-head">
        <span>🎬 Анимация (макс. 3 кадра)</span>
        <button onclick="closeAnim()">✕</button>
      </div>
      
      <div class="anim-canvas-wrap">
        <canvas id="animCanvas" width="256" height="256"></canvas>
        <canvas id="onionCanvas" width="256" height="256"></canvas>
      </div>
      
      <div class="anim-info">
        Кадр: <b id="fNum">1</b> / 3
        <span id="frameStatus" style="color:#667eea;font-size:0.85rem;margin-left:10px;">📝 Рисуй!</span>
      </div>
      
      <div class="anim-btns">
        <button onclick="prevFrame()" id="prevB" disabled>⏮️</button>
        <button onclick="playAnim()" id="playB">▶️</button>
        <button onclick="nextFrame()" id="nextB" disabled>⏭️</button>
      </div>
      
      <button onclick="captureFrame()" id="capB" style="width:100%;margin:10px 0;padding:10px;background:#11998e;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">📸 Зафиксировать кадр</button>
      
      <label style="display:flex;align-items:center;justify-content:center;gap:5px;margin:10px 0;">
        <input type="checkbox" id="onionCheck" checked onchange="updateOnion()">
        🧅 Onion Skin (полупрозрачный предыдущий кадр)
      </label>
      
      <div style="text-align:center;margin:10px 0;">
        FPS: <input type="range" min="4" max="12" value="8" oninput="ANIM.fps=this.value;document.getElementById('fpsV').textContent=this.value">
        <span id="fpsV">8</span>
      </div>
      
      <div class="anim-actions">
        <button onclick="closeAnim()" style="padding:10px 20px;background:#999;color:white;border:none;border-radius:8px;cursor:pointer;">❌ Отмена</button>
        <button onclick="saveAnim()" style="padding:10px 20px;background:#11998e;color:white;border:none;border-radius:8px;cursor:pointer;">✅ Сохранить</button>
        <button onclick="exportGIF()" style="padding:10px 20px;background:#667eea;color:white;border:none;border-radius:8px;cursor:pointer;">💾 GIF</button>
      </div>
      
      <div style="text-align:center;margin-top:15px;padding-top:15px;border-top:2px solid #eee;font-size:0.85rem;color:#666;">
        💡 <b>Как работать:</b><br>
        1. Нарисуй что-то → 2. Нажми "📸 Зафиксировать кадр"<br>
        3. Измени рисунок → 4. Снова "📸 Зафиксировать кадр"<br>
        5. Повтори до 3 кадров → 6. "✅ Сохранить"
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Загружаем существующую или создаём новую
  if (existingData) {
    try {
      const data = JSON.parse(existingData);
      ANIM.frames = data.frames || [];
      ANIM.current = ANIM.frames.length > 0 ? ANIM.frames.length - 1 : 0;
      console.log('📥 Загружено кадров:', ANIM.frames.length);
    } catch(e) {
      ANIM.frames = [];
      ANIM.current = 0;
    }
  } else {
    ANIM.frames = [];
    ANIM.current = 0;
  }
  
  // Если нет кадров — создаём первый из текущего canvas
  if (ANIM.frames.length === 0) {
    ANIM.frames = [getSnap()];
  }
  
  // Восстанавливаем последний кадр на canvas
  setTimeout(() => {
    restoreFrame(ANIM.current);
    updateOnion();
    updateUI();
  }, 300);
  
  console.log('🎬 Animation editor opened');
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
  ANIM.cellX = null;
  ANIM.cellY = null;
  console.log('🎬 Animation editor closed');
};

// Снимок canvas
function getSnap() {
  const c = document.getElementById('drawCanvas');
  return c ? c.toDataURL('image/jpeg', 0.6) : null;
}

// Восстановить кадр на canvas
function restoreFrame(i) {
  const c = document.getElementById('drawCanvas');
  if (!c || !ANIM.frames[i]) return;
  
  const ctx = c.getContext('2d');
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, 256, 256);
    ctx.drawImage(img, 0, 0);
  };
  img.src = ANIM.frames[i];
}

// 📸 ЗАФИКСИРОВАТЬ КАДР (главная функция!)
window.captureFrame = function() {
  // Сохраняем текущее состояние canvas как кадр
  const snapshot = getSnap();
  if (!snapshot) {
    alert('❌ Сначала нарисуй что-нибудь!');
    return;
  }
  
  if (ANIM.current < ANIM.frames.length) {
    // Обновляем текущий кадр
    ANIM.frames[ANIM.current] = snapshot;
  } else {
    // Добавляем новый кадр
    ANIM.frames.push(snapshot);
  }
  
  console.log('📸 Кадр зафиксирован:', ANIM.current + 1, '/', ANIM.frames.length);
  
  // Если есть место для ещё кадров — готовим следующий
  if (ANIM.frames.length < ANIM.max) {
    // Очищаем canvas для следующего кадра (но показываем предыдущий полупрозрачным)
    ANIM.current = ANIM.frames.length;
    ANIM.frames.push(snapshot); // Дублируем для onion skin
    updateOnion();
  }
  
  updateUI();
};

// Назад
window.prevFrame = function() {
  if (ANIM.current > 0) {
    // Сначала сохраняем текущее состояние
    ANIM.frames[ANIM.current] = getSnap();
    
    ANIM.current--;
    restoreFrame(ANIM.current);
    updateOnion();
    updateUI();
  }
};

// Вперёд
window.nextFrame = function() {
  if (ANIM.current < ANIM.frames.length - 1) {
    // Сначала сохраняем текущее состояние
    ANIM.frames[ANIM.current] = getSnap();
    
    ANIM.current++;
    restoreFrame(ANIM.current);
    updateOnion();
    updateUI();
  }
};

function updateUI() {
  const fNum = document.getElementById('fNum');
  const prevB = document.getElementById('prevB');
  const nextB = document.getElementById('nextB');
  const capB = document.getElementById('capB');
  const status = document.getElementById('frameStatus');
  
  if (fNum) fNum.textContent = ANIM.current + 1;
  if (prevB) prevB.disabled = ANIM.current === 0;
  if (nextB) nextB.disabled = ANIM.current >= ANIM.frames.length - 1;
  
  if (capB) {
    if (ANIM.frames.length >= ANIM.max && ANIM.current >= ANIM.max - 1) {
      capB.disabled = true;
      capB.textContent = '⛔ Максимум кадров';
      capB.style.background = '#999';
    } else {
      capB.disabled = false;
      capB.textContent = '📸 Зафиксировать кадр';
      capB.style.background = '#11998e';
    }
  }
  
  if (status) {
    if (ANIM.frames.length >= ANIM.max) {
      status.textContent = '✅ Готово к сохранению!';
      status.style.color = '#11998e';
    } else {
      status.textContent = '📝 Рисуй следующий кадр!';
      status.style.color = '#667eea';
    }
  }
}

// Onion Skin
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
  
  const prevFrame = ANIM.frames[ANIM.current - 1];
  if (prevFrame) {
    const img = new Image();
    img.onload = () => {
      ctx.globalAlpha = 0.3;
      ctx.drawImage(img, 0, 0);
      ctx.globalAlpha = 1;
    };
    img.src = prevFrame;
    c.style.opacity = '1';
  }
};

// Play
window.playAnim = function() {
  const btn = document.getElementById('playB');
  if (!btn) return;
  
  if (ANIM.playing) {
    clearInterval(ANIM.interval);
    ANIM.interval = null;
    ANIM.playing = false;
    btn.textContent = '▶️';
    restoreFrame(ANIM.current);
  } else {
    if (ANIM.frames.length < 2) {
      alert('Нужно минимум 2 кадра!');
      return;
    }
    
    ANIM.playing = true;
    let f = 0;
    ANIM.interval = setInterval(() => {
      restoreFrame(f);
      f = (f + 1) % ANIM.frames.length;
    }, 1000 / ANIM.fps);
    btn.textContent = '⏸️';
  }
};

// Сохранить
window.saveAnim = function() {
  if (ANIM.frames.length === 0) {
    alert('❌ Нет кадров!');
    return;
  }
  
  if (!ANIM.cellX || !ANIM.cellY) {
    alert('❌ Выбери клетку!');
    return;
  }
  
  const data = {
    type: 'animated',
    frames: ANIM.frames,
    fps: ANIM.fps,
    time: Date.now()
  };
  
  localStorage.setItem(`cell_${ANIM.cellX}_${ANIM.cellY}`, JSON.stringify(data));
  
  const cell = document.querySelector(`.cell[data-x="${ANIM.cellX}"][data-y="${ANIM.cellY}"]`);
  if (cell) {
    cell.classList.add('occupied', 'anim-cell');
    cell.dataset.type = 'animated';
    cell.dataset.animation = JSON.stringify(data);
    animateCell(cell, data);
  }
  
  closeAnim();
  alert('✅ Анимация сохранена!');
  console.log('✅ Animation saved at:', ANIM.cellX, ANIM.cellY);
};

// Анимация клетки на полотне
function animateCell(cell, data) {
  let f = 0;
  setInterval(() => {
    const img = new Image();
    img.onload = () => {
      cell.style.backgroundImage = `url(${img.src})`;
      cell.style.backgroundSize = 'contain';
      cell.style.backgroundPosition = 'center';
      cell.style.backgroundRepeat = 'no-repeat';
    };
    img.src = data.frames[f];
    f = (f + 1) % data.frames.length;
  }, 1000 / data.fps);
}

// GIF экспорт
window.exportGIF = function() {
  if (ANIM.frames.length === 0) {
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
  console.log('💾 GIF exported');
};

// Загрузка анимаций при старте
function loadAnims() {
  const cells = document.querySelectorAll('.cell[data-type="animated"]');
  cells.forEach(cell => {
    try {
      const data = JSON.parse(cell.dataset.animation);
      animateCell(cell, data);
    } catch(e) {
      console.error('❌ Animation load error:', e);
    }
  });
  console.log('🎬 Animations loaded:', cells.length);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAnims);
} else {
  setTimeout(loadAnims, 500);
}
