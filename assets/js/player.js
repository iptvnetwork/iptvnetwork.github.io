document.addEventListener('DOMContentLoaded', ()=>{
	const channelsEl = document.getElementById('channels')
	const search = document.getElementById('search')
	let channels = []

	fetch('data/channels.json')
		.then(r=>r.json())
		.then(list=>{
			channels = list
			render(channels)
		})
		.catch(err=>{
			channelsEl.innerHTML = '<div class="empty">Failed to load channels.json</div>'
			console.error(err)
		})

	search.addEventListener('input', ()=>{
		const q = search.value.trim().toLowerCase()
		if(!q) return render(channels)
		const filtered = channels.filter(c => (c.name||'').toLowerCase().includes(q) || (c.category||'').toLowerCase().includes(q))
		render(filtered)
	})

	let hls = null
	const video = document.getElementById('player')

	function playUrl(url,name){
		if(!url){ alert('Channel has no stream URL'); return }
		if(hls){ try{ hls.destroy() }catch(e){} hls = null }
		if(window.Hls && Hls.isSupported()){
			hls = new Hls()
			hls.loadSource(url)
			hls.attachMedia(video)
			hls.on(Hls.Events.MANIFEST_PARSED, ()=> video.play().catch(()=>{}))
		} else if(video.canPlayType('application/vnd.apple.mpegurl')){
			video.src = url
			video.play().catch(()=>{})
		} else {
			alert('HLS not supported in this browser')
		}
		document.getElementById('nowplaying').textContent = name || 'Playing'
	}

	function render(list){
		if(!list || list.length===0){
			channelsEl.innerHTML = '<div class="empty">No channels found</div>'
			return
		}
		channelsEl.innerHTML = ''
		for(const ch of list){
			const el = document.createElement('div')
			el.className = 'channel'
			const img = document.createElement('img')
			img.src = ch.logo || 'https://via.placeholder.com/160x90?text=No+Logo'
			img.alt = ch.name || ''
			const meta = document.createElement('div')
			meta.className = 'meta'
			const name = document.createElement('div')
			name.className = 'name'
			name.textContent = ch.name || 'Unknown'
			const cat = document.createElement('div')
			cat.className = 'cat'
			cat.textContent = ch.category || ''
			meta.appendChild(name)
			meta.appendChild(cat)
			el.appendChild(img)
			el.appendChild(meta)
			el.addEventListener('click', ()=> playUrl(ch.url, ch.name))
			channelsEl.appendChild(el)
		}
	}
})

