// ============================================
// ИГРА "ЛОВИ СТРЕЛЫ" С БОМБАМИ
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
const BASE_SPEED = 1.5;
const FAST_SPEED = 3;
const SUPER_FAST_SPEED = 5;
const MAX_LIVES = 3;

// Состояние игры
let score = 0;
let bestScore = parseInt(localStorage.getItem('arrowGameBest') || '0');
let lines = [];
let arrows = [];
let bombs = [];
let explosions = [];
let lives = MAX_LIVES;
let isDrawing = false;
let currentLine = null;
let currentLineLength = 0;
let lastPos = null;
let gameRunning = false;
let gameLoopId = null;
let spawnIntervalId = null;
let bombSpawnIntervalId = null;

canvas.width = 300;
canvas.height = 400;

bestScoreEl.textContent = `Рекорд: ${bestScore}`;

// Получить позицию мыши/тача
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
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
  if (e) e.preventDefault();
  
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

// Спавн ОДНОЙ стрелы
function spawnOneArrow() {
  if (!gameRunning) return;
  
  const activeArrows = arrows.filter(a => a.active).length;
  
  if (activeArrows >= MAX_ARROWS_ON_SCREEN) {
    return;
  }
  
  const rand = Math.random();
  let speed;
  if (rand < 0.5) speed = BASE_SPEED;
  else if (rand < 0.8) speed = FAST_SPEED;
  else speed = SUPER_FAST_SPEED;
  
  const x = Math.random() * (canvas.width - 40) + 20;
  
  arrows.push({
    x: x,
    y: -30,
    speed: speed,
    width: 20,
    height: 30,
    caught: false,
    active: true
  });
}

// Спавн БОМБЫ (реже чем стрелы)
function spawnOneBomb() {
  if (!gameRunning) return;
  
  const activeBombs = bombs.filter(b => b.active).length;
  
  // Максимум 1-2 бомбы на экране
  if (activeBombs >= 2) {
    return;
  }
  
  const rand = Math.random();
  let speed;
  if (rand < 0.5) speed = BASE_SPEED;
  else if (rand < 0.8) speed = FAST_SPEED;
  else speed = SUPER_FAST_SPEED;
  
  const x = Math.random() * (canvas.width - 40) + 20;
  
  // Проверка чтобы не на той же линии что стрела
  const tooClose = arrows.some(a => a.active && Math.abs(a.x - x) < 30 && a.y < 100);
  
  if (tooClose) {
    return; // Не спавним если слишком близко к стреле
  }
  
  bombs.push({
    x: x,
    y: -30,
    speed: speed,
    radius: 15,
    active: true,
    hitCount: 0
  });
}

// Проверка коллизии со стрелой
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
        scoreEl.textContent = score;
        return true;
      }
    }
  }
  return false;
}

// Проверка коллизии с бомбой
function checkBombCollision(bomb) {
  for (const line of lines) {
    for (let i = 1; i < line.points.length; i++) {
      const p1 = line.points[i - 1];
      const p2 = line.points[i];
      
      const dist = pointToLineDistance(bomb.x, bomb.y, p1.x, p1.y, p2.x, p2.y);
      
      if (dist < 25) {
        bomb.hitCount++;
        
        // Создаём взрыв
        createExplosion(bomb.x, bomb.y, bomb.hitCount);
        
        if (bomb.hitCount >= 3) {
          bomb.active = false;
          // 3 попадания = игра окончена
          gameOver();
          return true;
        }
        
        return true;
      }
    }
  }
  return false;
}

// Создание взрыва
function createExplosion(x, y, intensity) {
  explosions.push({
    x: x,
    y: y,
    radius: 10,
    maxRadius: 40 + (intensity * 10),
    alpha: 1,
    active: true
  });
}

// Обновление взрывов
function updateExplosions() {
  for (const exp of explosions) {
    if (!exp.active) continue;
    
    exp.radius += 2;
    exp.alpha -= 0.05;
    
    if (exp.alpha <= 0 || exp.radius >= exp.maxRadius) {
      exp.active = false;
    }
  }
  
  explosions = explosions.filter(e => e.active);
}

// Отрисовка взрывов
function drawExplosions() {
  for (const exp of explosions) {
    if (!exp.active) continue;
    
    ctx.save();
    ctx.translate(exp.x, exp.y);
    
    // Оранжево-красный взрыв
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, exp.radius);
    gradient.addColorStop(0, `rgba(255, 255, 0, ${exp.alpha})`);
    gradient.addColorStop(0.5, `rgba(255, 100, 0, ${exp.alpha})`);
    gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, exp.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
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
  
  let arrowMissed = false;
  
  // Двигаем линии
  for (const line of lines) {
    for (const point of line.points) {
      point.y += 1;
    }
  }
  
  // Двигаем стрелы
  for (const arrow of arrows) {
    if (!arrow.active || arrow.caught) continue;
    
    arrow.y += arrow.speed;
    
    if (checkArrowCollision(arrow)) {
      continue;
    }
    
    if (arrow.y > canvas.height + 50) {
      arrow.active = false;
      arrowMissed = true;
    }
  }
  
  // Двигаем бомбы
  for (const bomb of bombs) {
    if (!bomb.active) continue;
    
    bomb.y += bomb.speed;
    
    if (checkBombCollision(bomb)) {
      continue;
    }
    
    if (bomb.y > canvas.height + 50) {
      bomb.active = false;
    }
  }
  
  // Обновляем взрывы
  updateExplosions();
  
  // Удаляем неактивные
  arrows = arrows.filter(a => a.active || a.caught);
  bombs = bombs.filter(b => b.active);
  lines = lines.filter(l => l.points.some(p => p.y < canvas.height + 100));
  
  if (arrowMissed) {
    gameOver();
    return;
  }
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
    
    // Тело бомбы (чёрный круг)
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.arc(0, 0, bomb.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Блеск
    ctx.fillStyle = '#6b7280';
    ctx.beginPath();
    ctx.arc(-5, -5, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Индикатор попаданий (маленькие точки)
    for (let i = 0; i < bomb.hitCount; i++) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-8 + (i * 8), 8, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  // Взрывы
  drawExplosions();
  
  // Индикатор длины линии
  if (isDrawing) {
    const ratio = currentLineLength / MAX_LINE_LENGTH;
    ctx.fillStyle = ratio > 0.8 ? '#dc2626' : '#10b981';
    ctx.fillRect(10, 10, 100 * ratio, 5);
    ctx.strokeStyle = '#333';
    ctx.strokeRect(10, 10, 100, 5);
  }
  
  // Жизни (вверху справа)
  ctx.fillStyle = '#ef4444';
  ctx.font = '20px Arial';
  ctx.textAlign = 'right';
  let livesText = '❤️'.repeat(lives);
  ctx.fillText(livesText, canvas.width - 15, 30);
}

// Игровой цикл
function gameLoop() {
  if (!gameRunning) return;
  update();
  drawGame();
  gameLoopId = requestAnimationFrame(gameLoop);
}

// Цикл спавна стрел
function spawnLoop() {
  if (!gameRunning) return;
  
  spawnOneArrow();
  
  const delay = Math.random() * 700 + 800;
  spawnIntervalId = setTimeout(spawnLoop, delay);
}

// Цикл спавна бомб (реже)
function bombSpawnLoop() {
  if (!gameRunning) return;
  
  spawnOneBomb();
  
  // Бомбы спавнятся в 3 раза реже стрел
  const delay = Math.random() * 2000 + 2500;
  bombSpawnIntervalId = setTimeout(bombSpawnLoop, delay);
}

// Старт игры
function startGame() {
  startScreen.style.display = 'none';
  gameOverScreen.style.display = 'none';
  
  score = 0;
  lives = MAX_LIVES;
  lines = [];
  arrows = [];
  bombs = [];
  explosions = [];
  scoreEl.textContent = '0';
  gameRunning = true;
  
  // Обновляем отображение жизней в UI
  updateLivesDisplay();
  
  bgMusic.volume = 0.3;
  if (bgMusic.paused) {
    bgMusic.play().catch(e => console.log('Music autoplay blocked'));
  }
  
  spawnLoop();
  bombSpawnLoop();
  gameLoop();
}

// Обновление жизней в UI
function updateLivesDisplay() {
  let livesText = '❤️'.repeat(lives);
  scoreEl.textContent = `${score}  ${livesText}`;
}

// Конец игры
function gameOver() {
  gameRunning = false;
  clearTimeout(spawnIntervalId);
  clearTimeout(bombSpawnIntervalId);
  cancelAnimationFrame(gameLoopId);
  
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('arrowGameBest', bestScore);
    bestScoreEl.textContent = `Рекорд: ${bestScore}`;
  }
  
  finalScoreEl.textContent = score;
  finalBestEl.textContent = bestScore;
  gameOverScreen.style.display = 'flex';
  
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

window.startGame = startGame;
window.restartGame = restartGame;
