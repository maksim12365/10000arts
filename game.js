// ============================================
// ИГРА "ЛОВИ СТРЕЛЫ" - ПОЛНОСТЬЮ РАБОЧАЯ
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
const MAX_LINE_LENGTH = 100;
const MAX_ARROWS_ON_SCREEN = 4;
const MAX_LIVES = 3;
const BASE_SPEED = 1.5;
const FAST_SPEED = 3;
const SUPER_FAST_SPEED = 5;

// Состояние игры
let score = 0;
let lives = MAX_LIVES;
let bestScore = parseInt(localStorage.getItem('arrowGameBest') || '0');
let lines = [];
let arrows = [];
let bombs = [];
let explosions = [];
let isDrawing = false;
let currentLine = null;
let currentLineLength = 0;
let lastPos = null;
let gameRunning = false;
let gameLoopId = null;
let spawnIntervalId = null;
let bombSpawnIntervalId = null;

// Размер canvas
canvas.width = 300;
canvas.height = 400;

if (bestScoreEl) bestScoreEl.textContent = `Рекорд: ${bestScore}`;

// Получить позицию
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return { x: clientX - rect.left, y: clientY - rect.top };
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
  if (lineLimitEl) lineLimitEl.classList.remove('visible');
}

// Рисование
function draw(e) {
  if (!isDrawing || !gameRunning) return;
  e.preventDefault();
  
  const pos = getPos(e);
  const dist = Math.hypot(pos.x - lastPos.x, pos.y - lastPos.y);
  
  if (currentLineLength + dist > MAX_LINE_LENGTH) {
    isDrawing = false;
    if (lineLimitEl) {
      lineLimitEl.classList.add('visible');
      setTimeout(() => lineLimitEl.classList.remove('visible'), 1000);
    }
    return;
  }
  
  currentLine.points.push(pos);
  currentLineLength += dist;
  lastPos = pos;
  
  // Проверка бомб
  checkBombCollision();
}

// Конец рисования
function stopDrawing(e) {
  if (!isDrawing) return;
  if (e) e.preventDefault();
  
  if (currentLine && currentLine.points.length > 1) {
    lines.push({ points: [...currentLine.points], length: currentLineLength });
  }
  
  isDrawing = false;
  currentLine = null;
  currentLineLength = 0;
}

// Проверка бомб
function checkBombCollision() {
  if (!isDrawing || !currentLine) return;
  
  for (const bomb of bombs) {
    if (!bomb.active || bomb.hitThisFrame) continue;
    
    for (let i = 1; i < currentLine.points.length; i++) {
      const p1 = currentLine.points[i - 1];
      const p2 = currentLine.points[i];
      const dist = pointToLineDistance(bomb.x, bomb.y, p1.x, p1.y, p2.x, p2.y);
      
      if (dist < 25) {
        bomb.hitCount++;
        bomb.hitThisFrame = true;
        lives--;
        updateLivesDisplay();
        createExplosion(bomb.x, bomb.y);
        
        if (lives <= 0) {
          gameOver();
          return;
        }
        break;
      }
    }
  }
}

// Спавн стрелы
function spawnOneArrow() {
  if (!gameRunning) return;
  
  const activeArrows = arrows.filter(a => a.active).length;
  if (activeArrows >= MAX_ARROWS_ON_SCREEN) return;
  
  const rand = Math.random();
  let speed = rand < 0.5 ? BASE_SPEED : rand < 0.8 ? FAST_SPEED : SUPER_FAST_SPEED;
  const x = Math.random() * (canvas.width - 40) + 20;
  
  arrows.push({ x, y: -30, speed, active: true, caught: false });
}

// Спавн бомбы
function spawnOneBomb() {
  if (!gameRunning) return;
  
  const activeBombs = bombs.filter(b => b.active).length;
  if (activeBombs >= 2) return;
  
  const rand = Math.random();
  let speed = rand < 0.5 ? BASE_SPEED : rand < 0.8 ? FAST_SPEED : SUPER_FAST_SPEED;
  const x = Math.random() * (canvas.width - 40) + 20;
  
  // Не спавнить близко к стрелам
  const tooClose = arrows.some(a => a.active && Math.abs(a.x - x) < 30 && a.y < 100);
  if (tooClose) return;
  
  bombs.push({ x, y: -30, speed, active: true, hitCount: 0, hitThisFrame: false });
}

// Проверка стрелы
function checkArrowCollision(arrow) {
  for (const line of lines) {
    for (let i = 1; i < line.points.length; i++) {
      const p1 = line.points[i - 1];
      const p2 = line.points[i];
      const dist = pointToLineDistance(arrow.x, arrow.y, p1.x, p1.y, p2.x, p2.y);
      
      if (dist < 30) {
        arrow.caught = true;
        arrow.active = false;
        score++;
        updateLivesDisplay();
        return true;
      }
    }
  }
  return false;
}

// Взрыв
function createExplosion(x, y) {
  explosions.push({ x, y, radius: 10, maxRadius: 50, alpha: 1, active: true });
}

// Обновление взрывов
function updateExplosions() {
  for (const exp of explosions) {
    if (!exp.active) continue;
    exp.radius += 2;
    exp.alpha -= 0.05;
    if (exp.alpha <= 0 || exp.radius >= exp.maxRadius) exp.active = false;
  }
  explosions = explosions.filter(e => e.active);
}

// Расстояние до линии
function pointToLineDistance(px, py, x1, y1, x2, y2) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = lenSq !== 0 ? dot / lenSq : -1;
  
  let xx, yy;
  if (param < 0) { xx = x1; yy = y1; }
  else if (param > 1) { xx = x2; yy = y2; }
  else { xx = x1 + param * C; yy = y1 + param * D; }
  
  return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2);
}

// Обновление
function update() {
  if (!gameRunning) return;
  
  let arrowMissed = false;
  
  for (const bomb of bombs) bomb.hitThisFrame = false;
  
  // Линии
  for (const line of lines) {
    for (const point of line.points) point.y += 1;
  }
  
  // Стрелы
  for (const arrow of arrows) {
    if (!arrow.active || arrow.caught) continue;
    arrow.y += arrow.speed;
    
    if (checkArrowCollision(arrow)) continue;
    if (arrow.y > canvas.height + 50) {
      arrow.active = false;
      arrowMissed = true;
    }
  }
  
  // Бомбы
  for (const bomb of bombs) {
    if (!bomb.active) continue;
    bomb.y += bomb.speed;
    if (bomb.y > canvas.height + 50) bomb.active = false;
  }
  
  updateExplosions();
  
  arrows = arrows.filter(a => a.active || a.caught);
  bombs = bombs.filter(b => b.active);
  lines = lines.filter(l => l.points.some(p => p.y < canvas.height + 100));
  
  if (arrowMissed) gameOver();
}

// Отрисовка
function drawGame() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Сетка
  ctx.strokeStyle = '#e5e5e5';
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
  ctx.lineWidth = 5;
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
  
  // Текущая линия
  if (currentLine && currentLine.points.length > 1) {
    ctx.beginPath();
    ctx.moveTo(currentLine.points[0].x, currentLine.points[0].y);
    for (let i = 1; i < currentLine.points.length; i++) {
      ctx.lineTo(currentLine.points[i].x, currentLine.points[i].y);
    }
    ctx.stroke();
  }
  
  // Стрелы
  for (const arrow of arrows) {
    if (!arrow.active || arrow.caught) continue;
    ctx.save();
    ctx.translate(arrow.x, arrow.y);
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.lineTo(-10, -10);
    ctx.lineTo(10, -10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  
  // Бомбы
  for (const bomb of bombs) {
    if (!bomb.active) continue;
    ctx.save();
    ctx.translate(bomb.x, bomb.y);
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6b7280';
    ctx.beginPath();
    ctx.arc(-5, -5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  // Взрывы
  for (const exp of explosions) {
    if (!exp.active) continue;
    ctx.save();
    ctx.translate(exp.x, exp.y);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, exp.radius);
    gradient.addColorStop(0, `rgba(255, 255, 0, ${exp.alpha})`);
    gradient.addColorStop(0.5, `rgba(255, 100, 0, ${exp.alpha})`);
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, exp.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  // Индикатор длины
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
  drawGame();
  gameLoopId = requestAnimationFrame(gameLoop);
}

// Спавн стрел
function spawnLoop() {
  if (!gameRunning) return;
  spawnOneArrow();
  spawnIntervalId = setTimeout(spawnLoop, Math.random() * 700 + 800);
}

// Спавн бомб
function bombSpawnLoop() {
  if (!gameRunning) return;
  spawnOneBomb();
  bombSpawnIntervalId = setTimeout(bombSpawnLoop, Math.random() * 2000 + 2500);
}

// Обновление жизней
function updateLivesDisplay() {
  if (scoreEl) scoreEl.textContent = `${score}  ${'❤️'.repeat(lives)}`;
}

// Старт
function startGame() {
  if (startScreen) startScreen.style.display = 'none';
  if (gameOverScreen) gameOverScreen.style.display = 'none';
  
  score = 0;
  lives = MAX_LIVES;
  lines = [];
  arrows = [];
  bombs = [];
  explosions = [];
  gameRunning = true;
  
  updateLivesDisplay();
  
  if (bgMusic) {
    bgMusic.volume = 0.3;
    if (bgMusic.paused) bgMusic.play().catch(() => {});
  }
  
  spawnLoop();
  bombSpawnLoop();
  gameLoop();
}

// Конец игры
function gameOver() {
  gameRunning = false;
  if (spawnIntervalId) clearTimeout(spawnIntervalId);
  if (bombSpawnIntervalId) clearTimeout(bombSpawnIntervalId);
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('arrowGameBest', bestScore);
    if (bestScoreEl) bestScoreEl.textContent = `Рекорд: ${bestScore}`;
  }
  
  if (finalScoreEl) finalScoreEl.textContent = score;
  if (finalBestEl) finalBestEl.textContent = bestScore;
  if (gameOverScreen) gameOverScreen.style.display = 'flex';
  
  if (bgMusic) {
    bgMusic.pause();
    bgMusic.currentTime = 0;
  }
}

// Перезапуск
function restartGame() {
  if (gameOverScreen) gameOverScreen.style.display = 'none';
  startGame();
}

// Обработчики
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

canvas.addEventListener('touchstart', startDrawing, { passive: false });
canvas.addEventListener('touchmove', draw, { passive: false });
canvas.addEventListener('touchend', stopDrawing, { passive: false });

window.startGame = startGame;
window.restartGame = restartGame;
