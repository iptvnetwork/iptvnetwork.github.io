/* Component Loader */
async function loadComponents() {
	const components = [
		{ id: 'comp-header', url: 'components/header.html' },
		{ id: 'comp-nav', url: 'components/navigation.html' },
		{ id: 'comp-player', url: 'components/player.html' },
		{ id: 'comp-footer', url: 'components/footer.html' }
	];

	// Fetch all components via HTTP
	const promises = components.map(comp =>
		fetch(comp.url)
			.then(res => {
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				return res.text();
			})
			.then(html => {
				const el = document.getElementById(comp.id);
				if (el) {
					// Replace the placeholder div with the content (unwrapping)
					// We use outerHTML so the div#comp-xyz disappears and is replaced by <header>, <section>, etc.
					el.outerHTML = html;
				}
			})
			.catch(err => console.error(`Failed to load ${comp.url}`, err))
	);

	await Promise.all(promises);
	console.log('All components loaded');

	// Small delay to ensure DOM update if needed, though await shouldn't need it.
	initApp();
}

/* App Logic (Wrapped) */
let player, playerOverlay, currentChannelName, currentChannelGroup, channelCountEl, channelsEl, searchEl, groupFilter, visibleGroupFilter, suggestionsEl;
let channels = [];
let hls = null;
let activeChannel = null;

const CACHE_KEY = 'iptv_channels_cache';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const LAST_PLAYED_KEY = 'iptv_last_played';

function initApp() {
	// Select Elements NOW, after they exist in DOM
	player = document.getElementById('player');
	playerOverlay = document.getElementById('playerOverlay');
	currentChannelName = document.getElementById('currentChannelName');
	currentChannelGroup = document.getElementById('currentChannelGroup');
	channelCountEl = document.getElementById('channelCount');
	channelsEl = document.getElementById('channels');
	searchEl = document.getElementById('search');
	suggestionsEl = document.getElementById('searchSuggestions'); // New
	groupFilter = document.getElementById('groupFilter');
	visibleGroupFilter = document.getElementById('visibleGroupFilter');

	// Attach Event Listeners
	if (playerOverlay) {
		playerOverlay.addEventListener('click', () => {
			if (player.paused && activeChannel) player.play();
		});
	}

	if (player) {
		player.addEventListener('play', () => { if (playerOverlay) playerOverlay.style.display = 'none'; });
		player.addEventListener('pause', () => { if (playerOverlay) playerOverlay.style.display = 'flex'; });
	}

	if (searchEl) {
		searchEl.addEventListener('input', debounce((e) => {
			filterChannels(); // Live filter grid
			updateSuggestions(e.target.value); // Show suggestions
		}, 300));

		// Hide suggestions on click outside
		document.addEventListener('click', (e) => {
			if (suggestionsEl && !searchEl.contains(e.target) && !suggestionsEl.contains(e.target)) {
				suggestionsEl.classList.remove('show');
			}
		});

		searchEl.addEventListener('focus', () => {
			if (searchEl.value.trim().length > 0) updateSuggestions(searchEl.value);
		});
	}

	if (groupFilter) groupFilter.addEventListener('change', filterChannels);

	if (visibleGroupFilter) {
		visibleGroupFilter.addEventListener('change', () => {
			if (groupFilter) {
				groupFilter.value = visibleGroupFilter.value;
				filterChannels();
			}
		});
	}

	// Load Data
	loadChannels();
}

function updateSuggestions(query) {
	if (!suggestionsEl) return;
	const q = query.trim().toLowerCase();

	if (q.length < 2) {
		suggestionsEl.classList.remove('show');
		return;
	}

	// Find top 5 matches
	const matches = channels.filter(c =>
		(c.name && c.name.toLowerCase().includes(q)) ||
		(c.group && c.group.toLowerCase().includes(q))
	).slice(0, 5);

	if (matches.length === 0) {
		suggestionsEl.classList.remove('show');
		return;
	}

	suggestionsEl.innerHTML = '';
	matches.forEach(ch => {
		const item = document.createElement('div');
		item.className = 'suggestion-item';
		item.innerHTML = `
			<img src="${ch.logo || 'https://via.placeholder.com/40'}" class="suggestion-logo" onerror="this.src='https://via.placeholder.com/40?text=TV'">
			<div class="suggestion-info">
				<span class="suggestion-name">${ch.name}</span>
				<span class="suggestion-group">${ch.group || 'Live'}</span>
			</div>
		`;
		item.onclick = () => {
			playChannel(ch, null, true);
			searchEl.value = ch.name;
			filterChannels(); // Update grid to show only this result? Or reset? Let's just update grid.
			suggestionsEl.classList.remove('show');
		};
		suggestionsEl.appendChild(item);
	});

	suggestionsEl.classList.add('show');
}

async function loadChannels() {
	try {
		// 1. Try Cache First
		const cached = getCachedChannels();
		if (cached) {
			console.log('Using cached channels');
			channels = cached;
		} else {
			// 2. Fetch if no cache
			if (channelsEl) channelsEl.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);font-size:1.2rem;margin-top:40px">Updating live channels...</div>';

			const resLocal = await fetch('data/channels.json');
			let localChannels = [];
			if (resLocal.ok) localChannels = await resLocal.json();

			let externalChannels = [];
			try {
				const resExt = await fetch('https://iptv-org.github.io/iptv/countries/bd.m3u');
				if (resExt.ok) {
					const text = await resExt.text();
					externalChannels = parseM3U(text, 'Open Source (BD)');
				}
			} catch (err) { console.warn(err); }

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

		restoreLastPlayed();

	} catch (e) {
		if (channelsEl) channelsEl.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--primary)">Failed to load channels. <br><button onclick="location.reload()" style="margin-top:10px;padding:8px 16px;background:var(--primary);border:none;border-radius:6px;color:white;cursor:pointer">Retry</button></div>';
		console.error(e);
	}
}

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
			const found = channels.find(c => c.url === lastCh.url) || lastCh;
			if (found) {
				playChannel(found, null, false);
				if (currentChannelName) currentChannelName.textContent = found.name;
				if (currentChannelGroup) currentChannelGroup.textContent = "Resume Watching";
			}
		} catch (e) { }
	}
}

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
	if (!channelsEl) return;
	channelsEl.innerHTML = '';
	if (!list.length) {
		channelsEl.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)">No channels found.</div>';
		return;
	}

	list.forEach(ch => {
		const card = document.createElement('div');
		card.className = 'channel-card';
		if (activeChannel && activeChannel.url === ch.url) card.classList.add('active');
		card.onclick = () => playChannel(ch, card, true);

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
	if (!searchEl || !groupFilter) return;
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
	localStorage.setItem(LAST_PLAYED_KEY, JSON.stringify(ch));

	if (window.innerWidth < 1024 && autoPlay) {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	document.querySelectorAll('.channel-card').forEach(c => c.classList.remove('active'));
	if (cardEl) cardEl.classList.add('active');

	if (currentChannelName) currentChannelName.textContent = ch.name;
	if (currentChannelGroup) currentChannelGroup.textContent = ch.group || 'Live';

	const src = ch.url;

	if (Hls.isSupported() && src && src.includes('.m3u8')) {
		if (hls) { hls.destroy(); }
		hls = new Hls();
		hls.loadSource(src);
		if (player) hls.attachMedia(player);
		hls.on(Hls.Events.MANIFEST_PARSED, () => {
			if (autoPlay && player) player.play().catch(e => console.log("Auto-play blocked", e));
		});
	} else {
		if (player) {
			player.src = src;
			if (autoPlay) player.play().catch(e => console.log("Auto-play blocked", e));
		}
	}

	if (playerOverlay) {
		if (autoPlay) playerOverlay.style.display = 'none';
		else playerOverlay.style.display = 'flex';
	}
}

function debounce(fn, ms) {
	let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) }
}

// Start Loading
loadComponents();
