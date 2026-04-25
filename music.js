// ============================================
// МУЗЫКА НЕДЕЛИ (АУДИО ПЛЕЕР) - ИСПРАВЛЕНО
// ============================================

const MUSIC_CONFIG = {
  track: 'Ava',
  artist: 'Famy',
  audioFile: 'music/track.mp3',
  week: 1
};

function initMusicWidget() {
  const widget = document.getElementById('musicWidget');
  if (!widget) return;
  
  widget.innerHTML = `
    <div class="music-label">🎵 Трек недели #${MUSIC_CONFIG.week}</div>
    <div class="music-content">
      <div class="music-info">
        <span class="music-track">${MUSIC_CONFIG.track}</span>
        <span class="music-artist">${MUSIC_CONFIG.artist}</span>
      </div>
      <button class="music-play-btn" id="musicPlayBtn">
        ▶️
      </button>
    </div>
    <audio id="musicAudio" preload="auto">
      <source src="${MUSIC_CONFIG.audioFile}" type="audio/mpeg">
      Ваш браузер не поддерживает аудио.
    </audio>
  `;
  
  // Добавляем обработчик на кнопку
  const btn = document.getElementById('musicPlayBtn');
  const audio = document.getElementById('musicAudio');
  
  btn.addEventListener('click', toggleMusic);
  
  // Когда трек закончится
  audio.addEventListener('ended', () => {
    isPlaying = false;
    btn.textContent = '▶️';
    console.log('🎵 Music: Ended');
  });
  
  // Обработка ошибок
  audio.addEventListener('error', (e) => {
    console.error('❌ Audio error:', e);
    alert('Ошибка загрузки аудио. Проверьте файл.');
  });
  
  console.log('🎵 Music widget loaded:', MUSIC_CONFIG.track);
}

let isPlaying = false;

function toggleMusic() {
  const btn = document.getElementById('musicPlayBtn');
  const audio = document.getElementById('musicAudio');
  
  if (!audio || !btn) {
    console.error('Audio или кнопка не найдены');
    return;
  }
  
  if (isPlaying) {
    // Остановить
    audio.pause();
    btn.textContent = '▶️';
    isPlaying = false;
    console.log('🎵 Music: Stopped');
  } else {
    // Запустить с обработкой ошибок
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        btn.textContent = '⏸️';
        isPlaying = true;
        console.log('🎵 Music: Playing');
      }).catch(error => {
        console.error('❌ Error playing audio:', error);
        alert('Не удалось воспроизвести аудио. Попробуйте позже.');
      });
    }
  }
}

// Запуск после загрузки страницы
document.addEventListener('DOMContentLoaded', initMusicWidget);
