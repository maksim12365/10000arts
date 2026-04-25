// ============================================
// МУЗЫКА НЕДЕЛИ (РАБОТАЕТ 100%)
// ============================================

const MUSIC_CONFIG = {
  track: 'Ava',
  artist: 'Famy',
  audioFile: 'music/track.mp3',
  week: 1
};

let isPlaying = false;
let audioElement = null;

function initMusicWidget() {
  const widget = document.getElementById('musicWidget');
  if (!widget) {
    console.error('❌ musicWidget not found!');
    return;
  }
  
  // Создаём HTML
  widget.innerHTML = `
    <div class="music-label">🎵 Трек недели #${MUSIC_CONFIG.week}</div>
    <div class="music-content">
      <div class="music-info">
        <span class="music-track">${MUSIC_CONFIG.track}</span>
        <span class="music-artist">${MUSIC_CONFIG.artist}</span>
      </div>
      <button id="musicPlayBtn" class="music-play-btn" type="button">
        ▶️
      </button>
    </div>
  `;
  
  // Создаём аудио элемент
  audioElement = new Audio(MUSIC_CONFIG.audioFile);
  audioElement.preload = 'auto';
  
  // Находим кнопку
  const playBtn = document.getElementById('musicPlayBtn');
  if (!playBtn) {
    console.error('❌ Play button not found!');
    return;
  }
  
  // Добавляем обработчик КЛИКА
  playBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('🎵 Button clicked!');
    toggleMusic();
  });
  
  // Обработка окончания трека
  audioElement.addEventListener('ended', function() {
    isPlaying = false;
    playBtn.textContent = '▶️';
    console.log('🎵 Track ended');
  });
  
  // Обработка ошибок
  audioElement.addEventListener('error', function(e) {
    console.error('❌ Audio error:', e);
    alert('Ошибка: файл не найден или не поддерживается');
  });
  
  console.log('✅ Music widget initialized:', MUSIC_CONFIG.track);
}

function toggleMusic() {
  if (!audioElement) {
    console.error('❌ Audio element not initialized!');
    return;
  }
  
  const playBtn = document.getElementById('musicPlayBtn');
  
  if (isPlaying) {
    // Остановить
    audioElement.pause();
    playBtn.textContent = '▶️';
    isPlaying = false;
    console.log('🎵 Music paused');
  } else {
    // Играть
    const playPromise = audioElement.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        playBtn.textContent = '⏸️';
        isPlaying = true;
        console.log('🎵 Music playing');
      }).catch(error => {
        console.error('❌ Play failed:', error);
        alert('Не удалось воспроизвести. Проверьте файл.');
      });
    }
  }
}

// Инициализация после загрузки страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMusicWidget);
} else {
  initMusicWidget();
}
