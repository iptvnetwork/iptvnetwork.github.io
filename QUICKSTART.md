# IPTV Network - Quick Start Guide

## 📋 What You Get

A complete, professional IPTV streaming platform with:
- ✨ Modern UI with dark/light theme
- 📱 Fully responsive design
- 🎬 HTML5 video player with full controls
- 🔍 Search and category filtering
- 📺 Channel grid display with logos
- 🌐 PWA (Progressive Web App) support
- 🚀 Optimized for GitHub Pages
- 💾 Local storage preferences
- 🔐 Secure streaming

## 🚀 Getting Started in 5 Minutes

### Step 1: Create GitHub Repository
1. Go to [github.com](https://github.com) and sign in
2. Click **New repository**
3. Name it: `yourusername.github.io`
4. **Important**: Replace `yourusername` with your actual GitHub username
5. Click **Create repository**

### Step 2: Upload Files
**Option A - Using Web Interface:**
1. Click "Add file" → "Upload files"
2. Drag and drop all files from this project
3. Commit with message "Initial IPTV setup"

**Option B - Using Git:**
```bash
git clone https://github.com/yourusername/iptvnetwork.github.io.git
cd iptvnetwork.github.io
# Copy all files from this project
git add .
git commit -m "Initial IPTV setup"
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to repository **Settings**
2. Select **Pages** (left sidebar)
3. Under "Build and deployment":
   - Source: **Deploy from a branch**
   - Branch: **main** (or master)
   - Folder: **/ (root)**
4. Click **Save**

### Step 4: Your IPTV is Live!
After 1-2 minutes, visit: `https://yourusername.github.io`

## 📝 Adding Your Channels

### Option 1: Edit Online (Easiest)
1. Go to your GitHub repository
2. Open `data/channels.json`
3. Click the edit (pencil) icon
4. Add your channels in this format:
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
5. Commit your changes

### Option 2: Add from M3U Playlist
You can convert your M3U playlist to JSON format by:
1. Save your M3U file
2. Use this online converter: [m3u-to-json-converter](#)
3. Replace `channels.json` content with the result

### Channel Requirements
- **name**: Channel display name
- **group**: Category (News, Sports, Entertainment, etc.)
- **logo**: Image URL (recommended 200×150px)
- **url**: HLS stream URL (ends with .m3u8)

## 🎨 Customizing Your IPTV

### Change the Color Scheme
1. Open `css/style.css`
2. Find the `:root` section (top of file)
3. Change these colors:
```css
:root {
    --primary-color: #00d4ff;      /* Main cyan accent */
    --background-dark: #0a0e27;    /* Dark background */
    --surface-dark: #1a1f3a;       /* Card background */
    --text-light: #e0e0e0;         /* Text color */
}
```

### Update Your Branding
1. Open `index.html`
2. Find the logo section and replace:
```html
<div class="logo">
    <i class="fas fa-tv"></i>
    <h1>Your IPTV Name</h1>
</div>
```

### Update Metadata (SEO)
In `index.html` `<head>` section:
```html
<meta name="description" content="Your description">
<meta property="og:title" content="Your Title">
<title>Your IPTV - Your Tagline</title>
```

## 🔧 Configuration

Edit `config.js` to customize:
- App name and version
- Theme colors
- Feature toggles
- Player settings
- UI animations

## 📂 File Structure Explained

```
├── index.html          Main page
├── css/
│   └── style.css       All styling (easily customizable)
├── js/
│   └── app.js          Main application logic
├── data/
│   └── channels.json   Your channels (update this!)
├── config.js           Configuration file
├── manifest.json       PWA manifest
├── sw.js               Service worker (offline support)
├── README.md           Documentation
├── DEPLOYMENT.md       Detailed deployment guide
└── package.json        Project metadata
```

## 🎯 Features Explained

### 🔍 Search
- Click the search icon
- Type channel name or category
- Results update in real-time
- Press Escape to close

### 🎨 Theme Toggle
- Click the moon/sun icon
- Switches between dark/light mode
- Preference is saved automatically

### 📂 Categories
- Click category buttons to filter
- Shows channels from selected category
- "All Channels" resets filter

### ▶️ Video Player
- Click any channel to open player
- Use standard video controls
- Fullscreen for immersive experience
- Related channels shown below video

## 💡 Pro Tips

### Finding Streams
1. Search for "m3u playlist [country]"
2. Test URLs in VLC player first
3. Use only HLS/M3U8 format streams
4. Many streams require headers (User-Agent)

### Optimizing Performance
1. Compress channel logos (use TinyPNG)
2. Host logos on free CDN (Cloudinary, Imgix)
3. Use adaptive bitrate streams
4. Test streams before adding

### Improving SEO
1. Update meta descriptions
2. Submit sitemap to Google
3. Use relevant keywords
4. Add schema.org markup

## 🌐 Using a Custom Domain

### With Namecheap/GoDaddy:
1. Buy your domain
2. Add these DNS records:
   - A record: 185.199.108.153
   - A record: 185.199.109.153
   - A record: 185.199.110.153
   - A record: 185.199.111.153
   - CNAME: yourusername.github.io

3. In GitHub settings → Pages:
   - Add custom domain
   - Enable HTTPS
   - Wait 24 hours

## 🐛 Troubleshooting

### "Site not found"
- Check repo name is `yourusername.github.io`
- Verify Pages is enabled in settings
- Wait 2-3 minutes for deployment

### Changes not showing
- Clear browser cache (Ctrl+Shift+Del)
- Wait 1-2 minutes
- Check GitHub Actions for errors

### Streams not playing
- Test URL in VLC player
- Ensure stream is HLS (.m3u8)
- Check browser console (F12) for errors
- Some streams may be geo-restricted

### Images not loading
- Check image URLs are valid
- Ensure images are publicly accessible
- Use HTTPS URLs (not HTTP)
- Compress large images

## 📊 Analytics

To track visitors:
1. Create Google Analytics account
2. Add this to `<head>` in index.html:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🔒 Security Notes

- All code runs client-side (no server needed)
- No data uploaded to external servers
- Theme preference saved locally
- Streams are public URLs

## 🚀 Advanced Features

### Service Worker (Offline Mode)
Automatically caches assets for offline access

### PWA Support
- Install as app on home screen
- Works offline
- Fast load times

### Responsive Design
- Works on phones, tablets, desktops
- Touch-friendly controls
- Adapts to any screen size

## 📞 Support & Resources

- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [HTML5 Video](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video)
- [HLS Streaming](https://en.wikipedia.org/wiki/HTTP_Live_Streaming)
- [Web Development Guide](https://developer.mozilla.org/)

## 📜 License

This project is open source and free to use!

---

## ✅ Deployment Checklist

Before going live:
- [ ] Created GitHub repository
- [ ] Uploaded all files
- [ ] Enabled GitHub Pages
- [ ] Added channels to JSON
- [ ] Tested channels play correctly
- [ ] Customized colors/branding
- [ ] Updated SEO metadata
- [ ] Tested on mobile
- [ ] Verified custom domain (if using)

## 🎉 Next Steps

1. **Add More Channels**: Update `data/channels.json`
2. **Customize Look**: Edit `css/style.css` and colors
3. **Add Your Domain**: Configure custom domain in settings
4. **Share Your IPTV**: Spread the word!
5. **Monitor Analytics**: Track your viewers

---

**Congratulations! Your professional IPTV is ready!** 📺✨

For detailed deployment guide, see: [DEPLOYMENT.md](DEPLOYMENT.md)
For more info, read: [README.md](README.md)
