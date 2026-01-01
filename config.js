/**
 * IPTV Configuration File
 * Customize your IPTV application here
 */

const IPTV_CONFIG = {
    // App Settings
    app: {
        name: "IPTV Network",
        version: "1.0.0",
        description: "Professional Live TV Streaming Platform"
    },

    // Theme Colors
    theme: {
        primary: "#00d4ff",
        primaryDark: "#0099cc",
        backgroundDark: "#0a0e27",
        backgroundDarker: "#050815",
        surfaceDark: "#1a1f3a",
        textLight: "#e0e0e0",
        textMuted: "#9ca3af",
        borderColor: "#2a3055",
        successColor: "#10b981",
        warningColor: "#f59e0b",
        errorColor: "#ef4444"
    },

    // Feature Flags
    features: {
        search: true,
        themeToggle: true,
        categoryFilter: true,
        videoControls: true,
        fullscreen: true,
        serviceWorker: true,
        pwa: true,
        analytics: false
    },

    // Storage Settings
    storage: {
        themeKey: "iptv-theme",
        recentChannelsKey: "iptv-recent",
        favoritesKey: "iptv-favorites",
        maxRecentChannels: 10
    },

    // API Settings
    api: {
        channelsUrl: "https://iptvnetwork.github.io/data/channels.json",
        timeout: 10000,
        retryAttempts: 3
    },

    // Player Settings
    player: {
        autoplay: true,
        controls: true,
        preload: "metadata",
        controlsList: "nodownload",
        timeout: 30000
    },

    // UI Settings
    ui: {
        animationDuration: 300,
        itemsPerPage: 20,
        searchDebounce: 300
    },

    // Social Media Links
    social: {
        github: "https://github.com/iptvnetwork",
        twitter: "https://twitter.com/iptvnetwork",
        discord: "https://discord.gg/iptvnetwork"
    },

    // Contact
    contact: {
        email: "info@iptvnetwork.github.io",
        website: "https://iptvnetwork.github.io"
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IPTV_CONFIG;
}
