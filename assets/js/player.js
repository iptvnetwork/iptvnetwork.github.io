(() => {
  const CONFIG = {
    CACHE_KEY: 'iptv_favorites',
    THEME_KEY: 'iptv_theme',
    TIMEOUT: 10000
  }

  const DOM = {
    channels: document.getElementById('channels'),
    search: document.getElementById('search'),
    nowplaying: document.getElementById('nowplaying'),
    channelCount: document.getElementById('channel-count'),
    player: document.getElementById('player'),
    themeToggle: document.getElementById('theme-toggle'),
    favoriteBtn: document.getElementById('favorite-btn'),
    fullscreenBtn: document.getElementById('fullscreen-btn')
  }

  let channels = []
  let favorites = new Set()
  let hls = null
  let currentChannel = null

  // Initialize
  function init() {
    loadTheme()
    loadFavorites()
    setupEventListeners()
    fetchChannels()
  }

  function setupEventListeners() {
    DOM.search.addEventListener('input', debounce(handleSearch, 200))
    DOM.themeToggle.addEventListener('click', toggleTheme)
    DOM.favoriteBtn.addEventListener('click', toggleFavorite)
    DOM.fullscreenBtn.addEventListener('click', requestFullscreen)
    DOM.player.addEventListener('error', handlePlayerError)
  }

  function fetchChannels() {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), CONFIG.TIMEOUT)
    
    fetch('data/channels.json', { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(list => {
        channels = list || []
        DOM.channelCount.textContent = `${channels.length} channels`
        render(channels)
      })
      .catch(err => {
        console.error('Failed to load channels:', err)
        DOM.channels.innerHTML = '<div class="empty">⚠ Failed to load channels</div>'
      })
      .finally(() => clearTimeout(timeout))
  }

  function handleSearch() {
    const q = DOM.search.value.trim().toLowerCase()
    if (!q) return render(channels)
    const filtered = channels.filter(c => 
      (c.name || '').toLowerCase().includes(q) || 
      (c.category || '').toLowerCase().includes(q)
    )
    render(filtered)
  }

  function render(list) {
    if (!list || list.length === 0) {
      DOM.channels.innerHTML = '<div class="empty">No channels found</div>'
      return
    }
    DOM.channels.innerHTML = ''
    for (const ch of list) {
      const el = document.createElement('div')
      el.className = 'channel'
      el.role = 'option'
      el.tabIndex = 0
      
      const img = document.createElement('img')
      img.src = ch.logo || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 160 90%22%3E%3Crect fill=%22%231a1a1a%22 width=%22160%22 height=%2290%22/%3E%3C/svg%3E'
      img.alt = ch.name || 'Channel logo'
      img.loading = 'lazy'
      
      const meta = document.createElement('div')
      meta.className = 'meta'
      
      const name = document.createElement('div')
      name.className = 'name'
      name.textContent = ch.name || 'Unknown'
      
      const cat = document.createElement('div')
      cat.className = 'cat'
      cat.textContent = ch.category || 'No category'
      
      meta.appendChild(name)
      meta.appendChild(cat)
      el.appendChild(img)
      el.appendChild(meta)
      
      const playHandler = () => playChannel(ch)
      el.addEventListener('click', playHandler)
      el.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          playHandler()
        }
      })
      
      DOM.channels.appendChild(el)
    }
  }

  function playChannel(ch) {
    if (!ch.url) {
      showNotification('⚠ No stream URL available')
      return
    }
    currentChannel = ch
    playUrl(ch.url, ch.name)
    updateFavoriteButton()
  }

  function playUrl(url, name) {
    try {
      if (hls) { hls.destroy(); hls = null }
      
      if (window.Hls && Hls.isSupported()) {
        hls = new Hls({ maxLoadingDelay: 4, maxFragLookUpTolerance: 0.25 })
        hls.once(Hls.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(url)
        })
        hls.attachMedia(DOM.player)
      } else if (DOM.player.canPlayType('application/vnd.apple.mpegurl')) {
        DOM.player.src = url
      } else {
        showNotification('⚠ HLS playback not supported')
        return
      }
      
      DOM.player.play().catch(e => showNotification('▶ Click to play'))
      DOM.nowplaying.textContent = `▶ ${name || 'Playing'}`
    } catch (e) {
      console.error('Playback error:', e)
      showNotification('⚠ Playback failed')
    }
  }

  function handlePlayerError() {
    const error = DOM.player.error
    if (error) {
      const msg = {1:'Aborted', 2:'Network error', 3:'Decode error', 4:'Format not supported'}[error.code] || 'Unknown error'
      showNotification(`⚠ ${msg}`)
    }
  }

  function toggleTheme() {
    const html = document.documentElement
    const isDark = html.style.colorScheme === 'dark'
    html.style.colorScheme = isDark ? 'light' : 'dark'
    localStorage.setItem(CONFIG.THEME_KEY, isDark ? 'light' : 'dark')
    DOM.themeToggle.textContent = isDark ? '☀️' : '🌙'
  }

  function loadTheme() {
    const theme = localStorage.getItem(CONFIG.THEME_KEY) || 'dark'
    document.documentElement.style.colorScheme = theme
    DOM.themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️'
  }

  function toggleFavorite() {
    if (!currentChannel) return
    const id = currentChannel.name
    if (favorites.has(id)) {
      favorites.delete(id)
    } else {
      favorites.add(id)
    }
    saveFavorites()
    updateFavoriteButton()
    showNotification(favorites.has(id) ? '♥ Added to favorites' : '♡ Removed from favorites')
  }

  function updateFavoriteButton() {
    if (!currentChannel) {
      DOM.favoriteBtn.textContent = '♡ Favorite'
      return
    }
    const isFav = favorites.has(currentChannel.name)
    DOM.favoriteBtn.textContent = isFav ? '♥ Favorite' : '♡ Favorite'
    DOM.favoriteBtn.style.opacity = isFav ? '1' : '0.7'
  }

  function saveFavorites() {
    localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify([...favorites]))
  }

  function loadFavorites() {
    try {
      const data = localStorage.getItem(CONFIG.CACHE_KEY)
      favorites = new Set(data ? JSON.parse(data) : [])
    } catch (e) {
      console.error('Failed to load favorites:', e)
    }
  }

  function requestFullscreen() {
    const el = document.documentElement
    const req = el.requestFullscreen || el.mozRequestFullScreen || el.webkitRequestFullscreen
    if (req) req.call(el).catch(e => console.error('Fullscreen error:', e))
  }

  function showNotification(msg) {
    DOM.nowplaying.textContent = msg
  }

  function debounce(fn, delay) {
    let timeout
    return function (...args) {
      clearTimeout(timeout)
      timeout = setTimeout(() => fn.apply(this, args), delay)
    }
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})();

