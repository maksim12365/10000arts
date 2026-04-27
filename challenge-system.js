// ============================================
// СИСТЕМА ЧЕЛЛЕНДЖЕЙ (ИСПРАВЛЕНО)
// ============================================

// 1. USER ID
function getUserId() {
  let id = localStorage.getItem('userId');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('userId', id);
  }
  return id;
}

const userId = getUserId();

// 2. СПИСОК ЧЕЛЛЕНДЖЕЙ
const CHALLENGES = [
  { id: 'easy_line', title: '📏 Прямая линия', description: 'Нарисуй прямую линию', difficulty: 'easy', week: 1, checkType: 'line', timeLimit: null, attempts: 1, reward: { points: 10, achievement: 'first_line' } },
  { id: 'easy_colors', title: '🌈 5 цветов за 20 сек', description: 'Используй 5 разных цветов за 20 секунд', difficulty: 'easy', week: 1, checkType: 'color_count', check: { minColors: 5 }, timeLimit: 20, attempts: 1, reward: { points: 20, achievement: 'color_master' } },
  { id: 'easy_smiley', title: '😊 Нарисуй смайлик', description: 'Нарисуй любой смайлик за 30 секунд', difficulty: 'easy', week: 1, checkType: 'honor', timeLimit: 30, attempts: 1, reward: { points: 30, achievement: 'smiley_artist' } },
  { id: 'normal_shape', title: '🟠 Нарисуй круг', description: 'Нарисуй круг максимально точно', difficulty: 'normal', week: 2, checkType: 'circle', timeLimit: null, attempts: 999, reward: { points: 40, achievement: 'shape_master' } },
  { id: 'normal_rainbow', title: '🌈 Радуга за 15 сек', description: 'Нарисуй радугу в правильном порядке за 15 секунд', difficulty: 'normal', week: 2, checkType: 'honor', timeLimit: 15, attempts: 1, reward: { points: 50, achievement: 'rainbow_creator' } },
  { id: 'normal_random', title: '🎲 Случайный объект', description: 'Нарисуй то, что покажет система за 30 сек', difficulty: 'normal', week: 2, checkType: 'honor', timeLimit: 30, attempts: 1, reward: { points: 40, achievement: 'quick_draw' } },
  { id: 'hard_word', title: '✏️ Нарисуй слово', description: 'Напиши слово за 10 секунд', difficulty: 'hard', week: 3, checkType: 'honor', timeLimit: 10, attempts: 1, reward: { points: 80, achievement: 'word_artist' } },
  { id: 'hard_red_dot', title: '🔴 Красная точка', description: 'Рисуй только когда горит красная точка (5 цветов)', difficulty: 'hard', week: 3, checkType: 'color_count', check: { minColors: 5 }, timeLimit: 30, attempts: 1, reward: { points: 70, achievement: 'timing_master' } },
  { id: 'impossible_star', title: '⭐ Звезда за 5 сек', description: 'Нарисуй 5-конечную звезду за 5 секунд', difficulty: 'impossible', week: 4, checkType: 'star', timeLimit: 5, attempts: 1, reward: { points: 200, achievement: 'legend' } }
];

// 3. ДОСТИЖЕНИЯ
const ACHIEVEMENTS = [
  { id: 'first_line', title: '📏 Первая линия', description: 'Нарисуй первую линию', icon: '📏', rarity: 'common' },
  { id: 'color_master', title: '🌈 Мастер цвета', description: 'Используй 5 цветов', icon: '🌈', rarity: 'common' },
  { id: 'smiley_artist', title: '😊 Художник смайлов', description: 'Нарисуй смайлик', icon: '😊', rarity: 'common' },
  { id: 'shape_master', title: '🟠 Мастер форм', description: 'Нарисуй идеальный круг', icon: '🟠', rarity: 'rare' },
  { id: 'rainbow_creator', title: '🌈 Создатель радуги', description: 'Нарисуй радугу', icon: '🌈', rarity: 'rare' },
  { id: 'quick_draw', title: '🎲 Быстрый рисунок', description: 'Нарисуй случайный объект', icon: '🎲', rarity: 'rare' },
  { id: 'word_artist', title: '✏️ Словный художник', description: 'Напиши слово за 10 сек', icon: '✏️', rarity: 'epic' },
  { id: 'timing_master', title: '🔴 Мастер тайминга', description: 'Рисуй когда горит красная точка', icon: '🔴', rarity: 'epic' },
  { id: 'legend', title: '⭐ Легенда', description: 'Нарисуй звезду за 5 сек', icon: '⭐', rarity: 'legendary' }
];

// 4. ПРОВЕРКИ
const Checker = {
  checkLine(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const points = [];
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        if (pixels[i + 3] > 128) points.push({ x, y });
      }
    }
    
    if (points.length < 20) return { success: false, reason: 'Нарисуй что-нибудь!' };
    
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    
    const length = Math.sqrt((maxX - minX) ** 2 + (maxY - minY) ** 2);
    if (length < 30) return { success: false, reason: 'Слишком коротко!' };
    
    return { success: true, reason: '✅ Отличная линия!' };
  },
  
  checkColorCount(canvas, minColors) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const uniqueColors = new Set();
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      
      if (a < 128) continue;
      if (r > 240 && g > 240 && b > 240) continue;
      
      const rRound = Math.floor(r / 64) * 64;
      const gRound = Math.floor(g / 64) * 64;
      const bRound = Math.floor(b / 64) * 64;
      
      uniqueColors.add(`${rRound},${gRound},${bRound}`);
    }
    
    const count = uniqueColors.size;
    return {
      success: count >= minColors,
      reason: count >= minColors ? `✅ ${count} разных цветов!` : `❌ Нужно ${minColors} разных цветов, использовано ${count}`
    };
  },
  
  checkCircle(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const points = [];
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        if (pixels[i + 3] > 128) points.push({ x, y });
      }
    }
    
    if (points.length < 100) return { success: false, reason: 'Слишком мало пикселей' };
    
    const centerX = points.reduce((s, p) => s + p.x, 0) / points.length;
    const centerY = points.reduce((s, p) => s + p.y, 0) / points.length;
    const distances = points.map(p => Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2));
    const avgDistance = distances.reduce((s, d) => s + d, 0) / distances.length;
    const variance = distances.reduce((s, d) => s + (d - avgDistance) ** 2, 0) / distances.length;
    const stdDev = Math.sqrt(variance);
    const circularity = 1 - (stdDev / avgDistance);
    
    return {
      success: circularity > 0.65,
      reason: circularity > 0.65 ? `✅ Круг! (точность: ${Math.round(circularity * 100)}%)` : '❌ Не похоже на круг'
    };
  },
  
  checkStar(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const edgePoints = [];
    
    for (let y = 1; y < canvas.height - 1; y++) {
      for (let x = 1; x < canvas.width - 1; x++) {
        const i = (y * canvas.width + x) * 4;
        if (pixels[i + 3] > 128) {
          const neighbors = [
            pixels[((y-1) * canvas.width + x) * 4 + 3],
            pixels[((y+1) * canvas.width + x) * 4 + 3],
            pixels[(y * canvas.width + (x-1)) * 4 + 3],
            pixels[(y * canvas.width + (x+1)) * 4 + 3]
          ];
          if (neighbors.some(n => n < 128)) edgePoints.push({ x, y });
        }
      }
    }
    
    if (edgePoints.length < 50) return { success: false, reason: 'Слишком мало пикселей' };
    
    const centerX = edgePoints.reduce((s, p) => s + p.x, 0) / edgePoints.length;
    const centerY = edgePoints.reduce((s, p) => s + p.y, 0) / edgePoints.length;
    
    const angles = {};
    for (const p of edgePoints) {
      const angle = Math.round(Math.atan2(p.y - centerY, p.x - centerX) * 180 / Math.PI / 30) * 30;
      const dist = Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2);
      if (!angles[angle] || angles[angle].dist < dist) angles[angle] = { ...p, dist };
    }
    
    const allDists = Object.values(angles).map(p => p.dist);
    const avgDist = allDists.reduce((s, d) => s + d, 0) / allDists.length;
    
    let pointsCount = 0;
    for (const p of Object.values(angles)) {
      if (p.dist > avgDist * 1.3) pointsCount++;
    }
    
    return {
      success: pointsCount >= 5,
      reason: pointsCount >= 5 ? `✅ Звезда с ${pointsCount} лучами!` : `❌ Найдено ${pointsCount} лучей, нужно 5`
    };
  },
  
  checkChallenge(challengeId, canvas) {
    const challenge = CHALLENGES.find(c => c.id === challengeId);
    if (!challenge) return { success: false, reason: 'Челлендж не найден' };
    
    switch (challenge.checkType) {
      case 'line': return this.checkLine(canvas);
      case 'color_count': return this.checkColorCount(canvas, challenge.check.minColors);
      case 'circle': return this.checkCircle(canvas);
      case 'star': return this.checkStar(canvas);
      case 'smiley': return { success: true, reason: '✅ Честная система - верим тебе!' };
      case 'rainbow': return { success: true, reason: '✅ Честная система - верим тебе!' };
      case 'word': return { success: true, reason: '✅ Честная система - верим тебе!' };
      case 'honor': return { success: true, reason: '✅ Честная система' };
      default: return { success: true, reason: 'OK' };
    }
  }
};

// 5. МЕНЕДЖЕР
const ChallengeManager = {
  getAvailableChallenges() {
    const firstVisit = localStorage.getItem(`firstVisit_${userId}`);
    if (!firstVisit) {
      localStorage.setItem(`firstVisit_${userId}`, Date.now());
    }
    
    const daysSinceFirst = (Date.now() - firstVisit) / (1000 * 60 * 60 * 24);
    const weeksPassed = Math.floor(daysSinceFirst / 7);
    
    return {
      available: CHALLENGES.filter(c => c.week <= weeksPassed + 1),
      locked: CHALLENGES.filter(c => c.week > weeksPassed + 1),
      weeksPassed: weeksPassed
    };
  },
  
  isCompleted(challengeId) {
    const key = `challenge_${userId}_${challengeId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data).completed : false;
  },
  
  startChallenge(challengeId) {
    const key = `challenge_${userId}_${challengeId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '{}');
    const challenge = CHALLENGES.find(c => c.id === challengeId);
    
    if (existing.attemptsUsed >= challenge.attempts) {
      return { success: false, reason: 'Попытки закончились' };
    }
    
    if (!existing.started) {
      localStorage.setItem(key, JSON.stringify({ 
        started: true, 
        startTime: Date.now(), 
        attemptsUsed: 0, 
        completed: false 
      }));
    }
    
    return { success: true };
  },
  
  async completeChallenge(challengeId, canvas) {
    const key = `challenge_${userId}_${challengeId}`;
    const existing = localStorage.getItem(key);
    
    if (!existing) return { success: false, reason: 'Челлендж не начат' };
    
    const data = JSON.parse(existing);
    const challenge = CHALLENGES.find(c => c.id === challengeId);
    
    if (data.attemptsUsed >= challenge.attempts) {
      return { success: false, reason: '❌ Попытки закончились!' };
    }
    
    if (challenge.timeLimit) {
      const elapsed = (Date.now() - data.startTime) / 1000;
      if (elapsed > challenge.timeLimit) {
        data.attemptsUsed++;
        localStorage.setItem(key, JSON.stringify(data));
        return { 
          success: false, 
          reason: `⏰ Время вышло! (${Math.round(elapsed)} сек при лимите ${challenge.timeLimit})`,
          attemptsLeft: challenge.attempts - data.attemptsUsed
        };
      }
    }
    
    const checkResult = Checker.checkChallenge(challengeId, canvas);
    
    data.attemptsUsed++;
    
    if (checkResult.success) {
      data.completed = true;
      data.completedAt = new Date().toISOString();
      data.checkResult = checkResult;
      localStorage.setItem(key, JSON.stringify(data));
      
      this.addPoints(challenge.reward.points);
      this.unlockAchievement(challenge.reward.achievement);
      
      return { success: true, reason: checkResult.reason, completed: true };
    } else {
      localStorage.setItem(key, JSON.stringify(data));
      return { 
        success: false, 
        reason: checkResult.reason,
        attemptsLeft: challenge.attempts - data.attemptsUsed
      };
    }
  },
  
  addPoints(points) {
    const statsKey = `stats_${userId}`;
    const stats = JSON.parse(localStorage.getItem(statsKey) || '{"points": 0}');
    stats.points = (stats.points || 0) + points;
    localStorage.setItem(statsKey, JSON.stringify(stats));
  },
  
  unlockAchievement(achievementId) {
    const key = `achievements_${userId}`;
    const achievements = JSON.parse(localStorage.getItem(key) || '[]');
    if (!achievements.find(a => a.id === achievementId)) {
      achievements.push({ id: achievementId, unlockedAt: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(achievements));
      this.showAchievementPopup(achievementId);
    }
  },
  
  showAchievementPopup(achievementId) {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return;
    
    const popup = document.createElement('div');
    popup.className = 'achievement-popup';
    popup.innerHTML = `
      <div class="achievement-popup-content">
        <span class="icon">${achievement.icon}</span>
        <h3>${achievement.title}</h3>
        <p>${achievement.description}</p>
      </div>
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add('show'), 100);
    setTimeout(() => { 
      popup.classList.remove('show'); 
      setTimeout(() => popup.remove(), 500); 
    }, 3000);
  },
  
  getStats() {
    const statsKey = `stats_${userId}`;
    return JSON.parse(localStorage.getItem(statsKey) || '{"points": 0}');
  },
  
  getCompletedCount() {
    let count = 0;
    CHALLENGES.forEach(c => { if (this.isCompleted(c.id)) count++; });
    return count;
  }
};

// 6. ЭКСПОРТ
window.ChallengeSystem = ChallengeManager;
window.CHALLENGES = CHALLENGES;
window.ACHIEVEMENTS = ACHIEVEMENTS;
window.Checker = Checker;

console.log('🎯 Challenge System loaded - FIXED COLOR CHECK');
