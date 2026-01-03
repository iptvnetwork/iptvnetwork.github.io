const player = document.getElementById('player');
const playerOverlay = document.getElementById('playerOverlay');
const currentChannelName = document.getElementById('currentChannelName');
const currentChannelGroup = document.getElementById('currentChannelGroup');
const channelCountEl = document.getElementById('channelCount');
const channelsEl = document.getElementById('channels');
const searchEl = document.getElementById('search');

// Selects
const groupFilter = document.getElementById('groupFilter');
const visibleGroupFilter = document.getElementById('visibleGroupFilter');

let channels = [];
let hls = null;
let activeChannel = null;

const CACHE_KEY = 'iptv_channels_cache';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const LAST_PLAYED_KEY = 'iptv_last_played';

async function loadChannels() {
	try {
		// 1. Try Cache First
		const cached = getCachedChannels();
		if (cached) {
			console.log('Using cached channels');
			channels = cached;
		} else {
			// 2. Fetch if no cache
			channelsEl.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);font-size:1.2rem;margin-top:40px">Updating live channels...</div>';

			const resLocal = await fetch('data/channels.json');
			const localChannels = await resLocal.json();

			let externalChannels = [];
			try {
				const resExt = await fetch('https://iptv-org.github.io/iptv/countries/bd.m3u');
				if (resExt.ok) {
					const text = await resExt.text();
					externalChannels = parseM3U(text, 'Open Source (BD)');
				}
			} catch (err) { console.warn(err); }

			// Merge & Deduplicate
			const all = [...localChannels, ...externalChannels];
			const unique = [];
			const seenUrls = new Set();

			all.forEach(c => {
				if (!seenUrls.has(c.url)) {
					seenUrls.add(c.url);
					unique.push(c);
				}
			});

			channels = unique;
			cacheChannels(channels);
		}

		updateChannelCount(channels.length);
		buildGroupOptions();
		renderChannels(channels);

		// 3. Restore Last Played
		restoreLastPlayed();

	} catch (e) {
		channelsEl.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--primary)">Failed to load channels. <br><button onclick="location.reload()" style="margin-top:10px;padding:8px 16px;background:var(--primary);border:none;border-radius:6px;color:white;cursor:pointer">Retry</button></div>';
		console.error(e);
	}
}

// Cache Logic
function getCachedChannels() {
	const store = localStorage.getItem(CACHE_KEY);
	if (!store) return null;
	try {
		const { timestamp, data } = JSON.parse(store);
		if (Date.now() - timestamp < CACHE_DURATION) return data;
	} catch (e) { }
	return null;
}

function cacheChannels(data) {
	localStorage.setItem(CACHE_KEY, JSON.stringify({
		timestamp: Date.now(),
		data: data
	}));
}

function restoreLastPlayed() {
	const last = localStorage.getItem(LAST_PLAYED_KEY);
	if (last && channels.length) {
		try {
			const lastCh = JSON.parse(last);
			// Find it in current list to ensure URL is valid/fresh
			const found = channels.find(c => c.url === lastCh.url) || lastCh;

			if (found) {
				// Auto-select but maybe don't auto-play to respect browser policy, 
				// or mute autoplay. Let's just set the metadata and highlight.
				playChannel(found, null, false); // false = don't force play immediately, just setup

				// Scroll to it
				// This is tricky without the element ref, but we can search DOM if really needed.
				// For now, just setting player state is good.
				currentChannelName.textContent = found.name;
				currentChannelGroup.textContent = "Resume Watching";
			}
		} catch (e) { }
	}
}

// Simple M3U Parser
function parseM3U(content, defaultGroup = 'General') {
	const lines = content.split('\n');
	const result = [];
	let currentItem = {};

	lines.forEach(line => {
		line = line.trim();
		if (!line) return;

		if (line.startsWith('#EXTINF:')) {
			currentItem = { group: defaultGroup };
			const logoMatch = line.match(/tvg-logo="([^"]*)"/);
			if (logoMatch) currentItem.logo = logoMatch[1];
			const groupMatch = line.match(/group-title="([^"]*)"/);
			if (groupMatch) currentItem.group = groupMatch[1];
			const nameParts = line.split(',');
			currentItem.name = nameParts[nameParts.length - 1].trim();
		} else if (line.startsWith('http')) {
			if (currentItem.name) {
				currentItem.url = line;
				result.push(currentItem);
				currentItem = {};
			}
		}
	});
	return result;
}

function updateChannelCount(count) {
	if (channelCountEl) channelCountEl.textContent = count;
}

function buildGroupOptions() {
	[groupFilter, visibleGroupFilter].forEach(sel => {
		if (!sel) return;
		while (sel.options.length > 1) { sel.remove(1); }
	});

	const groups = Array.from(new Set(channels.map(c => (c.group || 'Ungrouped').toUpperCase()))).sort();

	groups.forEach(g => {
		[groupFilter, visibleGroupFilter].forEach(sel => {
			if (!sel) return;
			const opt = document.createElement('option');
			opt.value = g;
			opt.textContent = g;
			sel.appendChild(opt);
		});
	});
}

function renderChannels(list) {
	channelsEl.innerHTML = '';
	if (!list.length) {
		channelsEl.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)">No channels found.</div>';
		return;
	}

	list.forEach(ch => {
		const card = document.createElement('div');
		card.className = 'channel-card';
		if (activeChannel && activeChannel.url === ch.url) card.classList.add('active');

		card.onclick = () => playChannel(ch, card, true); // true = user interaction

		const logoWrapper = document.createElement('div');
		logoWrapper.className = 'logo-wrapper';
		const logo = document.createElement('img');
		logo.className = 'logo';
		logo.loading = 'lazy';
		logo.alt = ch.name;
		logo.src = ch.logo || 'https://via.placeholder.com/100x60?text=?';
		logo.onerror = () => { logo.src = 'https://via.placeholder.com/100x60?text=TV'; };
		logoWrapper.appendChild(logo);

		const info = document.createElement('div');
		info.className = 'card-info';
		const name = document.createElement('div');
		name.className = 'card-name';
		name.textContent = ch.name;
		const group = document.createElement('div');
		group.className = 'card-group';
		group.textContent = ch.group || 'Live';

		info.appendChild(name);
		info.appendChild(group);

		card.appendChild(logoWrapper);
		card.appendChild(info);
		channelsEl.appendChild(card);
	});
}

function filterChannels() {
	const q = searchEl.value.trim().toLowerCase();
	const group = groupFilter.value;

	const filtered = channels.filter(c => {
		const matchesQ = q === '' || (c.name && c.name.toLowerCase().includes(q)) || (c.group && c.group.toLowerCase().includes(q));
		const matchesGroup = group === 'all' || (c.group && c.group.toUpperCase() === group);
		return matchesQ && matchesGroup;
	});

	updateChannelCount(filtered.length);
	renderChannels(filtered);
}

function playChannel(ch, cardEl, autoPlay = true) {
	activeChannel = ch;

	// Save Last Played
	localStorage.setItem(LAST_PLAYED_KEY, JSON.stringify(ch));

	if (window.innerWidth < 1024 && autoPlay) {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	document.querySelectorAll('.channel-card').forEach(c => c.classList.remove('active'));
	if (cardEl) cardEl.classList.add('active');
	else {
		// Try to find the card if not passed (e.g. restoreLastPlayed)
		// This is expensive O(N) refind but okay for single run
		// We could implement if needed, skipping for now to save DOM loops
	}

	currentChannelName.textContent = ch.name;
	currentChannelGroup.textContent = ch.group || 'Live';

	const src = ch.url;

	if (Hls.isSupported() && src && src.includes('.m3u8')) {
		if (hls) { hls.destroy(); }
		hls = new Hls();
		hls.loadSource(src);
		hls.attachMedia(player);
		hls.on(Hls.Events.MANIFEST_PARSED, () => {
			if (autoPlay) player.play().catch(e => console.log("Auto-play blocked", e));
		});
	} else {
		player.src = src;
		if (autoPlay) player.play().catch(e => console.log("Auto-play blocked", e));
	}

	if (autoPlay) playerOverlay.style.display = 'none';
	else playerOverlay.style.display = 'flex'; // Show play button for Resume
}

playerOverlay.addEventListener('click', () => {
	if (player.paused && activeChannel) player.play();
});

player.addEventListener('play', () => { playerOverlay.style.display = 'none'; });
player.addEventListener('pause', () => { playerOverlay.style.display = 'flex'; });

searchEl.addEventListener('input', debounce(filterChannels, 300));
groupFilter.addEventListener('change', filterChannels);
if (visibleGroupFilter) {
	visibleGroupFilter.addEventListener('change', () => {
		groupFilter.value = visibleGroupFilter.value;
		filterChannels();
	});
}

function debounce(fn, ms) {
	let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) }
}

loadChannels();
