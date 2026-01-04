import urllib.request
import re
import json
import os

# URLs to fetch
PLAYLISTS = [
    "https://iptv-org.github.io/iptv/countries/bd.m3u", # Bangladesh
    "https://iptv-org.github.io/iptv/countries/in.m3u", # India
    "https://iptv-org.github.io/iptv/categories/sports.m3u", # Sports
    "https://iptv-org.github.io/iptv/categories/news.m3u" # News
]

OUTPUT_FILE = "data/channels.json"

def parse_m3u(content):
    channels = []
    lines = content.splitlines()
    
    current_channel = {}
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if line.startswith("#EXTINF:"):
            # Parse directives
            # Example: #EXTINF:-1 tvg-id="BTV.bd" tvg-logo="url" group-title="News",BTV World
            
            # Reset current channel
            current_channel = {}
            
            # Extract Name (last part after comma)
            name_match = re.search(r',([^,]+)$', line)
            if name_match:
                current_channel["name"] = name_match.group(1).strip()
            else:
                current_channel["name"] = "Unknown Channel"

            # Extract Logo
            logo_match = re.search(r'tvg-logo="([^"]+)"', line)
            if logo_match:
                current_channel["logo"] = logo_match.group(1)
            else:
                current_channel["logo"] = ""
                
            # Extract Group
            group_match = re.search(r'group-title="([^"]+)"', line)
            if group_match:
                current_channel["group"] = group_match.group(1)
            else:
                # Infer group if missing or generic
                current_channel["group"] = "Others"

        elif not line.startswith("#"):
            # This is the URL
            if current_channel and "name" in current_channel:
                current_channel["url"] = line
                channels.append(current_channel)
                current_channel = {}
                
    return channels

def main():
    all_channels = []
    seen_urls = set()
    
    print("Starting channel update...")
    
    for url in PLAYLISTS:
        try:
            print(f"Fetching {url}...")
            with urllib.request.urlopen(url) as response:
                content = response.read().decode('utf-8')
                channels = parse_m3u(content)
                
                for ch in channels:
                    # Deduplication
                    if ch["url"] not in seen_urls:
                        # Optional: Filter only working protocols if needed, but HLS/JS handles most
                        all_channels.append(ch)
                        seen_urls.add(ch["url"])
                        
            print(f"Extracted {len(channels)} channels.")
            
        except Exception as e:
            print(f"Error fetching {url}: {e}")

    # Sort by Group then Name
    all_channels.sort(key=lambda x: (x.get("group", ""), x.get("name", "")))
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    # Write to JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_channels, f, indent=2)
        
    print(f"Successfully saved {len(all_channels)} channels to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
