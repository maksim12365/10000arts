// ============================================
// ИГРА "ЛОВИ СТРЕЛЫ" С БОМБАМИ (ИСПРАВЛЕНО)
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

const MAX_LINE_LENGTH = 100;
const MAX_ARROWS_ON_SCREEN = 4;
const BASE_SPEED = 1.5;
const FAST_SPEED = 3;
const SUPER_FAST_SPEED = 5;
const MAX_LIVES = 3;

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

// ⚠️ НОВОЕ: отслеживаем была ли коллизия в этом кадре рисования
let bombHitThisFrame = false;

canvas.width = 300;
canvas.height = 400;

bestScoreEl.textContent = `Рекорд: ${bestScore}`;

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function startDrawing(e) {
  if (!gameRunning) return;
  e.preventDefault();
  
  const pos = getPos(e);
  isDrawing = true;
  currentLine = { points: [pos], length: 0, createdAt: Date.now() };
  currentLineLength = 0;
  lastPos = pos;
  bombHitThisFrame = false;
  lineLimitEl.classList.remove('visible');
}

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
  
  // ⚠️ ПРОВЕРЯЕМ коллизию с бомбами ТОЛЬКО во время рисования
  checkBombCollisionDuringDraw();
}

function stopDrawing(e) {
  if (!isDrawing) return;
  if (e) e.preventDefault();
  
  if (currentLine && currentLine.points.length > 1) {
    lines.push({
      points: [...currentLine.points],
      length: currentLineLength,
      createdAt: Date.now()
    });
  }
  
  isDrawing = false;
  currentLine = null;
  currentLineLength = 0;
}

// ⚠️ НОВАЯ ФУНКЦИЯ: проверка коллизии ТОЛЬКО когда игрок рисует
function checkBombCollisionDuringDraw() {
  if (!isDrawing || !currentLine) return;
  
  for (const bomb of bombs) {
    if (!bomb.active || bomb.hitThisLine) continue;
    
    // Проверяем расстояние от бомбы до ТЕКУЩЕЙ рисующейся линии
    for (let i = 1; i < currentLine.points.length; i++) {
      const p1 = currentLine.points[i - 1];
      const p2 = currentLine.points[i];
      
      const dist = pointToLineDistance(bomb.x, bomb.y, p1.x, p1.y, p2.x, p2.y);
      
      if (dist < 25) {
        // ⚠️ Бомба коснулась линии которую ты РИСУЕШЬ ПРЯМО СЕЙЧАС
        bomb.hitCount++;
        bomb.hitThisLine = true; // Чтобы не засчитывало повторно
        
        lives--;
        updateLivesDisplay();
        createExplosion(bomb.x, bomb.y, bomb.hitCount);
        
        // ⚠️ Только 3 попадания = смерть
        if (lives <= 0) {
          gameOver();
          return;
        }
        
        break;
      }
    }
  }
}

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

function spawnOneBomb() {
  if (!gameRunning) return;
  
  const activeBombs = bombs.filter(b => b.active).length;
  
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
    return;
  }
  
  bombs.push({
    x: x,
    y: -30,
    speed: speed,
    radius: 15,
    active: true,
    hitCount: 0,
    hitThisLine: false // ⚠️ Сбрасываем при спавне
  });
}

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

function update() {
  if (!gameRunning) return;
  
  let arrowMissed = false;
  
  // Сбрасываем флаг попадания для каждой бомбы
  for (const bomb of bombs) {
    bomb.hitThisLine = false;
  }
  
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
  
  // Двигаем бомбы (без коллизии - только во время рисования!)
  for (const bomb of bombs) {
    if (!bomb.active) continue;
    
    bomb.y += bomb.speed;
    
    if (bomb.y > canvas.height + 50) {
      bomb.active = false;
    }
  }
  
  updateExplosions();
  
  arrows = arrows.filter(a => a.active || a.caught);
  bombs = bombs.filter(b => b.active);
  lines = lines.filter(l => l.points.some(p => p.y < canvas.height + 100));
  
  if (arrowMissed) {
    gameOver();
    return;
  }
}

function drawGame() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
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
  
  if (currentLine && currentLine.points.length > 1) {
    ctx.beginPath();
    ctx.moveTo(currentLine.points[0].x, currentLine.points[0].y);
    for (let i = 1; i < currentLine.points.length; i++) {
      ctx.lineTo(currentLine.points[i].x, currentLine.points[i].y);
    }
    ctx.stroke();
  }
  
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
  
  for (const bomb of bombs) {
    if (!bomb.active) continue;
    
    ctx.save();
    ctx.translate(bomb.x, bomb.y);
    
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.arc(0, 0, bomb.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#6b7280';
    ctx.beginPath();
    ctx.arc(-5, -5, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Индикатор попаданий
    for (let i = 0; i < bomb.hitCount; i++) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-8 + (i * 8), 8, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  drawExplosions();
  
  if (isDrawing) {
    const ratio = currentLineLength / MAX_LINE_LENGTH;
    ctx.fillStyle = ratio > 0.8 ? '#dc2626' : '#10b981';
    ctx.fillRect(10, 10, 100 * ratio, 5);
    ctx.strokeStyle = '#333';
    ctx.strokeRect(10, 10, 100, 5);
  }
}

function gameLoop() {
  if (!gameRunning) return;
  update();
  drawGame();
  gameLoopId = requestAnimationFrame(gameLoop);
}

function spawnLoop() {
  if (!gameRunning) return;
  
  spawnOneArrow();
  
  const delay = Math.random() * 700 + 800;
  spawnIntervalId = setTimeout(spawnLoop, delay);
}

function bombSpawnLoop() {
  if (!gameRunning) return;
  
  spawnOneBomb();
  
  const delay = Math.random() * 2000 + 2500;
  bombSpawnIntervalId = setTimeout(bombSpawnLoop, delay);
}

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
  
  updateLivesDisplay();
  
  bgMusic.volume = 0.3;
  if (bgMusic.paused) {
    bgMusic.play().catch(e => console.log('Music autoplay blocked'));
  }
  
  spawnLoop();
  bombSpawnLoop();
  gameLoop();
}

function updateLivesDisplay() {
  let livesText = '❤️'.repeat(lives);
  scoreEl.textContent = `${score}  ${livesText}`;
}

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

function restartGame() {
  gameOverScreen.style.display = 'none';
  startGame();
}

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

canvas.addEventListener('touchstart', startDrawing, { passive: false });
canvas.addEventListener('touchmove', draw, { passive: false });
canvas.addEventListener('touchend', stopDrawing, { passive: false });

window.startGame = startGame;
window.restartGame = restartGame;
