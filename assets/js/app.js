document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    const state = {
        channels: [],
        filteredChannels: [],
        groups: new Set(),
        currentFilter: 'all', // 'all', 'favorites', or specific group name
        favorites: new Set(JSON.parse(localStorage.getItem('iptv_favorites')) || []),
        theme: localStorage.getItem('iptv_theme') || 'dark'
    };

    // --- DOM Elements ---
    const elements = {
        grid: document.getElementById('channel-grid'),
        groupList: document.getElementById('group-list'),
        searchInput: document.getElementById('search-input'),
        viewTitle: document.getElementById('current-view-title'),
        channelCount: document.getElementById('channel-count'),
        playerModal: document.getElementById('player-modal'),
        videoPlayer: document.getElementById('video-player'),
        closePlayerBtn: document.getElementById('close-player'),
        playerChannelName: document.getElementById('player-channel-name'),
        playerChannelGroup: document.getElementById('player-channel-group'),
        playerChannelName: document.getElementById('player-channel-name'),
        playerChannelGroup: document.getElementById('player-channel-group'),
        playerFavBtn: document.getElementById('player-fav-btn'),
        navItems: document.querySelectorAll('.nav-item'),
        toastContainer: null, // Will be created dynamically
        themeToggle: document.getElementById('theme-toggle'),
        themeIcon: document.querySelector('#theme-toggle i')
    };

    let hls = null;

    // --- Initialization ---
    init();

    async function init() {
        createToastContainer();
        applyTheme();
        renderSkeletons(); // Show loading state

        try {
            // Simulate network delay for premium feel (optional, removing helps speed but skeleton looks nice)
            // await new Promise(r => setTimeout(r, 800)); 

            await fetchChannels();
            renderGroups();
            filterChannels(); // Initial render
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
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;

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
        // Assuming data is in data/channels.json relative to index.html
        const response = await fetch('data/channels.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        state.channels = data.map((channel, index) => ({
            ...channel,
            id: index, // Assign a temporary ID for easy reference
            group: channel.group || 'Others' // Ensure group exists
        }));

        // Extract unique groups
        state.channels.forEach(ch => state.groups.add(ch.group));
    }

    // --- Rendering ---
    function renderGroups() {
        elements.groupList.innerHTML = '';
        const sortedGroups = Array.from(state.groups).sort();

        sortedGroups.forEach(group => {
            const btn = document.createElement('button');
            btn.className = 'nav-item';
            btn.dataset.filter = group;
            btn.innerHTML = `<i class="fa-solid fa-layer-group"></i> <span>${group}</span>`;

            btn.addEventListener('click', (e) => {
                // Prevent event from bubbling if using inside a drawer
                e.stopPropagation();

                // Remove active class from all other buttons (including static ones)
                document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                state.currentFilter = group;
                filterChannels();
            });
            elements.groupList.appendChild(btn);
        });
    }

    function renderChannels() {
        elements.grid.innerHTML = '';
        elements.viewTitle.innerText = getTitle(state.currentFilter);
        elements.channelCount.innerText = `${state.filteredChannels.length} channels`;

        if (state.filteredChannels.length === 0) {
            elements.grid.innerHTML = '<div class="no-results">No channels found.</div>';
            return;
        }

        const fragment = document.createDocumentFragment();

        state.filteredChannels.forEach(channel => {
            const card = document.createElement('div');
            card.className = 'channel-card';

            // Handle logo: default fallback if empty or error
            const logoUrl = channel.logo ? channel.logo : 'assets/images/default-tv.png';

            card.innerHTML = `
                <div class="card-image">
                    <img src="${logoUrl}" alt="${channel.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/150?text=${encodeURIComponent(channel.name)}'">
                </div>
                <div class="card-info">
                    <div class="card-name" title="${channel.name}">${channel.name}</div>
                    <div class="card-group">${channel.group}</div>
                </div>
            `;

            card.addEventListener('click', () => openPlayer(channel));
            fragment.appendChild(card);
        });

        elements.grid.appendChild(fragment);
    }

    // --- Filtering Logic ---
    function filterChannels() {
        const query = elements.searchInput.value.toLowerCase();

        state.filteredChannels = state.channels.filter(ch => {
            // Text Search
            const matchesSearch = ch.name.toLowerCase().includes(query) ||
                ch.group.toLowerCase().includes(query);

            if (!matchesSearch) return false;

            // Category Filter
            if (state.currentFilter === 'all') return true;
            if (state.currentFilter === 'favorites') return state.favorites.has(ch.url); // Use URL as unique key for favs
            return ch.group === state.currentFilter;
        });

        renderChannels();
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
        // Navigation (Static items: All Channels, Favorites)
        elements.navItems.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                state.currentFilter = btn.dataset.filter;
                filterChannels();
            });
        });

        // Theme Toggle
        if (elements.themeToggle) {
            elements.themeToggle.addEventListener('click', toggleTheme);
        }

        // Search
        elements.searchInput.addEventListener('input', () => {
            filterChannels();
        });

        // Player Controls
        elements.closePlayerBtn.addEventListener('click', closePlayer);

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
