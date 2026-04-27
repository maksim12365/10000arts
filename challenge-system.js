// ============================================
// СИСТЕМА ЧЕЛЛЕНДЖЕЙ (УПРОЩЁННАЯ)
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
  { id: 'easy_line', title: '📏 Прямая линия', description: 'Нарисуй прямую линию', difficulty: 'easy', week: 1, checkType: 'honor', timeLimit: null, attempts: 1, reward: { points: 10, achievement: 'first_line' } },
  { id: 'easy_colors', title: '🌈 5 цветов за 20 сек', description: 'Используй 5 разных цветов за 20 секунд', difficulty: 'easy', week: 1, checkType: 'color_count', check: { minColors: 5 }, timeLimit: 20, attempts: 1, reward: { points: 20, achievement: 'color_master' } },
  { id: 'easy_smiley', title: '😊 Нарисуй смайлик', description: 'Нарисуй любой смайлик за 30 секунд', difficulty: 'easy', week: 1, checkType: 'honor', timeLimit: 30, attempts: 1, reward: { points: 30, achievement: 'smiley_artist' } },
  { id: 'normal_shape', title: '🟠 Нарисуй круг', description: 'Нарисуй круг максимально точно', difficulty: 'normal', week: 2, checkType: 'honor', timeLimit: null, attempts: 999, reward: { points: 40, achievement: 'shape_master' } },
  { id: 'normal_rainbow', title: '🌈 Радуга за 15 сек', description: 'Нарисуй радугу в правильном порядке за 15 секунд', difficulty: 'normal', week: 2, checkType: 'honor', timeLimit: 15, attempts: 1, reward: { points: 50, achievement: 'rainbow_creator' } },
  { id: 'normal_random', title: '🎲 Случайный объект', description: 'Нарисуй то, что покажет система за 30 сек', difficulty: 'normal', week: 2, checkType: 'honor', timeLimit: 30, attempts: 1, reward: { points: 40, achievement: 'quick_draw' } },
  { id: 'hard_word', title: '✏️ Нарисуй слово', description: 'Напиши слово за 10 секунд', difficulty: 'hard', week: 3, checkType: 'honor', timeLimit: 10, attempts: 1, reward: { points: 80, achievement: 'word_artist' } },
  { id: 'hard_red_dot', title: '🔴 Красная точка', description: 'Рисуй только когда горит красная точка (5 цветов)', difficulty: 'hard', week: 3, checkType: 'honor', timeLimit: 30, attempts: 1, reward: { points: 70, achievement: 'timing_master' } },
  { id: 'impossible_star', title: '⭐ Звезда за 5 сек', description: 'Нарисуй 5-конечную звезду за 5 секунд', difficulty: 'impossible', week: 4, checkType: 'honor', timeLimit: 5, attempts: 1, reward: { points: 200, achievement: 'legend' } }
];

// 3. ДОСТИЖЕНИЯ
const ACHIEVEMENTS = [
  { id: 'first_line', title: '📏 Первая линия', description: 'Нарисуй первую линию', icon: '📏', rarity: 'common' },
  { id: 'color_master', title: '🌈 Мастер цвета', description: 'Используй 5 цветов', icon: '🌈', rarity: 'common' },
  { id: 'smiley_artist', title: '😊 Художник смайлов', description: 'Нарисуй смайлик', icon: '😊', rarity: 'common' },
  { id: 'shape_master', title: '🟠 Мастер форм', description: 'Нарисуй идеальный круг', icon: '🟠', rarity: 'rare' },
  { id: 'rainbow_creator', title: '🌈 Создатель радуги', description: 'Нарисуй радугу', icon: '🌈', rarity: 'rare' },
  { id: 'word_artist', title: '✏️ Словный художник', description: 'Напиши слово', icon: '✏️', rarity: 'epic' },
  { id: 'legend', title: '⭐ Легенда', description: 'Нарисуй звезду за 5 сек', icon: '⭐', rarity: 'legendary' }
];

// 4. МЕНЕДЖЕР ЧЕЛЛЕНДЖЕЙ
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
      if (data.attemptsUsed >= challenge.attempts) {
        return { success: false, reason: 'Попытки закончились' };
      }
    }
    const challengeData = { 
      started: true, 
      startTime: Date.now(), 
      attemptsUsed: existing ? JSON.parse(existing).attemptsUsed : 0, 
      completed: false 
    };
    localStorage.setItem(key, JSON.stringify(challengeData));
    return { success: true };
  },
  
  async completeChallenge(challengeId, canvas, extraData = {}) {
    const key = `challenge_${userId}_${challengeId}`;
    const existing = localStorage.getItem(key);
    if (!existing) return { success: false, reason: 'Челлендж не начат' };
    
    const data = JSON.parse(existing);
    const challenge = CHALLENGES.find(c => c.id === challengeId);
    
    if (data.attemptsUsed >= challenge.attempts) {
      return { success: false, reason: 'Попытки закончились' };
    }
    
    // Проверяем время
    if (challenge.timeLimit) {
      const elapsed = (Date.now() - data.startTime) / 1000;
      if (elapsed > challenge.timeLimit) {
        data.attemptsUsed++;
        localStorage.setItem(key, JSON.stringify(data));
        return { success: false, reason: `Время вышло! (${Math.round(elapsed)} сек)` };
      }
    }
    
    // Для честной системы (honor) - просто засчитываем
    // TODO: Здесь можно добавить AI проверку позже
    const checkResult = { success: true, reason: 'Челлендж выполнен!' };
    
    data.attemptsUsed++;
    data.completed = true;
    data.completedAt = new Date().toISOString();
    data.checkResult = checkResult;
    
    localStorage.setItem(key, JSON.stringify(data));
    
    // Добавляем очки и достижение
    this.addPoints(challenge.reward.points);
    this.unlockAchievement(challenge.reward.achievement);
    
    return { success: true, reason: '✅ ' + checkResult.reason, completed: true };
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
    CHALLENGES.forEach(c => {
      if (this.isCompleted(c.id)) count++;
    });
    return count;
  }
};

// 5. ЭКСПОРТ
window.ChallengeSystem = ChallengeManager;
window.CHALLENGES = CHALLENGES;
window.ACHIEVEMENTS = ACHIEVEMENTS;

console.log('🎯 Challenge System loaded');
