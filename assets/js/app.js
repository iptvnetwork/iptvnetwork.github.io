// ===========================
// IPTV Application Core
// ===========================

class IPTVApp {
    constructor() {
        this.channels = [];
        this.filteredChannels = [];
        this.categories = new Set();
        this.currentChannel = null;
        this.searchTerm = '';
        this.activeCategory = 'all';
        this.isDarkMode = true;
        this.favorites = new Set();
        this.lastScrollY = 0;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.loadTheme();
        this.loadFavorites();
        await this.loadChannels();
        this.renderChannels();
        this.renderCategories();
        this.updateFavoritesChip();
    }

    // ===========================
    // EVENT LISTENERS
    // ===========================
    setupEventListeners() {
        // Search functionality
        document.getElementById('searchBtn').addEventListener('click', () => this.toggleSearch());
        document.getElementById('closeSearchBtn').addEventListener('click', () => this.toggleSearch());
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e));

        // Theme toggle
        document.getElementById('themeBtn').addEventListener('click', () => this.toggleTheme());

        // Category filtering
        document.body.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-btn')) {
                this.handleCategoryFilter(e.target);
            }
        });

        // Player modal
        document.getElementById('overlay').addEventListener('click', () => this.closePlayer());
        document.getElementById('closePlayerBtn').addEventListener('click', () => this.closePlayer());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closePlayer();
            if (e.key === ' ') this.togglePlayPause();
        });

        // Player controls
        const videoPlayer = document.getElementById('videoPlayer');
        document.getElementById('playPauseBtn').addEventListener('click', () => this.togglePlayPause());
        document.getElementById('volumeBtn').addEventListener('click', () => this.toggleMute());
        document.getElementById('volumeSlider').addEventListener('input', (e) => this.setVolume(e.target.value));
        document.getElementById('fullscreenBtn').addEventListener('click', () => this.toggleFullscreen());

        // Sticky player controls
        const stickyPlay = document.getElementById('stickyPlayBtn');
        const stickyClose = document.getElementById('stickyCloseBtn');
        if (stickyPlay) stickyPlay.addEventListener('click', (e) => { e.stopPropagation(); this.togglePlayPause(); });
        if (stickyClose) stickyClose.addEventListener('click', (e) => { e.stopPropagation(); this.hideStickyPlayer(); });

        // Scroll: header shadow + hide/show
        window.addEventListener('scroll', () => this.handleScroll());

        videoPlayer.addEventListener('play', () => this.updatePlayPauseIcon());
        videoPlayer.addEventListener('pause', () => this.updatePlayPauseIcon());
        videoPlayer.addEventListener('timeupdate', () => this.updateTimer());
        videoPlayer.addEventListener('loadedmetadata', () => this.updateTimer());
    }

    // ===========================
    // DATA LOADING
    // ===========================
    async loadChannels() {
        try {
            // show skeletons while fetching
            document.getElementById('loading').style.display = 'flex';
            this.renderSkeletons(8);

            const response = await fetch('data/channels.json');
            if (!response.ok) throw new Error('Failed to load channels');

            this.channels = await response.json();

            // Extract unique categories
            this.channels.forEach(channel => {
                if (channel.group) {
                    this.categories.add(channel.group);
                }
            });

            this.filteredChannels = [...this.channels];
            document.getElementById('loading').style.display = 'none';
            this.clearSkeletons();
        } catch (error) {
            console.error('Error loading channels:', error);
            document.getElementById('loading').innerHTML = `
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
                <h2>Failed to Load Channels</h2>
                <p>Please check your internet connection and try again.</p>
            `;
        }
    }

    renderSkeletons(count = 6) {
        const grid = document.getElementById('channelsGrid');
        grid.innerHTML = '';
        for (let i=0;i<count;i++) {
            const card = document.createElement('div');
            card.className = 'channel-card skeleton';
            card.style.height = '220px';
            card.innerHTML = `<div style="height:150px;background:linear-gradient(180deg,rgba(0,0,0,0.06),rgba(255,255,255,0.02))"></div><div style="padding:1rem;"></div>`;
            grid.appendChild(card);
        }
    }

    clearSkeletons() {
        const grid = document.getElementById('channelsGrid');
        // keep grid but clear skeletons
        // actual renderChannels will repopulate
    }

    // ===========================
    // RENDERING
    // ===========================
    renderChannels() {
        const grid = document.getElementById('channelsGrid');
        grid.innerHTML = '';

        if (this.filteredChannels.length === 0) {
            document.getElementById('noResults').style.display = 'flex';
            grid.style.display = 'none';
            return;
        }

        document.getElementById('noResults').style.display = 'none';
        grid.style.display = 'grid';

        this.filteredChannels.forEach(channel => {
            const card = this.createChannelCard(channel);
            // highlight search matches in name
            if (this.searchTerm) {
                const nameEl = card.querySelector('.channel-name');
                if (nameEl) nameEl.innerHTML = this.highlightMatch(channel.name, this.searchTerm);
            }
            grid.appendChild(card);
        });

        // Lazy load images
        this.lazyLoadImages();
    }

    createChannelCard(channel) {
        const card = document.createElement('div');
        card.className = 'channel-card';
        card.innerHTML = `
            <img src="${channel.logo}" alt="${channel.name}" class="channel-logo" onerror="this.src='https://via.placeholder.com/200x150?text=No+Image'">
            <div class="channel-info">
                <div style=\"display:flex;align-items:center;justify-content:space-between;gap:0.5rem;\">
                    <div class=\"channel-name\">${this.escapeHtml(channel.name)}</div>
                    <button class=\"fav-btn ${this.isFavorite(channel) ? 'active' : ''}\" data-channel-id=\"${this.escapeHtml(channel.id || channel.name)}\" title=\"Favorite\"><i class=\"fas fa-star\"></i></button>
                </div>
                <span class="channel-category">${this.escapeHtml(channel.group || 'Other')}</span>
                <div class="channel-status">Live</div>
            </div>
        `;

        // Favorite button handling
        const favBtn = card.querySelector('.fav-btn');
        if (favBtn) {
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(channel, favBtn);
            });
        }

        card.addEventListener('click', () => this.openPlayer(channel));
        return card;
    }

    // Wrap matching substrings in <span class="highlight">
    highlightMatch(text, term) {
        if (!term) return this.escapeHtml(text);
        const esc = term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const re = new RegExp(`(${esc})`, 'ig');
        return this.escapeHtml(text).replace(re, '<span class="highlight">$1</span>');
    }

    renderCategories() {
        const categoriesList = document.getElementById('categoriesList');
        categoriesList.innerHTML = '';

        const sortedCategories = Array.from(this.categories).sort();

        sortedCategories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.dataset.category = category;
            btn.innerHTML = `<i class="fas fa-layer-group"></i> ${this.escapeHtml(category)}`;
            categoriesList.appendChild(btn);
        });
    }

    updateFavoritesChip() {
        const chip = document.getElementById('favoritesChip');
        if (!chip) return;
        if (this.favorites.size > 0) {
            chip.style.display = 'inline-flex';
        } else {
            chip.style.display = 'none';
        }
    }

    // ===========================
    // FILTERING & SEARCH
    // ===========================
    handleCategoryFilter(button) {
        // Remove active class from all buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to clicked button
        button.classList.add('active');
        this.activeCategory = button.dataset.category;
        this.applyFilters();
    }

    handleSearch(event) {
        this.searchTerm = event.target.value.toLowerCase();
        this.applyFilters();
    }

    applyFilters() {
        this.filteredChannels = this.channels.filter(channel => {
            const matchesSearch = this.searchTerm === '' ||
                channel.name.toLowerCase().includes(this.searchTerm) ||
                (channel.group && channel.group.toLowerCase().includes(this.searchTerm));

            // category matching, support favorites
            let matchesCategory = true;
            if (this.activeCategory === 'all') matchesCategory = true;
            else if (this.activeCategory === 'favorites') {
                const id = (channel.id || channel.name).toString();
                matchesCategory = this.favorites.has(id);
            } else {
                matchesCategory = channel.group === this.activeCategory;
            }

            return matchesSearch && matchesCategory;
        });

        this.renderChannels();
    }

    toggleSearch() {
        const searchContainer = document.getElementById('searchContainer');
        const searchInput = document.getElementById('searchInput');

        if (searchContainer.style.display === 'none') {
            searchContainer.style.display = 'flex';
            // mobile add class for animation
            searchContainer.classList.add('open');
            setTimeout(()=> searchInput.focus(), 80);
        } else {
            searchContainer.style.display = 'none';
            searchContainer.classList.remove('open');
            searchInput.value = '';
            this.searchTerm = '';
            this.applyFilters();
        }
    }

    // ===========================
    // FAVORITES
    // ===========================
    loadFavorites() {
        try {
            const raw = localStorage.getItem('iptv-favs');
            if (raw) JSON.parse(raw).forEach(id => this.favorites.add(id));
        } catch (e) { /* ignore */ }
    }

    saveFavorites() {
        try { localStorage.setItem('iptv-favs', JSON.stringify(Array.from(this.favorites))); } catch(e) {}
    }

    isFavorite(channel) {
        const id = channel.id || channel.name;
        return this.favorites.has(id.toString());
    }

    toggleFavorite(channel, btnEl) {
        const id = (channel.id || channel.name).toString();
        if (this.favorites.has(id)) {
            this.favorites.delete(id);
            btnEl.classList.remove('active');
        } else {
            this.favorites.add(id);
            btnEl.classList.add('active');
        }
        this.saveFavorites();
    }

    // ===========================
    // PLAYER MODAL
    // ===========================
    openPlayer(channel) {
        this.currentChannel = channel;

        // Update player header
        document.getElementById('playerLogo').src = channel.logo;
        document.getElementById('playerName').textContent = channel.name;
        document.getElementById('playerCategory').textContent = channel.group || 'Other';

        // Set video source
        const videoPlayer = document.getElementById('videoPlayer');
        videoPlayer.src = channel.url;
        videoPlayer.load();

        // Show related channels
        this.showRelatedChannels(channel);

        // Show modal
        document.getElementById('playerModal').classList.add('active');
        document.getElementById('overlay').classList.add('active');
        document.body.style.overflow = 'hidden';

        // Show sticky player UI (visual)
        this.showStickyPlayer(channel);

        // Auto play
        videoPlayer.play().catch(error => {
            console.warn('Autoplay prevented:', error);
        });

        // Update Now Playing UI
        const nowLogo = document.getElementById('nowLogo');
        const nowChannel = document.getElementById('nowChannel');
        const nowStatus = document.getElementById('nowStatus');
        const liveBadge = document.getElementById('liveBadge');
        if (nowLogo) nowLogo.src = channel.logo || '';
        if (nowChannel) nowChannel.textContent = channel.name || 'Playing';
        if (nowStatus) nowStatus.textContent = 'Playing';
        if (liveBadge) liveBadge.style.display = 'inline-block';
    }

    closePlayer() {
        const videoPlayer = document.getElementById('videoPlayer');
        videoPlayer.pause();
        videoPlayer.src = '';

        document.getElementById('playerModal').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
        document.body.style.overflow = 'auto';
        this.currentChannel = null;
        const nowChannel = document.getElementById('nowChannel');
        const nowStatus = document.getElementById('nowStatus');
        const liveBadge = document.getElementById('liveBadge');
        if (nowChannel) nowChannel.textContent = 'Not playing';
        if (nowStatus) nowStatus.textContent = 'Idle';
        if (liveBadge) liveBadge.style.display = 'none';
    }

    // ===========================
    // STICKY PLAYER (UI only)
    // ===========================
    showStickyPlayer(channel) {
        const el = document.getElementById('stickyPlayer');
        if (!el) return;
        el.setAttribute('aria-hidden', 'false');
        document.getElementById('stickyLogo').src = channel.logo || '';
        document.getElementById('stickyName').textContent = channel.name || '';
        document.getElementById('stickyCategory').textContent = channel.group || '';
    }

    hideStickyPlayer() {
        const el = document.getElementById('stickyPlayer');
        if (!el) return;
        el.setAttribute('aria-hidden', 'true');
    }

    // ===========================
    // SCROLL HANDLING
    // ===========================
    handleScroll() {
        const header = document.querySelector('.header');
        if (!header) return;
        const currentY = window.scrollY;
        if (currentY > 10) header.classList.add('header--scrolled'); else header.classList.remove('header--scrolled');

        // Hide on scroll down, show on scroll up (small UX)
        if (currentY > this.lastScrollY && currentY > 120) {
            header.classList.add('header-hidden');
        } else {
            header.classList.remove('header-hidden');
        }
        this.lastScrollY = currentY;
    }

    showRelatedChannels(channel) {
        const relatedList = document.getElementById('relatedList');
        relatedList.innerHTML = '';

        // Get channels from same category
        const related = this.channels.filter(ch =>
            ch.group === channel.group && ch.name !== channel.name
        ).slice(0, 8);

        related.forEach(ch => {
            const item = document.createElement('div');
            item.className = 'related-item';
            item.innerHTML = `<img src="${ch.logo}" alt="${ch.name}" onerror="this.src='https://via.placeholder.com/120x80?text=No+Image'">`;
            item.title = ch.name;
            item.addEventListener('click', () => this.openPlayer(ch));
            relatedList.appendChild(item);
        });
    }

    // ===========================
    // PLAYER CONTROLS
    // ===========================
    togglePlayPause() {
        const videoPlayer = document.getElementById('videoPlayer');
        if (videoPlayer.paused) {
            videoPlayer.play().catch(error => {
                console.warn('Play error:', error);
            });
        } else {
            videoPlayer.pause();
        }
    }

    updatePlayPauseIcon() {
        const videoPlayer = document.getElementById('videoPlayer');
        const icon = document.querySelector('#playPauseBtn i');
        icon.className = videoPlayer.paused ? 'fas fa-play' : 'fas fa-pause';
    }

    toggleMute() {
        const videoPlayer = document.getElementById('videoPlayer');
        const icon = document.querySelector('#volumeBtn i');
        const slider = document.getElementById('volumeSlider');

        videoPlayer.muted = !videoPlayer.muted;
        icon.className = videoPlayer.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
        slider.value = videoPlayer.muted ? 0 : 100;
    }

    setVolume(value) {
        const videoPlayer = document.getElementById('videoPlayer');
        videoPlayer.volume = value / 100;
        videoPlayer.muted = value == 0;

        const icon = document.querySelector('#volumeBtn i');
        icon.className = value == 0 ? 'fas fa-volume-mute' : 'fas fa-volume-up';
    }

    toggleFullscreen() {
        const modal = document.getElementById('playerModal');
        if (!document.fullscreenElement) {
            modal.requestFullscreen().catch(error => {
                console.warn('Fullscreen error:', error);
            });
        } else {
            document.exitFullscreen();
        }
    }

    updateTimer() {
        const videoPlayer = document.getElementById('videoPlayer');
        const currentTime = document.getElementById('currentTime');
        const duration = document.getElementById('duration');

        currentTime.textContent = this.formatTime(videoPlayer.currentTime);
        duration.textContent = this.formatTime(videoPlayer.duration);
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // ===========================
    // THEME MANAGEMENT
    // ===========================
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        this.applyTheme();
        localStorage.setItem('iptv-theme', this.isDarkMode ? 'dark' : 'light');
    }

    loadTheme() {
        const saved = localStorage.getItem('iptv-theme');
        if (saved) {
            this.isDarkMode = saved === 'dark';
        } else {
            // Check system preference
            this.isDarkMode = !window.matchMedia('(prefers-color-scheme: light)').matches;
        }
        this.applyTheme();
    }

    applyTheme() {
        const body = document.body;
        const btn = document.getElementById('themeBtn');
        const icon = btn.querySelector('i');

        if (this.isDarkMode) {
            body.classList.remove('light-mode');
            icon.className = 'fas fa-sun';
        } else {
            body.classList.add('light-mode');
            icon.className = 'fas fa-moon';
        }
    }

    // ===========================
    // UTILITIES
    // ===========================
    lazyLoadImages() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                        }
                        observer.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('.channel-logo').forEach(img => {
                observer.observe(img);
            });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ===========================
// INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    window.iptv = new IPTVApp();
});

// Service Worker Registration (for PWA support)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
        console.log('Service Worker registration failed:', err);
    });
}
