import re
import json
import os
import time
from datetime import datetime

try:
    import requests
    from requests.adapters import HTTPAdapter
    from requests.packages.urllib3.util.retry import Retry
except Exception:
    print("Please install 'requests' (pip install requests) to run this updater.")
    raise

# Playlists to fetch
PLAYLISTS = [
    ("https://iptv-org.github.io/iptv/countries/bd.m3u", "bd"),
    ("https://iptv-org.github.io/iptv/countries/in.m3u", "in"),
    ("https://iptv-org.github.io/iptv/categories/sports.m3u", "sports"),
    ("https://iptv-org.github.io/iptv/categories/news.m3u", "news")
]

OUTPUT_FILE = "data/channels.json"
VALID_OUTPUT = "data/channels.valid.json"

session = requests.Session()
retries = Retry(total=2, backoff_factor=0.5, status_forcelist=[500, 502, 503, 504])
session.mount('https://', HTTPAdapter(max_retries=retries))
session.mount('http://', HTTPAdapter(max_retries=retries))


def parse_m3u(content, source_label):
    channels = []
    lines = content.splitlines()
    current_channel = {}

    for line in lines:
        line = line.strip()
        if not line:
            continue

        if line.startswith('#EXTINF:'):
            current_channel = {}
            name_match = re.search(r',([^,]+)$', line)
            current_channel['name'] = name_match.group(1).strip() if name_match else 'Unknown Channel'

            logo_match = re.search(r'tvg-logo="([^"]+)"', line)
            current_channel['logo'] = logo_match.group(1) if logo_match else ''

            group_match = re.search(r'group-title="([^"]+)"', line)
            current_channel['group'] = group_match.group(1) if group_match else 'Others'
            current_channel['source'] = source_label

        elif not line.startswith('#'):
            if current_channel and 'name' in current_channel:
                current_channel['url'] = line
                channels.append(current_channel)
                current_channel = {}

    return channels


def check_url(url, timeout=8):
    """Check if URL is likely a working HLS stream. Returns dict with status info."""
    info = {'url': url, 'status': 'unknown', 'working': False, 'http_status': None, 'content_type': None}
    try:
        # HEAD first
        resp = session.head(url, allow_redirects=True, timeout=timeout)
        info['http_status'] = resp.status_code
        ct = resp.headers.get('Content-Type', '')
        info['content_type'] = ct
        if resp.status_code == 200 and ('mpegurl' in ct or 'application/vnd.apple.mpegurl' in ct or 'vnd.apple' in ct or '.m3u8' in url):
            info['working'] = True
            info['status'] = 'ok'
            return info

        # Try GET first bytes
        resp = session.get(url, stream=True, timeout=timeout)
        info['http_status'] = resp.status_code
        ct = resp.headers.get('Content-Type', '')
        info['content_type'] = ct
        if resp.status_code == 200:
            chunk = resp.raw.read(1024) or b''
            text = chunk.decode('utf-8', errors='ignore')
            if '#EXTM3U' in text or 'm3u8' in text:
                info['working'] = True
                info['status'] = 'ok'
            else:
                info['status'] = 'no_playlist'
        else:
            info['status'] = 'http_' + str(resp.status_code)

    except Exception as e:
        info['status'] = 'error'
        info['error'] = str(e)

    return info


def main():
    all_channels = []
    seen_urls = set()
    print('Starting channel update...')

    for url, label in PLAYLISTS:
        try:
            print(f'Fetching {url}...')
            r = session.get(url, timeout=10)
            r.raise_for_status()
            content = r.text
            channels = parse_m3u(content, label)
            print(f'Extracted {len(channels)} channels from {label}.')

            for ch in channels:
                if ch.get('url') and ch['url'] not in seen_urls:
                    ch['last_checked'] = None
                    ch['working'] = False
                    ch['country'] = label
                    all_channels.append(ch)
                    seen_urls.add(ch['url'])

        except Exception as e:
            print(f'Error fetching {url}: {e}')

    print(f'Total candidate channels: {len(all_channels)}')

    # Validate channels (lightweight checks)
    valid_channels = []
    for i, ch in enumerate(all_channels, 1):
        url = ch.get('url')
        print(f'Checking ({i}/{len(all_channels)}): {url}')
        info = check_url(url)
        ch['last_checked'] = int(time.time())
        ch['http_status'] = info.get('http_status')
        ch['content_type'] = info.get('content_type')
        ch['working'] = bool(info.get('working'))
        ch['check_status'] = info.get('status')
        if ch['working']:
            valid_channels.append(ch)

    # Sort and write outputs
    all_channels.sort(key=lambda x: (x.get('group', ''), x.get('name', '')))
    valid_channels.sort(key=lambda x: (x.get('group', ''), x.get('name', '')))

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_channels, f, indent=2, ensure_ascii=False)

    with open(VALID_OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(valid_channels, f, indent=2, ensure_ascii=False)

    print(f'Saved {len(all_channels)} channels to {OUTPUT_FILE}')
    print(f'Saved {len(valid_channels)} working channels to {VALID_OUTPUT}')


if __name__ == '__main__':
    main()
