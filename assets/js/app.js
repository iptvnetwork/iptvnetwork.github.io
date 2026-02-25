document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    const state = {
        channels: [],
        filteredChannels: [],
        groups: new Set(),
        currentFilter: 'all', // 'all', 'favorites', or specific group name
        favorites: new Set(JSON.parse(localStorage.getItem('iptv_favorites')) || []),
        theme: localStorage.getItem('iptv_theme') || 'dark',
        visibleCount: 40,
        batchSize: 40,
        updateInterval: null
    };

    // --- DOM Elements ---
    const elements = {
        grid: document.getElementById('channel-grid'),
        categoryScroll: document.getElementById('category-scroll'), // Renamed from groupList
        searchInput: document.getElementById('search-input'),
        searchToggle: document.getElementById('search-toggle'),
        viewTitle: document.getElementById('current-view-title'),
        // channelCount: document.getElementById('channel-count'), // Removed
        playerModal: document.getElementById('player-modal'),
        videoPlayer: document.getElementById('video-player'),
        closePlayerBtn: document.getElementById('close-player'),
        playerChannelName: document.getElementById('player-channel-name'),
        playerChannelGroup: document.getElementById('player-channel-group'),
        playerFavBtn: document.getElementById('player-fav-btn'),
        navItems: document.querySelectorAll('.cat-pill'), // Updated class
        toastContainer: null, // Will be created dynamically
        themeToggle: document.getElementById('theme-toggle'),
        themeIcon: document.querySelector('#theme-toggle i')
    };

    let hls = null;
    let observer = null;
    let fuse = null;

    // --- Initialization ---
    init();

    async function init() {
        createToastContainer();
        applyTheme();
        renderSkeletons(); // Show loading state

        // Setup Infinite Scroll Observer
        observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                loadMoreChannels();
            }
        }, { rootMargin: '200px' });

        try {
            await fetchChannels();

            // Start Auto-Update Checker (every 10 minutes)
            setInterval(checkUpdates, 10 * 60 * 1000);

            setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize app', error);
            elements.grid.innerHTML = '<div class="error-msg">Failed to load channels. Please try again later.</div>';
        }
    }

    function createToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        elements.toastContainer = container;
    }

    function showToast(message, icon = 'fa-info-circle') {
        const toast = document.createElement('div');
        toast.className = 'toast';
        const iconEl = document.createElement('i');
        iconEl.className = `fa-solid ${icon}`;
        const span = document.createElement('span');
        span.textContent = message;
        toast.appendChild(iconEl);
        toast.appendChild(document.createTextNode(' '));
        toast.appendChild(span);

        elements.toastContainer.appendChild(toast);

        // Trigger reflow
        toast.offsetHeight;

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400); // Wait for transition
        }, 3000);
    }

    function renderSkeletons() {
        elements.grid.innerHTML = '';
        const fragment = document.createDocumentFragment();
        // Show 12 skeleton cards
        for (let i = 0; i < 12; i++) {
            const div = document.createElement('div');
            div.className = 'skeleton skeleton-card';
            fragment.appendChild(div);
        }
        elements.grid.appendChild(fragment);
    }

    // --- Data Fetching ---
    async function fetchChannels() {
        const CACHE_KEY = 'iptv_channels_data';
        const CACHE_TIME_KEY = 'iptv_channels_time';
        const CACHE_DURATION = 3600 * 1000; // 1 Hour

        // Try loading from cache first using a helper to avoid stale UI if fetch takes time
        const cached = localStorage.getItem(CACHE_KEY);
        const cacheTime = localStorage.getItem(CACHE_TIME_KEY);
        const now = Date.now();

        if (cached && cacheTime && (now - parseInt(cacheTime) < CACHE_DURATION)) {
            console.log('Loading channels from cache...');
            processData(JSON.parse(cached));
            // Background update (optional, maybe not needed if cache is fresh enough)
            fetchFromServer(CACHE_KEY, CACHE_TIME_KEY);
        } else {
            console.log('Cache expired or missing, fetching from server...');
            await fetchFromServer(CACHE_KEY, CACHE_TIME_KEY);
        }
    }

    async function fetchFromServer(cacheKey, cacheTimeKey) {
        try {
            const response = await fetch('data/channels.json');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();

            // Save to cache
            localStorage.setItem(cacheKey, JSON.stringify(data));
            localStorage.setItem(cacheTimeKey, Date.now().toString());

            processData(data);
        } catch (e) {
            console.error("Fetch failed", e);
            // If fetch failed but we have stale cache, ensures we show something (already done if cached existed)
        }
    }

    async function checkUpdates() {
        console.log("Checking for updates...");
        try {
            const response = await fetch('data/channels.json');
            if (!response.ok) return;
            const data = await response.json();

            const CACHE_KEY = 'iptv_channels_data';
            const currentCache = localStorage.getItem(CACHE_KEY);

            if (currentCache !== JSON.stringify(data)) {
                console.log("Updates found!");
                showToast("Updating channel list...", "fa-rotate");

                // Update Cache and State
                localStorage.setItem(CACHE_KEY, JSON.stringify(data));
                localStorage.setItem('iptv_channels_time', Date.now().toString());

                processData(data);
            }
        } catch (e) { console.warn("Auto-update check failed", e); }
    }

    function processData(data) {
        // Validate and Process Data (Strict Mode: Must have URL and Name)
        state.channels = data
            .filter(ch => ch.url && ch.url.trim() !== "" && ch.name && ch.name.trim() !== "")
            .map((channel, index) => ({
                ...channel,
                id: index,
                group: channel.group || 'Others'
            }));

        // Extract unique groups
        state.groups = new Set(); // Reset groups
        state.channels.forEach(ch => state.channels.length > 0 && state.groups.add(ch.group));

        // Re-render
        renderGroups();
        // Initialize Fuse for fuzzy search
        try {
            fuse = new Fuse(state.channels, { keys: ['name', 'group'], threshold: 0.3 });
        } catch (e) {
            fuse = null;
        }

        filterChannels();
    }

    // --- Rendering ---
    function renderGroups() {
        // Keep the "All Channels" button
        const allBtn = document.querySelector('.cat-pill[data-filter="all"]');
        elements.categoryScroll.innerHTML = '';
        elements.categoryScroll.appendChild(allBtn);

        const sortedGroups = Array.from(state.groups).sort();

        sortedGroups.forEach(group => {
            const btn = document.createElement('button');
            btn.className = 'cat-pill';
            btn.dataset.filter = group;
            // Use specific icon for common groups if wanted, else generic
            let icon = 'fa-layer-group';
            if (group.toLowerCase().includes('sport')) icon = 'fa-futbol';
            if (group.toLowerCase().includes('news')) icon = 'fa-newspaper';

            const iconEl = document.createElement('i');
            iconEl.className = `fa-solid ${icon}`;
            const span = document.createElement('span');
            span.textContent = group;
            btn.appendChild(iconEl);
            btn.appendChild(document.createTextNode(' '));
            btn.appendChild(span);

            btn.addEventListener('click', (e) => {
                // Remove active class from all
                document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                state.currentFilter = group;
                filterChannels();
            });

            elements.categoryScroll.appendChild(btn);
        });
    }

    // --- Filtering Logic ---
    function filterChannels() {
        const query = elements.searchInput.value.trim();

        if (query && fuse) {
            const results = fuse.search(query);
            state.filteredChannels = results.map(r => r.item).filter(ch => state.currentFilter === 'all' || ch.group === state.currentFilter);
        } else {
            const q = query.toLowerCase();
            state.filteredChannels = state.channels.filter(ch => {
                const matchesGroup = state.currentFilter === 'all' || ch.group === state.currentFilter;
                const matchesSearch = !q || ch.name.toLowerCase().includes(q) || ch.group.toLowerCase().includes(q);
                return matchesGroup && matchesSearch;
            });
        }

        // Reset visible count on filter change
        state.visibleCount = state.batchSize;
        renderChannels();
    }

    function renderChannels(append = false) {
        elements.viewTitle.innerText = getTitle(state.currentFilter);

        // If not appending (i.e., fresh filter), clear grid
        if (!append) {
            elements.grid.innerHTML = '';
            window.scrollTo(0, 0);
        } else {
            const oldSentinel = document.getElementById('scroll-sentinel');
            if (oldSentinel) oldSentinel.remove();
        }

        if (state.filteredChannels.length === 0) {
            elements.grid.innerHTML = '<div class="no-results" style="color:var(--text-muted); padding:2rem;">No channels found matching your criteria.</div>';
            return;
        }

        // Slice data
        let batch;
        if (append) {
            batch = state.filteredChannels.slice(state.visibleCount - state.batchSize, state.visibleCount);
        } else {
            // First batch
            batch = state.filteredChannels.slice(0, state.batchSize);
        }

        const fragment = document.createDocumentFragment();

        batch.forEach(channel => {
            const card = document.createElement('div');
            card.className = 'channel-card';

            const logoUrl = channel.logo ? channel.logo : 'assets/images/default-tv.png';

            const imgWrap = document.createElement('div');
            imgWrap.className = 'card-image';
            const img = document.createElement('img');
            img.src = logoUrl;
            img.alt = channel.name;
            img.loading = 'lazy';
            img.onerror = function () { this.src = 'https://via.placeholder.com/150?text=' + encodeURIComponent(channel.name); };
            imgWrap.appendChild(img);

            const info = document.createElement('div');
            info.className = 'card-info';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'card-name';
            nameDiv.title = channel.name;
            nameDiv.textContent = channel.name;

            const groupDiv = document.createElement('div');
            groupDiv.className = 'card-group';
            groupDiv.textContent = channel.group;

            const liveDiv = document.createElement('div');
            liveDiv.className = 'live-status';
            const liveDot = document.createElement('div');
            liveDot.className = 'live-dot';
            liveDiv.appendChild(liveDot);
            liveDiv.appendChild(document.createTextNode(' Live'));

            // Report button
            const reportBtn = document.createElement('button');
            reportBtn.className = 'report-btn';
            reportBtn.title = 'Report channel';
            reportBtn.innerHTML = '<i class="fa-regular fa-flag"></i>';
            reportBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openReport(channel);
            });

            info.appendChild(nameDiv);
            info.appendChild(groupDiv);
            info.appendChild(liveDiv);
            info.appendChild(reportBtn);

            card.appendChild(imgWrap);
            card.appendChild(info);

            card.addEventListener('click', () => openPlayer(channel));
            fragment.appendChild(card);
        });

        elements.grid.appendChild(fragment);

        // Add Sentinel if more items exist
        if (state.visibleCount < state.filteredChannels.length) {
            const sentinel = document.createElement('div');
            sentinel.id = 'scroll-sentinel';
            sentinel.style.height = '20px';
            sentinel.style.width = '100%';
            elements.grid.appendChild(sentinel);
            observer.observe(sentinel);
        }
    }

    function loadMoreChannels() {
        if (state.visibleCount >= state.filteredChannels.length) return;
        state.visibleCount += state.batchSize;
        renderChannels(true); // Append mode
    }

    function getTitle(filter) {
        if (filter === 'all') return 'All Channels';
        if (filter === 'favorites') return 'My Favorites';
        return filter; // Group name
    }

    function setActiveNav(activeBtn) {
        // Remove active class from all nav items (static and dynamic)
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        if (activeBtn) activeBtn.classList.add('active');
    }

    // --- Player Logic ---
    function openPlayer(channel) {
        const { url, name, group } = channel;

        elements.playerChannelName.innerText = name;
        elements.playerChannelGroup.innerText = group;
        elements.playerModal.classList.add('active');
        updatePlayerFavIcon(url);

        // Store current playing url for fav toggle
        elements.playerFavBtn.onclick = () => toggleFavorite(url);

        if (Hls.isSupported()) {
            if (hls) {
                hls.destroy();
            }
            hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(elements.videoPlayer);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                elements.videoPlayer.play().catch(e => console.log("Auto-play prevented", e));
            });

            // Handle HLS errors
            hls.on(Hls.Events.ERROR, function (event, data) {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.log("fatal network error encountered, try to recover");
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log("fatal media error encountered, try to recover");
                            hls.recoverMediaError();
                            break;
                        default:
                            hls.destroy();
                            break;
                    }
                }
            });

        } else if (elements.videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari / Native Support
            elements.videoPlayer.src = url;
            elements.videoPlayer.addEventListener('loadedmetadata', () => {
                elements.videoPlayer.play();
            });
        } else {
            alert("Your browser does not support HLS playback.");
        }
    }

    function closePlayer() {
        elements.playerModal.classList.remove('active');
        if (hls) {
            hls.destroy();
            hls = null;
        }
        elements.videoPlayer.pause();
        elements.videoPlayer.src = '';
    }

    // --- Reporting Logic ---
    function openReport(channel) {
        const modal = document.getElementById('report-modal');
        const nameEl = document.getElementById('report-channel-name');
        if (!modal || !nameEl) return;
        nameEl.textContent = channel.name + ' — ' + (channel.group || '');
        modal.dataset.url = channel.url || '';
        modal.classList.add('active');
    }

    function closeReport() {
        const modal = document.getElementById('report-modal');
        if (!modal) return;
        modal.classList.remove('active');
        delete modal.dataset.url;
        document.getElementById('report-notes').value = '';
        document.getElementById('report-reason').value = 'broken';
    }

    function submitReport() {
        const modal = document.getElementById('report-modal');
        if (!modal) return;
        const url = modal.dataset.url || '';
        const reason = document.getElementById('report-reason').value;
        const notes = document.getElementById('report-notes').value;

        const reports = JSON.parse(localStorage.getItem('iptv_reports') || '[]');
        reports.push({ url, reason, notes, time: Date.now() });
        localStorage.setItem('iptv_reports', JSON.stringify(reports));

        showToast('Report submitted — thank you', 'fa-flag');
        closeReport();
    }

    // --- Favorites Logic ---
    function toggleFavorite(url) {
        if (state.favorites.has(url)) {
            state.favorites.delete(url);
            showToast('Removed from Favorites', 'fa-heart-crack');
        } else {
            state.favorites.add(url);
            showToast('Added to Favorites', 'fa-heart');
        }

        localStorage.setItem('iptv_favorites', JSON.stringify([...state.favorites]));
        updatePlayerFavIcon(url);

        // If currently viewing favorites, re-render to remove it immediately? 
        // Or wait. Let's re-render if we are in 'favorites' view.
        if (state.currentFilter === 'favorites') {
            filterChannels();
        }
    }

    function updatePlayerFavIcon(url) {
        if (state.favorites.has(url)) {
            elements.playerFavBtn.classList.add('active');
            elements.playerFavBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
        } else {
            elements.playerFavBtn.classList.remove('active');
            elements.playerFavBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
        }
    }

    // --- Theme Logic ---
    function applyTheme() {
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(`${state.theme}-theme`);
        if (elements.themeIcon) {
            elements.themeIcon.className = state.theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
        }
    }

    function toggleTheme() {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('iptv_theme', state.theme);
        applyTheme();
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        // Navigation (Static items in horizontal bar)
        const allBtn = document.querySelector('.cat-pill[data-filter="all"]');
        if (allBtn) {
            allBtn.addEventListener('click', () => {
                document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
                allBtn.classList.add('active');
                state.currentFilter = 'all';
                filterChannels();
            });
        }

        // Search Toggle (Mobile/Desktop)
        if (elements.searchToggle) {
            elements.searchToggle.addEventListener('click', () => {
                elements.searchInput.classList.toggle('hidden');
                if (!elements.searchInput.classList.contains('hidden')) {
                    elements.searchInput.focus();
                }
            });
        }

        // Theme Toggle
        if (elements.themeToggle) {
            elements.themeToggle.addEventListener('click', toggleTheme);
        }

        // Search Input with Debounce
        let debounceTimer;
        elements.searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                filterChannels();
            }, 300); // 300ms delay
        });

        // Player Controls
        elements.closePlayerBtn.addEventListener('click', closePlayer);

        // Report Modal Controls
        const closeReportBtn = document.getElementById('close-report');
        const submitReportBtn = document.getElementById('submit-report');
        const reportModal = document.getElementById('report-modal');
        if (closeReportBtn) closeReportBtn.addEventListener('click', closeReport);
        if (submitReportBtn) submitReportBtn.addEventListener('click', submitReport);
        if (reportModal) {
            reportModal.addEventListener('click', (e) => {
                if (e.target === reportModal) closeReport();
            });
        }

        // Close on clicking outside modal content
        elements.playerModal.addEventListener('click', (e) => {
            if (e.target === elements.playerModal) closePlayer();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.playerModal.classList.contains('active')) {
                closePlayer();
            }
        });
    }
});
