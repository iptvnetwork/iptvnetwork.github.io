# IPTV Network

A professional, modern IPTV (Internet Protocol Television) streaming platform built with HTML5, CSS3, and JavaScript. Easily deploy on GitHub Pages.

## Features

✨ **Modern UI/UX**
- Dark and light theme support
- Responsive design (mobile, tablet, desktop)
- Smooth animations and transitions
- Professional color scheme with cyan accents

📺 **Channel Management**
- Organized by categories
- Search functionality
- Fast channel switching
- Channel logos and metadata

▶️ **Video Player**
- HTML5 video player
- Custom controls
- Volume control
- Fullscreen support
- Time tracking
- Play/Pause functionality

📱 **Mobile Optimized**
- Touch-friendly interface
- Responsive grid layout
- Mobile player optimized
- Bottom sheet player on mobile

🔍 **Search & Filter**
- Real-time search
- Category filtering
- Combined search and filter
- Auto-suggestions

🌐 **PWA Features**
- Service Worker support
- Offline capability
- Installable on home screen
- Fast load times

🎨 **Customization**
- Easy to modify colors
- CSS variables for theming
- Responsive breakpoints
- Professional animations

## Folder Structure

```
iptvnetwork.github.io/
├── index.html              # Main HTML file
├── manifest.json          # PWA manifest
├── sw.js                  # Service Worker
├── css/
│   └── style.css          # All styles
├── js/
│   └── app.js             # Main application
└── data/
    └── channels.json      # Channel database
```

## Getting Started

### 1. Clone or Download
```bash
git clone https://github.com/yourusername/iptvnetwork.github.io.git
cd iptvnetwork.github.io
```

### 2. Update Channel Data
Edit `data/channels.json` with your channels:

```json
[
  {
    "name": "Channel Name",
    "group": "Category",
    "logo": "https://example.com/logo.png",
    "url": "https://example.com/stream.m3u8"
  }
]
```

### 3. Deploy on GitHub Pages

#### Option A: Using GitHub Web Interface
1. Go to your GitHub repository settings
2. Enable GitHub Pages
3. Set source to main branch
4. Your site will be live at `https://yourusername.github.io`

#### Option B: Using Git Command Line
```bash
git add .
git commit -m "Initial IPTV setup"
git push origin main
```

### 4. Access Your IPTV
Open your browser and go to `https://yourusername.github.io`

## Configuration

### Customize Colors
Edit CSS variables in `css/style.css`:

```css
:root {
    --primary-color: #00d4ff;      /* Main accent color */
    --primary-dark: #0099cc;       /* Darker shade */
    --background-dark: #0a0e27;    /* Main background */
    --surface-dark: #1a1f3a;       /* Card background */
    --text-light: #e0e0e0;         /* Text color */
}
```

### Add Your Logo
Replace the logo text in `index.html`:

```html
<div class="logo">
    <img src="your-logo.png" alt="Logo" style="width: 50px; height: 50px;">
    <h1>Your IPTV</h1>
</div>
```

### Customize Metadata
Update SEO tags in `index.html`:

```html
<meta name="description" content="Your description">
<meta property="og:image" content="your-image.png">
<title>Your IPTV Title</title>
```

## Channel Data Format

Each channel in `channels.json` requires:

- **name** (string): Channel name
- **group** (string): Category (e.g., "News", "Sports", "Entertainment")
- **logo** (string): Channel logo URL (recommended: 200x150px)
- **url** (string): M3U8 stream URL (HLS format)

Example:
```json
{
  "name": "BTV",
  "group": "BANGLA",
  "logo": "https://example.com/btv-logo.png",
  "url": "https://example.com/stream/btv.m3u8"
}
```

## Features Explained

### 🔍 Search
Click the search icon to find channels by name or category. Results update in real-time.

### 🎨 Theme Toggle
Click the theme icon to switch between dark and light modes. Your preference is saved locally.

### 📂 Categories
Click category buttons to filter channels by group. "All Channels" shows everything.

### ▶️ Video Player
- Click any channel to open the player
- Use video controls to play, pause, adjust volume
- Click fullscreen to expand to full screen
- Related channels appear below the player

### 📱 Mobile Features
- Bottom sheet player on small screens
- Touch-friendly controls
- Responsive grid that adapts to screen size

## Tips for Best Results

1. **Stream Quality**: Use HLS (M3U8) format streams for best compatibility
2. **Channel Logos**: Keep logo files optimized (200x150px, <100KB)
3. **Stream Testing**: Test streams before adding to channels.json
4. **Updates**: Add new channels by updating channels.json and pushing to GitHub

## Troubleshooting

### Streams Not Playing
- Check if stream URL is valid and accessible
- Ensure stream is in HLS (M3U8) format
- Check browser console for CORS errors
- Some streams may have geographic restrictions

### Slow Loading
- Optimize logo images
- Use CDN for channel logos
- Enable browser caching
- Check internet connection

### GitHub Pages Not Updating
- Clear browser cache
- Wait 1-2 minutes for GitHub Pages to rebuild
- Check Actions tab for deployment status
- Ensure files are committed and pushed

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimization

- Lazy loading for channel images
- Service Worker caching
- Minimized CSS and JavaScript
- Responsive image sizing
- Efficient DOM updates

## Security Notes

- No user data is stored on servers
- All data stored locally in browser
- Theme preference saved to localStorage
- Stream URLs are public (security through obscurity not used)

## License

This project is open source and available for personal and educational use.

## Contributing

Feel free to fork, modify, and improve this IPTV platform!

## Support

For issues, improvements, or questions:
1. Check the troubleshooting section
2. Review your channels.json format
3. Check browser console for errors
4. Test in different browsers

---

**Enjoy your professional IPTV platform!** 📺✨
