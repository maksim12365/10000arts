// ============================================
// МУЗЫКА НЕДЕЛИ (С jsDelivr - РАБОТАЕТ!)
// ============================================

const MUSIC_CONFIG = {
  track: 'Ava',
  artist: 'Famy',
  audioFile: 'https://vk.com/away.php?to=https%3A%2F%2Fmy.mail.ru%2Fmusic%2Fsongs%2Fb2932239d01dce822ec3dd53362828c2',
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
  });
  
  audioElement.addEventListener('error', function(e) {
    console.error('❌ Audio error:', e);
    console.error('❌ File:', MUSIC_CONFIG.audioFile);
  });
  
  console.log('✅ Music initialized');
  console.log('✅ URL:', MUSIC_CONFIG.audioFile);
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
      console.error('❌ Play failed:', error);
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMusicWidget);
} else {
  initMusicWidget();
}
