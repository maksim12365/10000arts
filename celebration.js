// ============================================
// ЭФФЕКТ ПРИ СОХРАНЕНИИ (CELEBRATION)
// ============================================

const CELEBRATION_CONFIG = {
  confettiCount: 80,        // Количество конфетти
  particleCount: 50,        // Количество частиц
  duration: 3000,           // Длительность анимации (мс)
  colors: [                 // Цвета конфетти
    '#667eea', '#764ba2', '#f093fb', '#f5576c', 
    '#4facfe', '#00f2fe', '#43e97b', '#fa709a',
    '#fee140', '#30cfd0', '#a8edea', '#fed6e3'
  ]
};

let celebrationActive = false;

// Инициализация
function initCelebration() {
  console.log('✅ Celebration system initialized');
}

// Запуск празднования
function triggerCelebration(x, y) {
  if (celebrationActive) return;
  celebrationActive = true;
  
  console.log('🎉 Celebration triggered at:', x, y);
  
  // 1. Конфетти
  spawnConfetti();
  
  // 2. Подсветка клетки
  highlightCell(x, y);
  
  // 3. Звук (опционально)
  playCelebrationSound();
  
  // 4. Сообщение
  showCelebrationMessage(x, y);
  
  // 5. Авто-отключение через 3 секунды
  setTimeout(() => {
    celebrationActive = false;
  }, CELEBRATION_CONFIG.duration);
}

// Создание конфетти
function spawnConfetti() {
  const colors = CELEBRATION_CONFIG.colors;
  
  for (let i = 0; i < CELEBRATION_CONFIG.confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    
    // Случайная позиция (сверху экрана)
    const startX = Math.random() * window.innerWidth;
    const startY = -20;
    
    // Случайный цвет
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Случайный размер
    const size = Math.random() * 10 + 8;
    
    // Случайная форма
    const isCircle = Math.random() > 0.5;
    
    confetti.style.cssText = `
      position: fixed;
      left: ${startX}px;
      top: ${startY}px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: ${isCircle ? '50%' : '2px'};
      pointer-events: none;
      z-index: 10001;
      animation: confettiFall ${Math.random() * 2 + 2}s linear forwards;
      transform: rotate(${Math.random() * 360}deg);
    `;
    
    document.body.appendChild(confetti);
    
    // Удаляем после анимации
    setTimeout(() => confetti.remove(), 4000);
  }
}

// Подсветка клетки
function highlightCell(x, y) {
  const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
  if (!cell) return;
  
  // Сохраняем оригинальные стили
  const originalBoxShadow = cell.style.boxShadow;
  const originalTransform = cell.style.transform;
  const originalZIndex = cell.style.zIndex;
  
  // Применяем анимацию
  cell.style.boxShadow = '0 0 30px 10px gold';
  cell.style.zIndex = '1000';
  cell.style.transform = 'scale(1.3)';
  cell.style.transition = 'all 0.3s ease';
  
  // Пульсация
  let pulse = 0;
  const pulseInterval = setInterval(() => {
    pulse++;
    const scale = 1.3 + Math.sin(pulse * 0.5) * 0.1;
    cell.style.transform = `scale(${scale})`;
    
    if (pulse > 6) {
      clearInterval(pulseInterval);
      // Возвращаем оригинальные стили
      cell.style.boxShadow = originalBoxShadow;
      cell.style.zIndex = originalZIndex;
      cell.style.transform = originalTransform;
    }
  }, 200);
}

// Сообщение о праздновании
function showCelebrationMessage(x, y) {
  const message = document.createElement('div');
  message.className = 'celebration-message';
  message.innerHTML = `
    <div class="celebration-content">
      <div class="celebration-icon">🎨</div>
      <div class="celebration-text">
        <h3>Твой рисунок сохранён!</h3>
        <p>📍 Позиция: ${x}, ${y}</p>
      </div>
      <div class="celebration-stars">✨🎉✨</div>
    </div>
  `;
  
  document.body.appendChild(message);
  
  // Анимация появления
  setTimeout(() => message.classList.add('show'), 100);
  
  // Удаляем через 3 секунды
  setTimeout(() => {
    message.classList.remove('show');
    setTimeout(() => message.remove(), 500);
  }, 3000);
}

// Звук (опционально, можно отключить)
function playCelebrationSound() {
  // Простой beep через Web Audio API
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 523.25; // C5
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    // Второй тон
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      
      osc2.frequency.value = 659.25; // E5
      osc2.type = 'sine';
      
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.5);
    }, 150);
    
  } catch (error) {
    console.log('🔇 Sound disabled:', error);
  }
}

// Интеграция с saveDrawing
function hookIntoSaveDrawing() {
  const originalSaveDrawing = window.saveDrawing;
  
  if (originalSaveDrawing) {
    window.saveDrawing = async function() {
      const toolbar = document.getElementById('toolbar');
      if (!toolbar) return;
      
      const x = parseInt(toolbar.dataset.x);
      const y = parseInt(toolbar.dataset.y);
      
      // Вызываем оригинальную функцию
      await originalSaveDrawing();
      
      // Если успешно - запускаем празднование
      const userPos = localStorage.getItem('currentUserPosition');
      if (userPos) {
        const pos = JSON.parse(userPos);
        if (pos.x === x && pos.y === y) {
          triggerCelebration(x, y);
        }
      }
    };
  }
  
  console.log('✅ Save drawing hook initialized');
}

// Отключить празднование (для настроек)
function toggleCelebration(enabled) {
  localStorage.setItem('celebrationEnabled', enabled);
  console.log('🎉 Celebration:', enabled ? 'enabled' : 'disabled');
}

function isCelebrationEnabled() {
  return localStorage.getItem('celebrationEnabled') !== 'false';
}

// Инициализация
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initCelebration();
    hookIntoSaveDrawing();
  });
} else {
  initCelebration();
  hookIntoSaveDrawing();
}

// Делаем функции доступными
window.triggerCelebration = triggerCelebration;
window.toggleCelebration = toggleCelebration;
window.isCelebrationEnabled = isCelebrationEnabled;
