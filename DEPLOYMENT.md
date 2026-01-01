# IPTV Network - Deployment & Setup Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Prepare Repository
```bash
# If not a git repo yet:
git init
git add .
git commit -m "Initial commit: Professional IPTV site"
```

### Step 2: Push to GitHub
```bash
# Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/iptvnetwork.github.io.git
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to repository **Settings**
2. Navigate to **Pages** (left sidebar)
3. Under "Build and deployment":
   - Source: Deploy from a branch
   - Branch: `main` / root
4. Click **Save**

### Step 4: Wait & Access
- GitHub will deploy automatically
- Site available at: `https://YOUR_USERNAME.github.io/iptvnetwork`
- Or if repo is named `iptvnetwork.github.io`: `https://iptvnetwork.github.io`

---

## 📋 What's Included

### Core Files
| File | Purpose |
|------|---------|
| `index.html` | Main page with responsive layout |
| `assets/css/style.css` | Professional styling |
| `assets/js/player.js` | HLS player + favorites + theme |
| `data/channels.json` | 75K+ channel list |

### SEO & Marketing
| File | Purpose |
|------|---------|
| `robots.txt` | SEO crawling rules |
| `sitemap.xml` | Search engine sitemap |
| `manifest.json` | PWA app manifest |
| `.well-known/security.txt` | Security policy |

### Server Config
| File | Purpose |
|------|---------|
| `.htaccess` | Caching, compression, security headers |
| `.github/workflows/deploy.yml` | CI/CD automation |
| `.gitignore` | Git configuration |

### Documentation
| File | Purpose |
|------|---------|
| `README.md` | User guide |
| `IMPROVEMENTS.md` | Technical details |
| `DEPLOYMENT.md` | This file |

---

## 🔧 Customization

### Change Site Title & Description
Edit `index.html` head section:
```html
<meta name="description" content="Your description here">
<title>Your Site Title</title>
```

### Modify Channel List
Update `data/channels.json`:
```json
[
  {
    "name": "Channel Name",
    "url": "https://stream.url/playlist.m3u8",
    "logo": "https://logo.url/image.png",
    "category": "Category Name"
  }
]
```

### Change Colors
Edit CSS variables in `assets/css/style.css`:
```css
:root {
  --bg: #0f1720;        /* Background */
  --accent: #1f8ef1;    /* Accent (blue) */
  --text: #e6eef6;      /* Text color */
  --muted: #9aa4ae;     /* Muted text */
}
```

### Update Domain
If using custom domain:
1. In repo Settings → Pages, add custom domain
2. Update manifest.json URLs
3. Update index.html og:url meta tag
4. Update robots.txt if hosted at subdomain

---

## ⚙️ Advanced Customization

### Add Google Analytics
Insert in `<head>` before `</head>`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Add Custom Logo/Favicon
Replace the inline SVG favicon in index.html:
```html
<link rel="icon" href="path/to/favicon.ico">
<!-- or -->
<link rel="icon" type="image/png" href="path/to/favicon.png">
```

### Use Custom Domain
1. Create `CNAME` file (no extension) with domain name:
   ```
   example.com
   ```
2. Push to GitHub
3. Configure DNS with hosting provider
4. Wait 24 hours for propagation

---

## 📊 SEO Setup

### Google Search Console
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your site
3. Upload `sitemap.xml` (auto-detected)
4. Monitor indexing status

### Bing Webmaster Tools
1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Add site
3. Submit sitemap

### Schema.org Validation
Test JSON-LD schema:
```bash
curl https://YOUR_SITE.com | grep -A5 "application/ld+json"
```

---

## 🔒 Security

### Existing Protections
✓ Security headers (.htaccess)
✓ HTTPS enforced by GitHub Pages
✓ No dynamic server (no SQL injection risk)
✓ CSP ready (add to .htaccess if needed)

### Additional Measures
1. Keep dependencies updated (no node_modules)
2. Monitor for XSS in user-generated content (if adding)
3. Use SRI hashes for external scripts
4. Regular security audits with OWASP

---

## 📈 Performance Optimization

### Already Included
✓ Image lazy loading
✓ GZIP compression
✓ Browser caching (1-month static)
✓ Minified CSS/JS
✓ CDN for HLS.js

### Further Improvements
1. **Optimize channel.json**: Reduce file size or split by category
2. **WebP images**: Convert logos to WebP with PNG fallback
3. **Service Worker**: Add offline support with workbox
4. **Edge caching**: Use Cloudflare or Netlify Edge
5. **Image CDN**: Use Imgix or Cloudinary for logos

### Check Performance
1. [Google PageSpeed Insights](https://pagespeed.web.dev/)
2. [GTmetrix](https://gtmetrix.com/)
3. Chrome DevTools → Lighthouse
4. WebPageTest.org

---

## 🧪 Testing

### Manual Testing
```bash
# Check HTML validity
# Use: https://validator.w3.org/

# Check Accessibility
# Use: WAVE browser extension or aXe

# Check SEO
# Use: SEOQuake or similar browser extension
```

### Browser Compatibility
| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 90+ | ✅ Full | HLS.js support |
| Firefox 88+ | ✅ Full | HLS.js support |
| Safari 14+ | ✅ Full | Native HLS |
| Edge 90+ | ✅ Full | HLS.js support |
| Mobile Safari | ✅ Full | Native HLS |
| Chrome Mobile | ✅ Full | HLS.js support |

---

## 📞 Troubleshooting

### Site not showing after push
- Wait 5 minutes for GitHub Actions to complete
- Check Settings → Pages → Deployment status
- Verify branch is `main` and path is `root` (/)

### 404 errors on subpath
- GitHub Pages requires repo name in URL if not `username.github.io`
- Update asset paths if hosting at subdirectory

### Styles not loading
- Check browser DevTools → Network tab
- Ensure `assets/css/style.css` path is correct
- Clear browser cache (Ctrl+Shift+Delete)

### HLS playback failing
- Check network tab for 403/404 on .m3u8 files
- Verify stream URL is still active
- Check CORS headers from stream provider

### Search not working
- Check browser console for errors (F12)
- Verify `data/channels.json` is valid JSON
- Check Network tab: channels.json should return 200

---

## 📚 Resources

- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [HLS.js Documentation](https://github.com/video-dev/hls.js)
- [Web Accessibility WCAG](https://www.w3.org/WAI/WCAG21/quickref/)
- [JSON-LD Validator](https://validator.schema.org/)
- [SEO Best Practices](https://developers.google.com/search/docs)

---

## 🎯 Next Level (Optional)

### Features to Add
- [ ] Channel categories with filtering
- [ ] Search history with localStorage
- [ ] Recently watched list
- [ ] Shareable links with preview
- [ ] Playlist import (.m3u support)
- [ ] EPG (Electronic Program Guide)
- [ ] Multiple player modes (HLS, DASH, etc.)

### Infrastructure
- [ ] Backend API for dynamic channels
- [ ] Database (Firebase, Supabase)
- [ ] Admin panel for channel management
- [ ] User accounts & sync
- [ ] Comments/ratings system

---

**Last Updated**: January 1, 2026  
**Version**: 1.0.0  
**Status**: ✅ Ready to Deploy
