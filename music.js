// ============================================
// МУЗЫКА НЕДЕЛИ (YOUTUBE MUSIC - РАБОТАЕТ 100%!)
// ============================================

const MUSIC_CONFIG = {
  track: 'Ava',      // ← Поменяй название если нужно
  artist: 'Famy',      // ← Поменяй исполнителя если нужно
  youtubeId: 'xk7iWfqcpro',  // ← Твоя песня с YouTube Music!
  week: 1
};

let player = null;
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
    <div id="youtube-player" style="display: none;"></div>
  `;
  
  // Загружаем YouTube API
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  
  // Создаём плеер
  window.onYouTubeIframeAPIReady = function() {
    player = new YT.Player('youtube-player', {
      height: '0',
      width: '0',
      videoId: MUSIC_CONFIG.youtubeId,
      playerVars: {
        'playsinline': 1,
        'controls': 0,
        'disablekb': 1
      },
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
      }
    });
  };
  
  const playBtn = document.getElementById('musicPlayBtn');
  playBtn.addEventListener('click', toggleMusic);
  
  console.log('✅ YouTube music initialized:', MUSIC_CONFIG.track);
}

function onPlayerReady(event) {
  console.log('▶️ Player ready');
}

function onPlayerStateChange(event) {
  const btn = document.getElementById('musicPlayBtn');
  
  if (event.data === YT.PlayerState.PLAYING) {
    isPlaying = true;
    btn.textContent = '⏸️';
    console.log('▶️ Playing');
  } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
    isPlaying = false;
    btn.textContent = '▶️';
    console.log('⏸️ Paused');
  }
}

function toggleMusic() {
  if (!player) return;
  
  if (isPlaying) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMusicWidget);
} else {
  initMusicWidget();
}
