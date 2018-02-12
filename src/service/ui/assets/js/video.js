;(function() {
	var completed = false
	var courseId
	var duration
	var maxDecile = 0
	var played = false
	var videoId

	var record = function(verb, value) {
		var xhr = new XMLHttpRequest()
		xhr.addEventListener('load', function() {
			console.log('Received response for: ' + verb + ' (' + value + ')')
			console.log(this.responseText)
		})
		if (value === undefined) {
			value = ''
		}
		xhr.open(
			'GET',
			'/api/lrs.record?courseId=' +
				encodeURIComponent(courseId) +
				'&verb=' +
				encodeURIComponent(verb) +
				'&value=' +
				encodeURIComponent(value)
		)
		xhr.send()
	}

	var notify = function(elapsed) {
		var decile = elapsed / duration * 10
		if (decile > 10) {
			decile = 10
		} else {
			decile = Math.floor(decile)
		}
		if (!played) {
			record('PlayedVideo')
			played = true
		}
		if (decile > maxDecile) {
			record('Progresed', decile)
			maxDecile = decile
			if (decile >= 8 && !completed) {
				completed = true
				record('Completed')
			}
		}
	}

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
					if (e.data === YT.PlayerState.ENDED) {
						notify(duration)
					}
				},
			},
		})
	}
	window.addEventListener('DOMContentLoaded', function() {
		courseId = document.getElementById('course-id').value
		videoId = document.getElementById('video-id').value
		var elem = document.createElement('script')
		elem.src = 'https://www.youtube.com/iframe_api'
		var script = document.getElementsByTagName('script')[0]
		script.parentNode.insertBefore(elem, script)
	})
})()
