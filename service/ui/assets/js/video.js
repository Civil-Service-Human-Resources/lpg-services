;(function() {
	var notify = function(elapsed) {
		var pct = elapsed / VIDEO_DURATION * 100
		if (pct > 100) {
			pct = 100
		} else {
			pct = Math.floor(pct)
		}
		console.log('Progress: ' + pct + '%')
	}
	window.onYouTubeIframeAPIReady = function() {
		var player = new YT.Player('video-player', {
			height: VIDEO_HEIGHT,
			videoId: VIDEO_ID,
			width: VIDEO_WIDTH,
			playerVars: {
				modestbranding: 1,
			},
			events: {
				onReady: function() {
					var duration = player.getDuration()
					if (duration !== VIDEO_DURATION) {
						console.log('ERROR: Video duration mismatch')
						console.log('Expected: ' + VIDEO_DURATION.toString())
						console.log('Actual: ' + duration.toString())
						return
					}
					setInterval(function() {
						var elapsed = player.getCurrentTime()
						if (elapsed) {
							notify(elapsed)
						}
					}, 1000)
				},
				onStateChange: function(e) {
					if (e.data === YT.PlayerState.ENDED) notify(VIDEO_DURATION)
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
