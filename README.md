# IPTV Network

This repository hosts a simple, professional-looking static IPTV directory and player designed for GitHub Pages.

How to deploy

- Commit and push this repository to GitHub in a repository named `iptvnetwork.github.io` (your site will be served at `https://iptvnetwork.github.io/`).
- GitHub Pages serves files from the repository root for this naming pattern — no additional configuration required.

Notes

- Streams are loaded directly from the URLs in `data/channels.json`.
- HLS playback uses `hls.js` for browsers that do not support native HLS.
