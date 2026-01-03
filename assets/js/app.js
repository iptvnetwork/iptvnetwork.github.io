const player = document.getElementById('player');
const playerOverlay = document.getElementById('playerOverlay');
const currentChannelName = document.getElementById('currentChannelName');
const currentChannelGroup = document.getElementById('currentChannelGroup');
const channelCountEl = document.getElementById('channelCount');
const channelsEl = document.getElementById('channels');
const searchEl = document.getElementById('search');
const groupFilter = document.getElementById('groupFilter');

let channels = [];
let hls = null;
let activeChannel = null;

async function loadChannels() {
	try {
		// Simulate loading delay for animation
		channelsEl.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);font-size:1.2rem;margin-top:40px">Loading live channels...</div>';

		// 1. Fetch Local Data
		const resLocal = await fetch('data/channels.json');
		const localChannels = await resLocal.json();

		// 2. Fetch Open Source Data (Bangladesh)
		let externalChannels = [];
		try {
			// Using a CORS proxy might be needed if GitHub Pages blocks it, but usually M3U from raw.githubusercontent or iptv-org pages works.
			// efficient: https://iptv-org.github.io/iptv/countries/bd.m3u
			const resExt = await fetch('https://iptv-org.github.io/iptv/countries/bd.m3u');
			if (resExt.ok) {
				const text = await resExt.text();
				externalChannels = parseM3U(text, 'Open Source (BD)');
			}
		} catch (err) {
			console.warn('Failed to load external channels', err);
		}

		// Merge: Put Local first as they are likely curated
		// Remove duplicates based on URL
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

		updateChannelCount(channels.length);
		buildGroupOptions();
		renderChannels(channels);
	} catch (e) {
		channelsEl.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--primary)">Failed to load channels. Please refresh.</div>';
		console.error(e);
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
			// Create new item
			currentItem = { group: defaultGroup };

			// Extract Logo
			const logoMatch = line.match(/tvg-logo="([^"]*)"/);
			if (logoMatch) currentItem.logo = logoMatch[1];

			// Extract Group
			const groupMatch = line.match(/group-title="([^"]*)"/);
			if (groupMatch) currentItem.group = groupMatch[1];

			// Extract Name (after last comma)
			const nameParts = line.split(',');
			currentItem.name = nameParts[nameParts.length - 1].trim();

		} else if (line.startsWith('http')) {
			// URL line
			if (currentItem.name) {
				currentItem.url = line;
				result.push(currentItem);
				currentItem = {}; // Reset
			}
		}
	});

	return result;
}

function updateChannelCount(count) {
	channelCountEl.textContent = count;
}

function buildGroupOptions() {
	// Clear existing (except first)
	while (groupFilter.options.length > 1) { groupFilter.remove(1); }

	const groups = Array.from(new Set(channels.map(c => (c.group || 'Ungrouped').toUpperCase()))).sort();
	groups.forEach(g => {
		const opt = document.createElement('option');
		opt.value = g;
		opt.textContent = g;
		groupFilter.appendChild(opt);
	});
}

function renderChannels(list) {
	channelsEl.innerHTML = '';
	if (!list.length) {
		channelsEl.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)">No channels found matching your criteria.</div>';
		return;
	}

	// Virtual render limit for performance if list is huge (simple implementation: limit to first 100 initially)
	// For now, let's just render all since BD list isn't massive (<100 usually).

	list.forEach(ch => {
		const card = document.createElement('div');
		card.className = 'channel-card';
		if (activeChannel && activeChannel.url === ch.url) card.classList.add('active');

		card.onclick = () => playChannel(ch, card);

		// Logo
		const logoWrapper = document.createElement('div');
		logoWrapper.className = 'logo-wrapper';
		const logo = document.createElement('img');
		logo.className = 'logo';
		logo.loading = 'lazy';
		logo.alt = ch.name;
		logo.src = ch.logo || 'https://via.placeholder.com/100x60?text=?';
		logo.onerror = () => { logo.src = 'https://via.placeholder.com/100x60?text=TV'; };
		logoWrapper.appendChild(logo);

		// Info
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

function playChannel(ch, cardEl) {
	activeChannel = ch;

	// Update Active UI
	document.querySelectorAll('.channel-card').forEach(c => c.classList.remove('active'));
	if (cardEl) cardEl.classList.add('active');

	// Update Meta
	currentChannelName.textContent = ch.name;
	currentChannelGroup.textContent = ch.group || 'Live';

	// Player Logic
	const src = ch.url;

	if (Hls.isSupported() && src && src.includes('.m3u8')) {
		if (hls) { hls.destroy(); }
		hls = new Hls();
		hls.loadSource(src);
		hls.attachMedia(player);
		hls.on(Hls.Events.MANIFEST_PARSED, () => {
			player.play().catch(e => console.log("Auto-play prevented", e));
		});
	} else {
		player.src = src;
		player.play().catch(e => console.log("Auto-play prevented", e));
	}

	// Hide overlay on play
	playerOverlay.style.display = 'none';
}

// Overlay Click to Play (if paused/initial)
playerOverlay.addEventListener('click', () => {
	if (player.paused && activeChannel) player.play();
});

player.addEventListener('play', () => { playerOverlay.style.display = 'none'; });
player.addEventListener('pause', () => { playerOverlay.style.display = 'flex'; });

searchEl.addEventListener('input', debounce(filterChannels, 300));
groupFilter.addEventListener('change', filterChannels);

function debounce(fn, ms) {
	let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) }
}

loadChannels();

