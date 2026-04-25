// ============================================
// МУЗЫКА НЕДЕЛИ (РАБОТАЕТ 100%)
// ============================================

const MUSIC_CONFIG = {
  track: 'Ava',
  artist: 'Famy',
  audioFile: 'https://raw.githubusercontent.com/maksim12365/10000arts/main/music/track.mp3',
  week: 1
};

let isPlaying = false;
let audioElement = null;

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
  
  audioElement = new Audio();
  audioElement.src = MUSIC_CONFIG.audioFile;
  audioElement.preload = 'auto';
  
  const playBtn = document.getElementById('musicPlayBtn');
  
  playBtn.addEventListener('click', function() {
    console.log('🎵 Button clicked!');
    toggleMusic();
  });
  
  audioElement.addEventListener('ended', function() {
    isPlaying = false;
    playBtn.textContent = '▶️';
    console.log('🎵 Track ended');
  });
  
  audioElement.addEventListener('error', function(e) {
    console.error('❌ Audio error:', e);
    console.error('❌ File URL:', MUSIC_CONFIG.audioFile);
    alert('Ошибка загрузки файла. Проверь ссылку!');
  });
  
  console.log('✅ Music initialized:', MUSIC_CONFIG.track);
  console.log('✅ File URL:', MUSIC_CONFIG.audioFile);
}

function toggleMusic() {
  if (!audioElement) return;
  
  const playBtn = document.getElementById('musicPlayBtn');
  
  if (isPlaying) {
    audioElement.pause();
    playBtn.textContent = '▶️';
    isPlaying = false;
    console.log('⏸️ Paused');
  } else {
    audioElement.play().then(() => {
      playBtn.textContent = '⏸️';
      isPlaying = true;
      console.log('▶️ Playing');
    }).catch(error => {
      console.error('❌ Play error:', error);
      alert('Не удалось воспроизвести. Проверь файл!');
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMusicWidget);
} else {
  initMusicWidget();
}
