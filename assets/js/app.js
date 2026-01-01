const player = document.getElementById('player');
const playerInfo = document.getElementById('player-info');
const channelsEl = document.getElementById('channels');
const searchEl = document.getElementById('search');
const groupFilter = document.getElementById('groupFilter');
let channels = [];
let hls = null;

async function loadChannels(){
	try{
		const res = await fetch('/data/channels.json');
		channels = await res.json();
		buildGroupOptions();
		renderChannels(channels);
	}catch(e){
		channelsEl.innerHTML = '<div class="channel-error">Failed to load channels</div>';
		console.error(e);
	}
}

function buildGroupOptions(){
	const groups = Array.from(new Set(channels.map(c=> (c.group||'Ungrouped').toUpperCase()))).sort();
	groups.forEach(g=>{
		const opt = document.createElement('option'); opt.value = g; opt.textContent = g; groupFilter.appendChild(opt);
	});
}

function renderChannels(list){
	channelsEl.innerHTML = '';
	if(!list.length){ channelsEl.innerHTML = '<div class="channel-empty">No channels found</div>'; return }
	list.forEach(ch=>{
		const card = document.createElement('div'); card.className='channel-card';
		card.addEventListener('click',()=>playChannel(ch));

		const logo = document.createElement('img'); logo.className='logo';
		logo.alt = ch.name; logo.src = ch.logo || '';

		const meta = document.createElement('div'); meta.className='meta';
		const name = document.createElement('div'); name.className='name'; name.textContent = ch.name;
		const group = document.createElement('div'); group.className='group'; group.textContent = ch.group || '';
		meta.appendChild(name); meta.appendChild(group);

		card.appendChild(logo); card.appendChild(meta);
		channelsEl.appendChild(card);
	});
}

function filterChannels(){
	const q = searchEl.value.trim().toLowerCase();
	const group = groupFilter.value;
	let filtered = channels.filter(c=>{
		const matchesQ = q === '' || (c.name && c.name.toLowerCase().includes(q)) || (c.group && c.group.toLowerCase().includes(q));
		const matchesGroup = group === 'all' || (c.group && c.group.toUpperCase() === group);
		return matchesQ && matchesGroup;
	});
	renderChannels(filtered);
}

function playChannel(ch){
	const src = ch.url;
	player.pause();
	playerInfo.textContent = `Playing: ${ch.name} — ${ch.group || ''}`;
	if(hls){ hls.destroy(); hls = null }

	// HLS streams (.m3u8)
	if(Hls.isSupported() && src && src.includes('.m3u8')){
		hls = new Hls();
		hls.loadSource(src);
		hls.attachMedia(player);
		hls.on(Hls.Events.MANIFEST_PARSED, ()=>player.play().catch(()=>{}));
		return;
	}

	// Native HLS (Safari) or other types
	player.src = src;
	player.play().catch(()=>{});
}

searchEl.addEventListener('input', debounce(filterChannels, 200));
groupFilter.addEventListener('change', filterChannels);

function debounce(fn, ms=200){
	let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms) }
}

loadChannels();

