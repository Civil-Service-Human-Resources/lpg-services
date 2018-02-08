;(function() {
	var videoId
	var duration

	var notify = function(elapsed) {
		var pct = elapsed / duration * 100
		if (pct > 100) {
			pct = 100
		} else {
			pct = Math.floor(pct)
		}
		console.log('Progress: ' + pct + '%')
	}

	videoId = document.getElementById('video-id').value

	window.onYouTubeIframeAPIReady = function() {
		var player = new YT.Player('video-player', {
			height: 390,
			videoId: videoId,
			width: 640,
			playerVars: {
				modestbranding: 1,
			},
			events: {
				onReady: function() {
					duration = player.getDuration()
					setInterval(function() {
						var elapsed = player.getCurrentTime()
						if (elapsed) {
							notify(elapsed)
						}
					}, 1000)
				},
				onStateChange: function(e) {
					if (e.data === YT.PlayerState.ENDED) notify(duration)
				},
			},
		})
	}
	window.addEventListener('DOMContentLoaded', function() {
		var elem = document.createElement('script')
		elem.src = 'https://www.youtube.com/iframe_api'
		var script = document.getElementsByTagName('script')[0]
		script.parentNode.insertBefore(elem, script)
	})
})()
