# IPTV Network GitHub Pages Deployment Guide

## Quick Start Deployment

### Step 1: GitHub Account Setup
1. If you don't have GitHub, go to [github.com](https://github.com) and create an account
2. Create a new repository named `yourusername.github.io`
   - Replace `yourusername` with your actual GitHub username
   - **Important**: The repository name must follow this exact format

### Step 2: Repository Settings
1. Go to your repository settings
2. Navigate to **Pages** section (left sidebar)
3. Select **Source**: Deploy from a branch
4. Select **Branch**: main (or master)
5. Select **Folder**: / (root)
6. Click **Save**

### Step 3: Push Your Files
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial IPTV Network setup"

# Add remote origin (replace username)
git remote add origin https://github.com/yourusername/iptvnetwork.github.io.git

# Push to GitHub
git push -u origin main
```

### Step 4: Access Your IPTV
After 1-2 minutes, your IPTV will be live at:
```
https://yourusername.github.io
```

## Adding Custom Domain

### Option 1: Using Namecheap (or similar domain registrar)
1. Buy your domain
2. Go to DNS settings
3. Add these DNS records:
   - Type: A
   - Value: 185.199.108.153
   - Value: 185.199.109.153
   - Value: 185.199.110.153
   - Value: 185.199.111.153

4. Add CNAME record:
   - Type: CNAME
   - Value: yourusername.github.io

5. In your repository settings → Pages:
   - Enter custom domain: yourdomain.com
   - Enable HTTPS

Wait 24 hours for DNS propagation.

### Option 2: Using GitHub's Default Domain
Simply use: `https://yourusername.github.io`

## Updating Channels

### Method 1: GitHub Web Editor (Easiest)
1. Go to your repository
2. Click on `data/channels.json`
3. Click the edit button (pencil icon)
4. Make your changes
5. Commit changes with message

### Method 2: Git Command Line
```bash
# Edit channels.json with your editor
# Then:
git add data/channels.json
git commit -m "Update channels"
git push
```

### Method 3: Bulk Import from M3U
Create a script to convert M3U playlists to JSON:

```javascript
// Convert M3U to JSON
function m3uToJson(m3uContent) {
    const lines = m3uContent.split('\n');
    const channels = [];
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXTINF')) {
            const nameMatch = lines[i].match(/,(.+)$/);
            const logoMatch = lines[i].match(/tvg-logo="([^"]+)"/);
            const groupMatch = lines[i].match(/group-title="([^"]+)"/);
            
            const channel = {
                name: nameMatch ? nameMatch[1].trim() : 'Unknown',
                group: groupMatch ? groupMatch[1] : 'Other',
                logo: logoMatch ? logoMatch[1] : 'https://via.placeholder.com/200x150',
                url: lines[i + 1]?.trim() || ''
            };
            
            channels.push(channel);
            i++;
        }
    }
    
    return channels;
}
```

## Customization Checklist

- [ ] Change primary color in `css/style.css`
- [ ] Update logo/branding in `index.html`
- [ ] Add your channels to `data/channels.json`
- [ ] Update README.md with your information
- [ ] Change sitemap.xml domain
- [ ] Update robots.txt domain
- [ ] Update package.json author and repository

## SSL Certificate

GitHub Pages automatically provides free SSL/HTTPS certificates. No additional setup needed!

## Performance Tips

1. **Optimize Images**
   - Compress channel logos
   - Use PNG or WebP format
   - Keep size under 100KB per image

2. **Use CDN for Logos**
   - Host logos on Cloudinary, Imgix, or similar
   - Examples:
     - cloudinary.com
     - imgix.com
     - tinypng.com

3. **Stream Quality**
   - Use adaptive bitrate (HLS M3U8)
   - Test streams before adding
   - Use reliable streaming providers

## SEO Optimization

1. Update meta tags in `index.html`:
```html
<meta name="description" content="Your description">
<meta property="og:title" content="Your Title">
<meta property="og:description" content="Your description">
<meta property="og:image" content="preview.jpg">
```

2. Submit sitemap to Google Search Console:
   - Visit: google.com/webmasters
   - Add property
   - Submit sitemap: yourdomain.com/sitemap.xml

3. Update robots.txt with correct domain

## Troubleshooting Deployment

### Site not loading
- [ ] Check repository name format: `username.github.io`
- [ ] Verify GitHub Pages is enabled in settings
- [ ] Check branch is `main` or `master`
- [ ] Clear browser cache (Ctrl+Shift+Del)

### Changes not showing
- [ ] Wait 1-2 minutes for GitHub to rebuild
- [ ] Check Actions tab for deployment status
- [ ] Clear browser cache completely
- [ ] Try different browser

### Custom domain not working
- [ ] Verify DNS records (takes 24-48 hours)
- [ ] Check HTTPS is enabled
- [ ] Ensure domain is verified in settings
- [ ] Use DNS propagation checker tool

### Streams not playing
- [ ] Test stream URL in VLC player first
- [ ] Verify stream is HLS/M3U8 format
- [ ] Check for CORS errors in browser console
- [ ] Ensure stream is publicly accessible

## Monitoring & Analytics

### Add Google Analytics
1. Create account at analytics.google.com
2. Add this to `<head>` in index.html:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

### Monitor Errors
Check browser console (F12) for JavaScript errors and fix issues.

## Backup & Version Control

```bash
# Create backup branch
git checkout -b backup
git push origin backup

# Switch back to main
git checkout main

# View change history
git log --oneline
```

## Advanced Features

### CloudFlare Integration (Free)
1. Go to cloudflare.com
2. Add your domain
3. Update nameservers at registrar
4. Get free DDoS protection and faster CDN

### GitHub Actions for Auto-Deployment
Create `.github/workflows/deploy.yml` for automated deployments.

## Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [HTML5 Video Reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video)
- [HLS Streaming Guide](https://en.wikipedia.org/wiki/HTTP_Live_Streaming)
- [CSS Variables Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)

## Support

- GitHub Community: [github.com/community](https://github.community)
- Stack Overflow: [stackoverflow.com/tags/github-pages](https://stackoverflow.com/tags/github-pages)
- Documentation: [pages.github.com](https://pages.github.com)

---

**Your IPTV is now live!** 🎉📺
