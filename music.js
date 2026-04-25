// ============================================
// МУЗЫКА НЕДЕЛИ (YOUTUBE - МОБИЛЬНАЯ ВЕРСИЯ!)
// ============================================

const MUSIC_CONFIG = {
  track: 'Ava',
  artist: 'Famy',
  youtubeId: 'xk7iWfqcpro',
  week: 1
};

let player = null;
let isPlaying = false;
let playerReady = false;

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
    <div id="youtube-player"></div>
  `;
  
  // Стили для скрытого плеера
  const playerDiv = document.getElementById('youtube-player');
  playerDiv.style.position = 'absolute';
  playerDiv.style.left = '-9999px';
  playerDiv.style.width = '1px';
  playerDiv.style.height = '1px';
  playerDiv.style.overflow = 'hidden';
  
  // Загружаем YouTube API
  if (typeof YT === 'undefined') {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  } else {
    createPlayer();
  }
  
  // Глобальная функция для YouTube API
  window.onYouTubeIframeAPIReady = createPlayer;
  
  const playBtn = document.getElementById('musicPlayBtn');
  playBtn.addEventListener('click', toggleMusic);
  
  console.log('✅ Music widget initialized');
}

function createPlayer() {
  if (player) return;
  
  try {
    player = new YT.Player('youtube-player', {
      height: '1',
      width: '1',
      videoId: MUSIC_CONFIG.youtubeId,
      playerVars: {
        'playsinline': 1,
        'controls': 0,
        'disablekb': 1,
        'fs': 0,
        'rel': 0,
        'iv_load_policy': 3,
        'modestbranding': 1
      },
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange,
        'onError': onPlayerError
      }
    });
    console.log('▶️ Player creating...');
  } catch (e) {
    console.error('❌ Player error:', e);
  }
}

function onPlayerReady(event) {
  playerReady = true;
  console.log('✅ Player ready!');
}

function onPlayerStateChange(event) {
  const btn = document.getElementById('musicPlayBtn');
  
  if (event.data === YT.PlayerState.PLAYING) {
    isPlaying = true;
    btn.textContent = '⏸️';
    console.log('▶️ Playing');
  } else if (event.data === YT.PlayerState.PAUSED) {
    isPlaying = false;
    btn.textContent = '▶️';
    console.log('⏸️ Paused');
  } else if (event.data === YT.PlayerState.ENDED) {
    isPlaying = false;
    btn.textContent = '▶️';
    console.log('⏹️ Ended');
  }
}

function onPlayerError(event) {
  console.error('❌ YouTube error:', event.data);
  const btn = document.getElementById('musicPlayBtn');
  btn.textContent = '❌';
  alert('Ошибка воспроизведения. Попробуйте позже.');
}

function toggleMusic() {
  console.log('🎵 Toggle clicked, ready:', playerReady);
  
  if (!player || !playerReady) {
    console.log('⏳ Player not ready, creating...');
    createPlayer();
    setTimeout(() => {
      if (player && playerReady) {
        doPlay();
      } else {
        alert('Подождите загрузки плеера...');
      }
    }, 500);
    return;
  }
  
  doPlay();
}

function doPlay() {
  const btn = document.getElementById('musicPlayBtn');
  
  try {
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  } catch (e) {
    console.error('❌ Play error:', e);
    // Фолбэк: открываем в приложении YouTube
    window.open(`https://www.youtube.com/watch?v=${MUSIC_CONFIG.youtubeId}`, '_blank');
  }
}

// Инициализация
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMusicWidget);
} else {
  initMusicWidget();
}
