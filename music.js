// ============================================
// МУЗЫКА НЕДЕЛИ (АУДИО ПЛЕЕР)
// ============================================

const MUSIC_CONFIG = {
  track: 'Blinding Lights',
  artist: 'The Weeknd',
  audioFile: 'music/track.mp3', // Путь к файлу
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
      <button class="music-play-btn" onclick="toggleMusic()">
        ▶️
      </button>
    </div>
    <audio id="musicAudio" preload="none">
      <source src="${MUSIC_CONFIG.audioFile}" type="audio/mpeg">
    </audio>
  `;
  
  console.log('🎵 Music widget loaded:', MUSIC_CONFIG.track);
}

let isPlaying = false;
let musicAudio = null;

function toggleMusic() {
  const btn = document.querySelector('.music-play-btn');
  if (!btn) return;
  
  if (!musicAudio) {
    musicAudio = document.getElementById('musicAudio');
  }
  
  if (isPlaying) {
    musicAudio.pause();
    btn.textContent = '▶️';
    isPlaying = false;
  } else {
    musicAudio.play();
    btn.textContent = '⏸️';
    isPlaying = true;
  }
  
  console.log('🎵 Music:', isPlaying ? 'Playing' : 'Stopped');
}

// Когда трек закончится
document.addEventListener('DOMContentLoaded', () => {
  initMusicWidget();
  
  const audio = document.getElementById('musicAudio');
  if (audio) {
    audio.addEventListener('ended', () => {
      isPlaying = false;
      const btn = document.querySelector('.music-play-btn');
      if (btn) btn.textContent = '▶️';
    });
  }
});
