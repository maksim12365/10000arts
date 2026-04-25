// ============================================
// ЧАСТИЦЫ ПРИ РИСОВАНИИ
// ============================================

const PARTICLES_CONFIG = {
  count: 8,           // Количество частиц за событие
  maxSize: 4,         // Максимальный размер частицы
  minSize: 1,         // Минимальный размер
  speed: 2,           // Максимальная скорость
  gravity: 0.15,      // Гравитация
  friction: 0.98,     // Сопротивление воздуха
  fadeSpeed: 0.02,    // Скорость исчезновения
  colors: []          // Будут браться из currentColor
};

let particles = [];
let particleCanvas = null;
let particleCtx = null;
let animationId = null;

// Инициализация системы частиц
function initParticles() {
  // Создаём canvas для частиц
  particleCanvas = document.createElement('canvas');
  particleCanvas.id = 'particleCanvas';
  particleCanvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
  `;
  document.body.appendChild(particleCanvas);
  
  particleCtx = particleCanvas.getContext('2d');
  resizeParticleCanvas();
  
  // Обновляем размер при изменении окна
  window.addEventListener('resize', resizeParticleCanvas);
  
  // Запускаем анимацию
  animateParticles();
  
  console.log('✅ Particle system initialized');
}

// Подгоняем размер canvas под экран
function resizeParticleCanvas() {
  if (!particleCanvas) return;
  particleCanvas.width = window.innerWidth;
  particleCanvas.height = window.innerHeight;
}

// Создаём частицы в точке
function spawnParticles(x, y, color) {
  if (!color) return;
  
  for (let i = 0; i < PARTICLES_CONFIG.count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * PARTICLES_CONFIG.speed;
    
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2, // Немного вверх
      size: Math.random() * (PARTICLES_CONFIG.maxSize - PARTICLES_CONFIG.minSize) + PARTICLES_CONFIG.minSize,
      color: color,
      life: 1,
      decay: Math.random() * 0.03 + PARTICLES_CONFIG.fadeSpeed
    });
  }
}

// Основной цикл анимации
function animateParticles() {
  if (!particleCtx) return;
  
  // Очищаем canvas
  particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  
  // Обновляем и рисуем частицы
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    
    // Физика
    p.x += p.vx;
    p.y += p.vy;
    p.vy += PARTICLES_CONFIG.gravity;
    p.vx *= PARTICLES_CONFIG.friction;
    p.vy *= PARTICLES_CONFIG.friction;
    
    // Уменьшаем жизнь
    p.life -= p.decay;
    
    // Удаляем мёртвые частицы
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    
    // Рисуем частицу
    particleCtx.globalAlpha = p.life;
    particleCtx.fillStyle = p.color;
    particleCtx.beginPath();
    particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    particleCtx.fill();
  }
  
  particleCtx.globalAlpha = 1;
  
  // Продолжаем анимацию
  animationId = requestAnimationFrame(animateParticles);
}

// Интеграция с рисованием на канвасе
function hookIntoDrawing() {
  const canvas = document.getElementById('drawCanvas');
  if (!canvas) return;
  
  // Сохраняем оригинальные функции
  const originalAddEventListener = canvas.addEventListener;
  
  // Отслеживаем движение мыши/тача
  let isDrawing = false;
  let lastParticlePos = { x: 0, y: 0 };
  
  canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    spawnParticles(e.clientX, e.clientY, currentColor);
    lastParticlePos = { x: e.clientX, y: e.clientY };
  });
  
  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Создаём частицы только если движение достаточно большое
    const dist = Math.sqrt(
      Math.pow(e.clientX - lastParticlePos.x, 2) + 
      Math.pow(e.clientY - lastParticlePos.y, 2)
    );
    
    if (dist > 5) {
      spawnParticles(e.clientX, e.clientY, currentColor);
      lastParticlePos = { x: e.clientX, y: e.clientY };
    }
  });
  
  canvas.addEventListener('mouseup', () => { isDrawing = false; });
  canvas.addEventListener('mouseout', () => { isDrawing = false; });
  
  // Мобильные устройства
  canvas.addEventListener('touchstart', (e) => {
    isDrawing = true;
    const touch = e.touches[0];
    spawnParticles(touch.clientX, touch.clientY, currentColor);
    lastParticlePos = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });
  
  canvas.addEventListener('touchmove', (e) => {
    if (!isDrawing) return;
    const touch = e.touches[0];
    
    const dist = Math.sqrt(
      Math.pow(touch.clientX - lastParticlePos.x, 2) + 
      Math.pow(touch.clientY - lastParticlePos.y, 2)
    );
    
    if (dist > 5) {
      spawnParticles(touch.clientX, touch.clientY, currentColor);
      lastParticlePos = { x: touch.clientX, y: touch.clientY };
    }
  }, { passive: true });
  
  canvas.addEventListener('touchend', () => { isDrawing = false; });
  
  console.log('✅ Drawing hook initialized');
}

// Частицы при клике на клетку (для эффекта)
function spawnClickParticles(x, y, color) {
  spawnParticles(x, y, color);
}

// Очистка всех частиц
function clearParticles() {
  particles = [];
}

// Пауза/возобновление
let isPaused = false;

function toggleParticles() {
  isPaused = !isPaused;
  if (isPaused) {
    if (animationId) cancelAnimationFrame(animationId);
  } else {
    animateParticles();
  }
  return isPaused;
}

// Инициализация после загрузки страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    hookIntoDrawing();
  });
} else {
  initParticles();
  hookIntoDrawing();
}

// Делаем функции доступными
window.spawnParticles = spawnParticles;
window.spawnClickParticles = spawnClickParticles;
window.clearParticles = clearParticles;
window.toggleParticles = toggleParticles;
window.PARTICLES_CONFIG = PARTICLES_CONFIG;
