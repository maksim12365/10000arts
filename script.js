// ============================================
// МУЗЫКА НЕДЕЛИ (ПРЯМОЙ MP3 + jsDelivr - РАБОТАЕТ В РФ!)
// ============================================

const MUSIC_CONFIG = {
  track: 'Ava',
  artist: 'Famy',
  // Ссылка через jsDelivr (работает в России!)
  audioFile: 'https://cdn.jsdelivr.net/gh/maksim12365/10000arts@main/music/track.mp3',
  week: 1
};

let audioElement = null;
let isPlaying = false;

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
      <button id="musicPlayBtn" class="music-play-btn" type="button">
        ▶️
      </button>
    </div>
  `;
  
  // Создаём аудио элемент
  audioElement = new Audio();
  audioElement.preload = 'metadata';
  
  const playBtn = document.getElementById('musicPlayBtn');
  playBtn.addEventListener('click', toggleMusic);
  
  // Обработчики
  audioElement.addEventListener('play', () => {
    isPlaying = true;
    playBtn.textContent = '⏸️';
    console.log('▶️ Playing');
  });
  
  audioElement.addEventListener('pause', () => {
    isPlaying = false;
    playBtn.textContent = '▶️';
    console.log('⏸️ Paused');
  });
  
  audioElement.addEventListener('ended', () => {
    isPlaying = false;
    playBtn.textContent = '▶️';
    console.log('⏹️ Ended');
  });
  
  audioElement.addEventListener('error', (e) => {
    console.error('❌ Audio error:', e);
    playBtn.textContent = '❌';
    // Фолбэк: открываем VK
    window.open('https://vk.com/audio686447732_456240900_cd7692d0d8633ae71b', '_blank');
  });
  
  console.log('✅ Music initialized');
  console.log('✅ URL:', MUSIC_CONFIG.audioFile);
}

function toggleMusic() {
  if (!audioElement) return;
  
  // Если файл ещё не загружен - загружаем
  if (!audioElement.src) {
    audioElement.src = MUSIC_CONFIG.audioFile;
  }
  
  if (isPlaying) {
    audioElement.pause();
  } else {
    // На мобильных требуется пользовательское взаимодействие
    const playPromise = audioElement.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error('❌ Play failed:', error);
        // Фолбэк: открываем в приложении
        if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
          window.open('https://vk.com/audio686447732_456240900_cd7692d0d8633ae71b', '_blank');
        } else {
          alert('Не удалось воспроизвести. Попробуйте ещё раз.');
        }
      });
    }
  }
}

// Инициализация
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMusicWidget);
} else {
  initMusicWidget();
}
