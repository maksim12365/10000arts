// ============================================
// СИСТЕМА ЧЕЛЛЕНДЖЕЙ С AI ПРОВЕРКОЙ
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

// 2. AI МОДЕЛИ
let aiModel = null;
let aiModelLoaded = false;

async function loadAIModel() {
  if (aiModelLoaded) return true;
  try {
    aiModel = await mobilenet.load();
    aiModelLoaded = true;
    console.log('✅ AI загружена');
    return true;
  } catch (e) {
    console.error('❌ AI ошибка:', e);
    return false;
  }
}

// 3. ПРОВЕРКИ
class ChallengeChecker {
  static async checkLine(canvas) {
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
    
    if (points.length < 50) return { success: false, reason: 'Мало пикселей' };
    
    const sumX = points.reduce((s, p) => s + p.x, 0);
    const sumY = points.reduce((s, p) => s + p.y, 0);
    const avgX = sumX / points.length;
    const avgY = sumY / points.length;
    
    let num = 0, den = 0;
    for (const p of points) {
      num += (p.x - avgX) * (p.y - avgY);
      den += (p.x - avgX) ** 2;
    }
    
    const slope = den === 0 ? 0 : num / den;
    const intercept = avgY - slope * avgX;
    
    let totalDeviation = 0;
    for (const p of points) {
      const expectedY = slope * p.x + intercept;
      totalDeviation += Math.abs(p.y - expectedY);
    }
    
    const avgDeviation = totalDeviation / points.length;
    
    return {
      success: avgDeviation < 15,
      accuracy: Math.max(0, 100 - avgDeviation),
      reason: avgDeviation < 15 ? '✅ Линия!' : '❌ Не линия'
    };
  }
  
  static async checkColorCount(canvas, minColors) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const uniqueColors = new Set();
    
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] > 128) {
        const r = Math.round(pixels[i] / 50) * 50;
        const g = Math.round(pixels[i + 1] / 50) * 50;
        const b = Math.round(pixels[i + 2] / 50) * 50;
        uniqueColors.add(`${r},${g},${b}`);
      }
    }
    
    return {
      success: uniqueColors.size >= minColors,
      count: uniqueColors.size,
      reason: uniqueColors.size >= minColors ? `✅ ${uniqueColors.size} цветов!` : `❌ Нужно ${minColors}, есть ${uniqueColors.size}`
    };
  }
  
  static async checkRainbow(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    const rainbowColors = [
      { name: 'red', r: 255, g: 0, b: 0 },
      { name: 'orange', r: 255, g: 127, b: 0 },
      { name: 'yellow', r: 255, g: 255, b: 0 },
      { name: 'green', r: 0, g: 255, b: 0 },
      { name: 'blue', r: 0, g: 0, b: 255 },
      { name: 'indigo', r: 75, g: 0, b: 130 },
      { name: 'violet', r: 148, g: 0, b: 211 }
    ];
    
    const colorPositions = {};
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        if (pixels[i + 3] > 128) {
          const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
          let closest = null, minDist = Infinity;
          
          for (const color of rainbowColors) {
            const dist = Math.sqrt((r - color.r) ** 2 + (g - color.g) ** 2 + (b - color.b) ** 2);
            if (dist < minDist) { minDist = dist; closest = color.name; }
          }
          
          if (minDist < 100 && !colorPositions[closest]) {
            colorPositions[closest] = y;
          }
        }
      }
    }
    
    const colorsFound = Object.keys(colorPositions);
    const expectedOrder = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
    
    let inOrder = true, lastPos = -1;
    for (const color of expectedOrder) {
      if (colorPositions[color] !== undefined) {
        if (colorPositions[color] < lastPos) { inOrder = false; break; }
        lastPos = colorPositions[color];
      }
    }
    
    return {
      success: colorsFound.length >= 5 && inOrder,
      colorsFound: colorsFound.length,
      reason: colorsFound.length >= 5 && inOrder ? '✅ Радуга!' : '❌ Не радуга'
    };
  }
  
  static async checkCircle(canvas) {
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
    
    if (points.length < 100) return { success: false, reason: 'Мало пикселей' };
    
    const centerX = points.reduce((s, p) => s + p.x, 0) / points.length;
    const centerY = points.reduce((s, p) => s + p.y, 0) / points.length;
    const distances = points.map(p => Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2));
    const avgDistance = distances.reduce((s, d) => s + d, 0) / distances.length;
    const variance = distances.reduce((s, d) => s + (d - avgDistance) ** 2, 0) / distances.length;
    const stdDev = Math.sqrt(variance);
    const circularity = 1 - (stdDev / avgDistance);
    
    return {
      success: circularity > 0.7,
      accuracy: Math.round(circularity * 100),
      reason: circularity > 0.7 ? `✅ Круг! ${Math.round(circularity * 100)}%` : '❌ Не круг'
    };
  }
  
  static async checkStar(canvas) {
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
    
    if (edgePoints.length < 50) return { success: false, reason: 'Мало пикселей' };
    
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
      points: pointsCount,
      reason: pointsCount >= 5 ? `✅ Звезда с ${pointsCount} лучами!` : `❌ Найдено ${pointsCount} лучей, нужно 5`
    };
  }
  
  static async checkSmiley(canvas) {
    if (!aiModelLoaded) await loadAIModel();
    if (!aiModel) return { success: true, reason: 'AI недоступен, +честная система', fallback: true };
    
    try {
      const predictions = await aiModel.classify(canvas);
      const faceRelated = predictions.some(p => 
        p.className.includes('face') || p.className.includes('person') || p.className.includes('smile')
      );
      return {
        success: faceRelated || predictions[0].probability > 0.3,
        predictions: predictions.slice(0, 3),
        reason: faceRelated ? '✅ Смайлик!' : '❌ Не смайлик'
      };
    } catch (e) {
      return { success: true, reason: 'AI ошибка, +честная система', fallback: true };
    }
  }
  
  static async checkWord(canvas, expectedWord) {
    try {
      const {  { text } } = await Tesseract.recognize(canvas, 'rus');
      const cleanedText = text.toLowerCase().trim();
      const expectedCleaned = expectedWord.toLowerCase().trim();
      const contains = cleanedText.includes(expectedCleaned);
      return {
        success: contains,
        recognized: cleanedText,
        expected: expectedCleaned,
        reason: contains ? `✅ "${cleanedText}"` : `❌ "${cleanedText}" vs "${expectedCleaned}"`
      };
    } catch (e) {
      return { success: true, reason: 'OCR недоступен, +честная система', fallback: true };
    }
  }
  
  static async checkChallenge(challengeId, canvas, extraData = {}) {
    const challenge = CHALLENGES.find(c => c.id === challengeId);
    if (!challenge) return { success: false, reason: 'Челлендж не найден' };
    
    switch (challenge.checkType) {
      case 'line': return await this.checkLine(canvas);
      case 'color_count': return await this.checkColorCount(canvas, challenge.check.minColors);
      case 'rainbow': return await this.checkRainbow(canvas);
      case 'circle': return await this.checkCircle(canvas);
      case 'star': return await this.checkStar(canvas);
      case 'smiley': return await this.checkSmiley(canvas);
      case 'word': return await this.checkWord(canvas, extraData.expectedWord);
      case 'honor': return { success: true, reason: 'Честная система' };
      default: return { success: true, reason: 'OK' };
    }
  }
}

// 4. СПИСОК ЧЕЛЛЕНДЖЕЙ
const CHALLENGES = [
  { id: 'easy_line', title: '📏 Прямая линия', description: 'Нарисуй прямую линию', difficulty: 'easy', week: 1, checkType: 'line', timeLimit: null, attempts: 1, reward: { points: 10, achievement: 'first_line' } },
  { id: 'easy_colors', title: '🌈 5 цветов за 20 сек', description: 'Используй 5 разных цветов за 20 секунд', difficulty: 'easy', week: 1, checkType: 'color_count', check: { minColors: 5 }, timeLimit: 20, attempts: 1, reward: { points: 20, achievement: 'color_master' } },
  { id: 'easy_smiley', title: '😊 Нарисуй смайлик', description: 'Нарисуй любой смайлик за 30 секунд', difficulty: 'easy', week: 1, checkType: 'smiley', timeLimit: 30, attempts: 1, reward: { points: 30, achievement: 'smiley_artist' } },
  { id: 'normal_shape', title: '🟠 Нарисуй круг', description: 'Нарисуй круг максимально точно', difficulty: 'normal', week: 2, checkType: 'circle', timeLimit: null, attempts: 999, reward: { points: 40, achievement: 'shape_master' } },
  { id: 'normal_rainbow', title: '🌈 Радуга за 15 сек', description: 'Нарисуй радугу в правильном порядке за 15 секунд', difficulty: 'normal', week: 2, checkType: 'rainbow', timeLimit: 15, attempts: 1, reward: { points: 50, achievement: 'rainbow_creator' } },
  { id: 'normal_random', title: '🎲 Случайный объект', description: 'Нарисуй то, что покажет система за 30 сек', difficulty: 'normal', week: 2, checkType: 'honor', timeLimit: 30, attempts: 1, reward: { points: 40, achievement: 'quick_draw' } },
  { id: 'hard_word', title: '✏️ Нарисуй слово', description: 'Напиши слово за 10 секунд', difficulty: 'hard', week: 3, checkType: 'word', timeLimit: 10, attempts: 1, reward: { points: 80, achievement: 'word_artist' } },
  { id: 'hard_red_dot', title: '🔴 Красная точка', description: 'Рисуй только когда горит красная точка (5 цветов)', difficulty: 'hard', week: 3, checkType: 'color_count', check: { minColors: 5 }, timeLimit: 30, attempts: 1, reward: { points: 70, achievement: 'timing_master' } },
  { id: 'impossible_star', title: '⭐ Звезда за 5 сек', description: 'Нарисуй 5-конечную звезду за 5 секунд', difficulty: 'impossible', week: 4, checkType: 'star', timeLimit: 5, attempts: 1, reward: { points: 200, achievement: 'legend' } }
];

// 5. ДОСТИЖЕНИЯ
const ACHIEVEMENTS = [
  { id: 'first_line', title: '📏 Первая линия', description: 'Нарисуй первую линию', icon: '📏', rarity: 'common' },
  { id: 'color_master', title: '🌈 Мастер цвета', description: 'Используй 5 цветов', icon: '🌈', rarity: 'common' },
  { id: 'smiley_artist', title: '😊 Художник смайлов', description: 'Нарисуй смайлик', icon: '😊', rarity: 'common' },
  { id: 'shape_master', title: '🟠 Мастер форм', description: 'Нарисуй идеальный круг', icon: '🟠', rarity: 'rare' },
  { id: 'rainbow_creator', title: '🌈 Создатель радуги', description: 'Нарисуй радугу', icon: '🌈', rarity: 'rare' },
  { id: 'word_artist', title: '✏️ Словный художник', description: 'Напиши слово', icon: '✏️', rarity: 'epic' },
  { id: 'legend', title: '⭐ Легенда', description: 'Нарисуй звезду за 5 сек', icon: '⭐', rarity: 'legendary' }
];

// 6. МЕНЕДЖЕР
const ChallengeManager = {
  getAvailableChallenges() {
    const firstVisit = localStorage.getItem(`firstVisit_${userId}`);
    if (!firstVisit) {
      localStorage.setItem(`firstVisit_${userId}`, Date.now());
      return CHALLENGES.filter(c => c.week === 1);
    }
    const daysSinceFirst = (Date.now() - firstVisit) / (1000 * 60 * 60 * 24);
    const weeksPassed = Math.floor(daysSinceFirst / 7);
    return CHALLENGES.filter(c => c.week <= weeksPassed + 1);
  },
  
  isCompleted(challengeId) {
    const key = `challenge_${userId}_${challengeId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data).completed : false;
  },
  
  startChallenge(challengeId) {
    const key = `challenge_${userId}_${challengeId}`;
    const existing = localStorage.getItem(key);
    if (existing) {
      const data = JSON.parse(existing);
      const challenge = CHALLENGES.find(c => c.id === challengeId);
      if (data.attemptsUsed >= challenge.attempts) return { success: false, reason: 'Попытки закончились' };
    }
    const challengeData = { started: true, startTime: Date.now(), attemptsUsed: existing ? JSON.parse(existing).attemptsUsed : 0, completed: false };
    localStorage.setItem(key, JSON.stringify(challengeData));
    return { success: true };
  },
  
  async completeChallenge(challengeId, canvas, extraData = {}) {
    const key = `challenge_${userId}_${challengeId}`;
    const existing = localStorage.getItem(key);
    if (!existing) return { success: false, reason: 'Челлендж не начат' };
    
    const data = JSON.parse(existing);
    const challenge = CHALLENGES.find(c => c.id === challengeId);
    if (data.attemptsUsed >= challenge.attempts) return { success: false, reason: 'Попытки закончились' };
    
    if (challenge.timeLimit) {
      const elapsed = (Date.now() - data.startTime) / 1000;
      if (elapsed > challenge.timeLimit) {
        data.attemptsUsed++;
        localStorage.setItem(key, JSON.stringify(data));
        return { success: false, reason: `Время вышло! (${Math.round(elapsed)} сек)` };
      }
    }
    
    const checkResult = await ChallengeChecker.checkChallenge(challengeId, canvas, extraData);
    data.attemptsUsed++;
    
    if (checkResult.success) {
      data.completed = true;
      data.completedAt = new Date().toISOString();
      data.checkResult = checkResult;
      this.addPoints(challenge.reward.points);
      this.unlockAchievement(challenge.reward.achievement);
    }
    
    localStorage.setItem(key, JSON.stringify(data));
    return { success: checkResult.success, reason: checkResult.reason, completed: data.completed };
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
    popup.innerHTML = `<div class="achievement-popup-content"><span class="icon">${achievement.icon}</span><h3>${achievement.title}</h3><p>${achievement.description}</p></div>`;
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add('show'), 100);
    setTimeout(() => { popup.classList.remove('show'); setTimeout(() => popup.remove(), 500); }, 3000);
  },
  
  getStats() {
    const statsKey = `stats_${userId}`;
    return JSON.parse(localStorage.getItem(statsKey) || '{"points": 0, "completed": 0}');
  },
  
  getCompletedCount() {
    let count = 0;
    CHALLENGES.forEach(c => { if (this.isCompleted(c.id)) count++; });
    return count;
  }
};

// 7. ЭКСПОРТ
window.ChallengeSystem = ChallengeManager;
window.ChallengeChecker = ChallengeChecker;
window.CHALLENGES = CHALLENGES;
window.ACHIEVEMENTS = ACHIEVEMENTS;

loadAIModel();
console.log('🎯 Challenge System loaded');
