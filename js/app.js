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
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.loadTheme();
        await this.loadChannels();
        this.renderChannels();
        this.renderCategories();
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
            document.getElementById('loading').style.display = 'flex';

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
        } catch (error) {
            console.error('Error loading channels:', error);
            document.getElementById('loading').innerHTML = `
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
                <h2>Failed to Load Channels</h2>
                <p>Please check your internet connection and try again.</p>
            `;
        }
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
                <div class="channel-name">${this.escapeHtml(channel.name)}</div>
                <span class="channel-category">${this.escapeHtml(channel.group || 'Other')}</span>
                <div class="channel-status">Live</div>
            </div>
        `;

        card.addEventListener('click', () => this.openPlayer(channel));
        return card;
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

            const matchesCategory = this.activeCategory === 'all' ||
                channel.group === this.activeCategory;

            return matchesSearch && matchesCategory;
        });

        this.renderChannels();
    }

    toggleSearch() {
        const searchContainer = document.getElementById('searchContainer');
        const searchInput = document.getElementById('searchInput');

        if (searchContainer.style.display === 'none') {
            searchContainer.style.display = 'flex';
            searchInput.focus();
        } else {
            searchContainer.style.display = 'none';
            searchInput.value = '';
            this.searchTerm = '';
            this.applyFilters();
        }
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

        // Auto play
        videoPlayer.play().catch(error => {
            console.warn('Autoplay prevented:', error);
        });
    }

    closePlayer() {
        const videoPlayer = document.getElementById('videoPlayer');
        videoPlayer.pause();
        videoPlayer.src = '';

        document.getElementById('playerModal').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
        document.body.style.overflow = 'auto';
        this.currentChannel = null;
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
