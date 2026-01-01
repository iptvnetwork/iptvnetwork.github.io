# IPTV Network

Simple static IPTV site for GitHub Pages. This repository serves `index.html`, `assets/` and `data/channels.json`.

Quick start

1. Push this repository to GitHub.
2. In repository Settings → Pages, set source to the `main` branch (root) or `gh-pages` branch.
3. Open the published URL — the site will load `data/channels.json` and list channels.

Notes

- Streams in `data/channels.json` are remote HLS (`.m3u8`) URLs — browser compatibility depends on HLS support.
- For best playback on non-Safari browsers the site uses Hls.js (included via CDN).
