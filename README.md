# IPTV Network

Professional-grade IPTV streaming platform for GitHub Pages with modern UX, SEO optimization, and performance enhancements.

## Features

✨ **Core Features**
- 🎬 Browse thousands of live channels with logos
- 🔍 Real-time channel search and filtering
- 📱 Fully responsive mobile-first design
- 🌙 Dark/light theme toggle with persistence
- ❤️ Favorites list with local storage
- 🎥 HLS.js video player with fallback support
- ♿ WCAG accessibility compliance
- ⚡ Optimized performance & SEO

## Quick Deploy to GitHub Pages

1. Push to GitHub:
   ```bash
   git push origin main
   ```

2. Enable Pages in repo Settings:
   - Go to **Settings → Pages**
   - Set source to `main` branch (root)
   - Click Save

3. Site available at: `https://yourusername.github.io/iptvnetwork/`

## Performance

- **Image optimization**: Lazy loading, inline SVG placeholders
- **Network**: Preload critical resources, DNS prefetch CDN
- **Caching**: 1-month browser cache for static assets, 1-hour for data
- **Compression**: GZIP enabled via .htaccess
- **Code**: Minified CSS/JS, IIFE module pattern, debounced search
- **SEO**: Meta tags, Open Graph, JSON-LD schema, sitemap.xml

## SEO

- Meta descriptions and keywords
- Open Graph cards (Twitter, Facebook)
- Semantic HTML5 with ARIA labels
- Schema.org WebApplication type
- robots.txt and sitemap.xml
- Canonical URL
- 44px+ touch targets for mobile

## Accessibility

- Skip-to-main-content link
- ARIA live regions for updates
- Keyboard navigation (Tab, Enter, Space)
- Focus indicators
- Color contrast compliant
- Reduced motion media query support
- Semantic HTML (header, main, footer, aside)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## File Structure

```
/
├── index.html              Main page
├── .htaccess              Apache caching & security
├── robots.txt             SEO crawling rules
├── sitemap.xml            SEO sitemap
├── README.md              This file
├── assets/
│   ├── css/
│   │   └── style.css     Enhanced styles with responsive design
│   └── js/
│       └── player.js      HLS player with favorites & theme toggle
└── data/
    └── channels.json      Stream catalog (75K+ channels)
```

## Customization

### Theme Colors
Edit CSS variables in `assets/css/style.css`:
```css
:root {
  --bg: #0f1720;
  --accent: #1f8ef1;
  --text: #e6eef6;
}
```

### Channel Data
Update `data/channels.json` with your own channels or integrate an API.

## Performance Tips

1. **Optimize channel logos**: Use WebP or compress PNG/JPG
2. **CDN**: Host from a CDN if serving large files
3. **Minify**: Minify CSS/JS for production
4. **Analytics**: Add Google Analytics via GTM or direct script injection
5. **Service Worker**: Consider adding for offline support

## License

Public Domain - Use freely.

## Support

For issues or improvements, submit a GitHub issue or fork and contribute.

