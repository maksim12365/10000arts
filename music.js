// ============================================
// МУЗЫКА НЕДЕЛИ (ПРЯМОЙ ФАЙЛ - РАБОТАЕТ!)
// ============================================

let audio = null;
let isPlaying = false;

const MUSIC_CONFIG = {
  track: 'DILATACAO HIPNOTICA DRAWING 6.0',
  artist: 'DJ MX 2006',
  audioFile: 'https://archive.org/download/dj-mx-2006-dilatacao-hipnotica-drawing-6.0/DJ%20MX%202006%20-%20DILATACAO%20HIPNOTICA%20DRAWING%206.0.mp3',  // Файл в корне!
  week: 6
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
      <button id="musicPlayBtn" class="music-play-btn" type="button">
        ▶️
      </button>
    </div>
  `;
  
  // Создаём аудио
  audio = new Audio(MUSIC_CONFIG.audioFile);
  
  const btn = document.getElementById('musicPlayBtn');
  btn.addEventListener('click', () => {
    if (isPlaying) {
      audio.pause();
      btn.textContent = '▶️';
      isPlaying = false;
    } else {
      audio.play().catch(() => {
        // Если не получилось - пробуем ещё раз
        setTimeout(() => audio.play(), 100);
      });
      btn.textContent = '⏸️';
      isPlaying = true;
    }
  });
  
  audio.addEventListener('ended', () => {
    btn.textContent = '▶️';
    isPlaying = false;
  });
  
  audio.addEventListener('error', (e) => {
    console.error('❌ Error:', e);
    btn.textContent = '❌';
  });
  
  console.log('✅ Music loaded:', MUSIC_CONFIG.audioFile);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMusicWidget);
} else {
  initMusicWidget();
}
