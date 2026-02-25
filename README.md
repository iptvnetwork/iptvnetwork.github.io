# IPTV Network

![IPTV Network Banner](assets/images/og-image.jpg)

**IPTV Network** is a premium, open-source web application for watching live television channels from around the world. Built with vanilla, modern web technologies, it offers a fast, responsive, and app-like experience for streaming news, sports, entertainment, and more.

## 🚀 Features

-   **Premium UI/UX**: Dark mode, glassmorphism design, and smooth animations.
-   **Live Streaming**: High-quality HLS streaming support (`.m3u8`).
-   **Channel Organization**: Filter by categories (News, Sports, Kids, etc.).
-   **Search**: Instant, real-time search for channels.
-   **Favorites**: Save your most-watched channels for quick access (persisted locally).
-   **PWA Support**: Installable on Desktop and Mobile.
-   **Responsive**: Optimized for all screen sizes.

## 🛠️ Technology Stack

-   **HTML5**: Semantic structure.
-   **CSS3**: Custom design system with CSS Variables, Flexbox, Grid, and Animations.
-   **JavaScript (ES6+)**: Core application logic.
-   **HLS.js**: For streaming HLS content in modern browsers.
-   **FontAwesome**: For icons.

## 🏁 Getting Started

To run this project locally, you don't need any build tools or package managers.

1.  **Clone the repository**
    ```bash
    git clone https://github.com/iptvnetwork/iptvnetwork.github.io.git
    ```

2.  **Open the project**
    Simply open the `index.html` file in your web browser.
    
    *Recommended: Use a local server like Live Server (VS Code extension) or Python's http.server for the best experience (especially for PWA features).*
    ```bash
    # Python 3 example
    python -m http.server 8000
    ```
    Then visit `http://localhost:8000`.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and suggest improvements.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This project is for educational purposes only. The channel links provided in `data/channels.json` may be subject to copyright and are collected from publicly available sources on the internet. We do not host any content.

If you believe a channel listed here infringes rights or is not permitted to be published, please use the in-app "Report Channel" flow (click the report button on a channel card) or open an issue explaining the problem. Reported items are reviewed and removed when appropriate.
