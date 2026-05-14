// ============================================
// ИГРА "ЛОВИ СТРЕЛЫ" — ИСПРАВЛЕНАЯ КОЛЛИЗИЯ
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

let score = 0;
let bestScore = parseInt(localStorage.getItem('arrowGameBest') || '0');
let lines = [];
let arrows = [];
let isDrawing = false;
let currentLine = null;
let currentLineLength = 0;
let lastPos = null;
let gameRunning = false;
let gameLoopId = null;
let spawnIntervalId = null;

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
  currentLine = { points: [pos], length: 0 };
  currentLineLength = 0;
  lastPos = pos;
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
}

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

function checkCollision(arrow) {
  for (const line of lines) {
    for (let i = 1; i < line.points.length; i++) {
      const p1 = line.points[i - 1];
      const p2 = line.points[i];
      
      const dist = pointToLineDistance(arrow.x, arrow.y, p1.x, p1.y, p2.x, p2.y);
      
      // УВЕЛИЧЕН РАДИУС С 20 ДО 30
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
  
  // СНАЧАЛА двигаем ЛИНИИ
  for (const line of lines) {
    for (const point of line.points) {
      point.y += 1;
    }
  }
  
  // ПОТОМ двигаем СТРЕЛЫ и проверяем коллизию
  for (const arrow of arrows) {
    if (!arrow.active || arrow.caught) continue;
    
    arrow.y += arrow.speed;
    
    if (checkCollision(arrow)) {
      continue;
    }
    
    if (arrow.y > canvas.height + 50) {
      arrow.active = false;
      arrowMissed = true;
    }
  }
  
  arrows = arrows.filter(a => a.active || a.caught);
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
  
  // УВЕЛИЧЕНА ТОЛЩИНА ЛИНИЙ С 3 ДО 5
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

function startGame() {
  startScreen.style.display = 'none';
  gameOverScreen.style.display = 'none';
  
  score = 0;
  lines = [];
  arrows = [];
  scoreEl.textContent = '0';
  gameRunning = true;
  
  bgMusic.volume = 0.3;
  bgMusic.play().catch(e => console.log('Music autoplay blocked'));
  
  spawnLoop();
  gameLoop();
}

function gameOver() {
  gameRunning = false;
  clearTimeout(spawnIntervalId);
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
