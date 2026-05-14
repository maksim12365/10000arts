// ============================================
// ИГРА "ЛОВИ СТРЕЛЫ"
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('bestScore');
const lineLimitEl = document.getElementById('lineLimit');
const gameOverScreen = document.getElementById('gameOver');
const startScreen = document.getElementById('startScreen');
const finalScoreEl = document.getElementById('finalScore');
const finalBestEl = document.getElementById('finalBest');
const bgMusic = document.getElementById('bgMusic');

// Настройки
const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 400;
const MAX_LINE_LENGTH = 120; // пикселей (~1.5 см)
const ARROW_SPEEDS = [1, 2, 3.5]; // разная скорость
const MAX_ARROWS = 4;
const SPAWN_INTERVAL_MIN = 400;
const SPAWN_INTERVAL_MAX = 1200;

// Состояние игры
let score = 0;
let bestScore = parseInt(localStorage.getItem('arrowGameBest') || '0');
let lines = [];
let arrows = [];
let isDrawing = false;
let currentLine = null;
let currentLineLength = 0;
let lastPos = { x: 0, y: 0 };
let gameRunning = false;
let gameLoopId = null;
let spawnTimeoutId = null;
let canvasOffset = { x: 0, y: 0 };

// Инициализация canvas
function initCanvas() {
  const isMobile = window.innerWidth < 600;
  canvas.width = isMobile ? Math.min(280, window.innerWidth - 40) : CANVAS_WIDTH;
  canvas.height = canvas.width * (CANVAS_HEIGHT / CANVAS_WIDTH);
  
  canvasOffset.x = canvas.getBoundingClientRect().left;
  canvasOffset.y = canvas.getBoundingClientRect().top;
  
  bestScoreEl.textContent = `Рекорд: ${bestScore}`;
}

// Получить позицию мыши/тача
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height)
  };
}

// Начало рисования
function startDrawing(e) {
  if (!gameRunning) return;
  e.preventDefault();
  
  const pos = getPos(e);
  isDrawing = true;
  currentLine = { points: [pos], length: 0 };
  currentLineLength = 0;
  lastPos = pos;
  lineLimitEl.classList.remove('visible');
}

// Рисование
function draw(e) {
  if (!isDrawing || !gameRunning) return;
  e.preventDefault();
  
  const pos = getPos(e);
  const dist = Math.hypot(pos.x - lastPos.x, pos.y - lastPos.y);
  
  // Проверка максимальной длины
  if (currentLineLength + dist > MAX_LINE_LENGTH) {
    isDrawing = false;
    lineLimitEl.classList.add('visible');
    setTimeout(() => lineLimitEl.classList.remove('visible'), 1000);
    return;
  }
  
  currentLine.points.push(pos);
  currentLineLength += dist;
  lastPos = pos;
}

// Конец рисования
function stopDrawing(e) {
  if (!isDrawing) return;
  e?.preventDefault();
  
  if (currentLine && currentLine.points.length > 1) {
    lines.push({
      points: [...currentLine.points],
      length: currentLineLength
    });
  }
  
  isDrawing = false;
  currentLine = null;
  currentLineLength = 0;
}

// Спавн стрелы
function spawnArrow() {
  if (!gameRunning) return;
  
  const count = Math.floor(Math.random() * MAX_ARROWS) + 1;
  
  for (let i = 0; i < count; i++) {
    const speed = ARROW_SPEEDS[Math.floor(Math.random() * ARROW_SPEEDS.length)];
    arrows.push({
      x: Math.random() * (canvas.width - 20) + 10,
      y: -30,
      speed: speed,
      width: 20,
      height: 30,
      stuck: false,
      active: true
    });
  }
  
  // Следующий спавн
  const nextSpawn = Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN) + SPAWN_INTERVAL_MIN;
  spawnTimeoutId = setTimeout(spawnArrow, nextSpawn);
}

// Проверка коллизии
function checkCollision(arrow, lines) {
  for (const line of lines) {
    for (let i = 1; i < line.points.length; i++) {
      const p1 = line.points[i - 1];
      const p2 = line.points[i];
      
      // Расстояние от точки до отрезка
      const dist = pointToLineDistance(arrow.x, arrow.y, p1.x, p1.y, p2.x, p2.y);
      
      if (dist < 15) { // 15px = попало!
        arrow.stuck = true;
        arrow.stuckX = arrow.x;
        arrow.stuckY = arrow.y;
        return true;
      }
    }
  }
  return false;
}

// Математика: расстояние от точки до отрезка
function pointToLineDistance(px, py, x1, y1, x2, y2) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) param = dot / lenSq;
  
  let xx, yy;
  
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = px - xx;
  const dy = py - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
}

// Обновление игры
function update() {
  if (!gameRunning) return;
  
  // Двигаем стрелы
  for (const arrow of arrows) {
    if (!arrow.active) continue;
    
    if (!arrow.stuck) {
      arrow.y += arrow.speed;
      
      // Проверка коллизии
      if (checkCollision(arrow, lines)) {
        score++;
        scoreEl.textContent = score;
      }
      
      // Проверка пропуска
      if (arrow.y > canvas.height && !arrow.stuck) {
        gameOver();
        return;
      }
    }
  }
  
  // Двигаем линии вниз
  for (const line of lines) {
    for (const point of line.points) {
      point.y += 1.5;
    }
  }
  
  // Двигаем застрявшие стрелы
  for (const arrow of arrows) {
    if (arrow.stuck) {
      arrow.stuckY += 1.5;
      arrow.x = arrow.stuckX;
      arrow.y = arrow.stuckY;
    }
  }
  
  // Удаляем что ушло за край
  arrows = arrows.filter(a => a.y < canvas.height + 50 && a.active);
  lines = lines.filter(l => l.points.some(p => p.y < canvas.height + 50));
}

// Отрисовка
function draw() {
  // Очистка
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Сетка (для красоты)
  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  
  // Линии
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  for (const line of lines) {
    if (line.points.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(line.points[0].x, line.points[0].y);
    for (let i = 1; i < line.points.length; i++) {
      ctx.lineTo(line.points[i].x, line.points[i].y);
    }
    ctx.stroke();
  }
  
  // Текущая линия (которую рисуем)
  if (currentLine && currentLine.points.length > 0) {
    ctx.beginPath();
    ctx.moveTo(currentLine.points[0].x, currentLine.points[0].y);
    for (let i = 1; i < currentLine.points.length; i++) {
      ctx.lineTo(currentLine.points[i].x, currentLine.points[i].y);
    }
    ctx.stroke();
  }
  
  // Стрелы
  for (const arrow of arrows) {
    if (!arrow.active) continue;
    
    ctx.save();
    ctx.translate(arrow.x, arrow.y);
    ctx.rotate(Math.PI); // Стрела смотрит вниз
    
    // Тело стрелы
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(-8, 10);
    ctx.lineTo(0, 5);
    ctx.lineTo(8, 10);
    ctx.closePath();
    ctx.fill();
    
    // Оперение
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(-6, 10, 12, 8);
    
    ctx.restore();
  }
  
  // Индикатор максимальной длины
  if (isDrawing) {
    const ratio = currentLineLength / MAX_LINE_LENGTH;
    ctx.fillStyle = ratio > 0.8 ? '#dc2626' : '#10b981';
    ctx.fillRect(10, 10, 100 * ratio, 5);
    ctx.strokeStyle = '#333';
    ctx.strokeRect(10, 10, 100, 5);
  }
}

// Игровой цикл
function gameLoop() {
  if (!gameRunning) return;
  update();
  draw();
  gameLoopId = requestAnimationFrame(gameLoop);
}

// Старт игры
function startGame() {
  startScreen.style.display = 'none';
  gameOverScreen.style.display = 'none';
  
  score = 0;
  lines = [];
  arrows = [];
  scoreEl.textContent = '0';
  gameRunning = true;
  
  // Запуск музыки (после клика)
  bgMusic.volume = 0.3;
  bgMusic.play().catch(e => console.log('Музыка не запустилась:', e));
  
  // Первый спавн
  spawnArrow();
  
  // Игровой цикл
  gameLoop();
}

// Конец игры
function gameOver() {
  gameRunning = false;
  clearTimeout(spawnTimeoutId);
  cancelAnimationFrame(gameLoopId);
  
  // Обновляем рекорд
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('arrowGameBest', bestScore);
    bestScoreEl.textContent = `Рекорд: ${bestScore}`;
  }
  
  // Показываем экран проигрыша
  finalScoreEl.textContent = score;
  finalBestEl.textContent = bestScore;
  gameOverScreen.style.display = 'block';
  
  // Останавливаем музыку
  bgMusic.pause();
  bgMusic.currentTime = 0;
}

// Перезапуск
function restartGame() {
  gameOverScreen.style.display = 'none';
  startGame();
}

// Обработчики событий
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

canvas.addEventListener('touchstart', startDrawing, { passive: false });
canvas.addEventListener('touchmove', draw, { passive: false });
canvas.addEventListener('touchend', stopDrawing, { passive: false });

// Ресайз окна
window.addEventListener('resize', () => {
  canvasOffset.x = canvas.getBoundingClientRect().left;
  canvasOffset.y = canvas.getBoundingClientRect().top;
});

// Инициализация
initCanvas();
window.addEventListener('load', initCanvas);
