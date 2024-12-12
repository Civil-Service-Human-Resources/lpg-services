;(function() {
	var COMPLETION_POINT = 0.8
	var completed = false
	var courseId
	var currentProgress = 0.0
	var currentTime = 0
	var moduleId
	var prevState = undefined
	var segmentStart = undefined
	var segments = []
	var terminated = false
	var videoId
	var videoLength = 0

	var youTubePlayer = true

	var detectVideoPlayer = function(){
		if (document.getElementById("video-player")) {
			youTubePlayer = true
		} else {
			youTubePlayer = false
		}
	}

	var abstraction = function(player,item,event) {
		switch (item) {
			case 'duration':
				return youTubePlayer ? player.getDuration() : player.duration()
			case 'currentTime':
				return youTubePlayer ? player.getCurrentTime() : player.currentTime()
			case 'playing':
				return youTubePlayer ? YT.PlayerState.PLAYING : 'play'
			case 'event':
				return youTubePlayer ? JSON.parse(event.data ).info : event.type
			case 'ended':
				return youTubePlayer ? YT.PlayerState.ENDED : 'ended'
		}
	}


	var onReady = function(player) {
		videoLength = Math.floor(abstraction(player, 'duration'))
		window.addEventListener(
			'unload',
			function() {
				if (terminated) {
					return
				}
				currentTime = Math.floor(player.getCurrentTime() * 1000) / 1000
				currentProgress =
					Math.floor(currentTime / videoLength * 1000) / 1000
				if (
					segmentStart !== undefined &&
					prevState === abstraction(player,'playing')
				) {
					segments.push([segmentStart, currentTime])
				}
			},
			false
		)

		window.addEventListener(
			'DOMContentLoaded',
			function() {
				courseId = document.getElementById('course-id').value
				moduleId = document.getElementById('module-id').value
				videoId = document.getElementById('video-id').value
				var elem = document.createElement('script')
				elem.src = 'https://www.youtube.com/iframe_api'
				var script = document.getElementsByTagName('script')[0]
				script.parentNode.insertBefore(elem, script)
			},
			false
		)
	}

	var setUpStateChange = function(player){
		player.on(['pause','play','ended'],function(e){onStateChange(e,player)})
	}

	var completeModule = function() {
		var url =
			'/js/video/complete?courseId=' +
			encodeURIComponent(courseId) +
			'&moduleId=' +
			encodeURIComponent(moduleId)
		var xhr = new XMLHttpRequest()
		xhr.open('GET', url, true)
		xhr.send()
	}

	var onStateChange = function(e,player) {
			// NOTE(tav): The current time will differ from the actual time the
			// event was received by a few milliseconds. Polling will solve this
			// issue, but then that masks any interleaving state changes.
			videoLength = Math.floor(abstraction(player, 'duration'))
			currentTime = Math.floor(abstraction(player,'currentTime') * 1000) / 1000
			if (currentTime >videoLength) currentTime = videoLength
			currentProgress = Math.floor(currentTime / videoLength * 1000) / 1000

			switch (abstraction(player,'event',event)) {
				case abstraction(player,'ended'):
					if (terminated) {
						return
					}
					if (!completed) {
						completeModule()
						completed = true
					}
					terminated = true
					break
				case abstraction(player,'playing'):
					if (terminated) {
						return
					}
					if (currentProgress > COMPLETION_POINT && !completed) {
						completed = true
						completeModule()
					}
					prevState = abstraction(player,'playing')
					break
			}
		}

	var readyFunction = function() {

		if (youTubePlayer) {
			var player = new YT.Player('video-player', {
				height: 390,
				videoId: videoId,
				width: 640,
				playerVars: {
					modestbranding: 1,
				},
				events: {
					onReady: function(){
						onReady(player)
					},
					onStateChange: function(e){
						onStateChange(e,player)
					}
				}
			})
		} else {
			var player = videojs('videojs-player',null,function(){
					onReady(player)
					setUpStateChange(player)
				}
			);
		}
	}

	detectVideoPlayer();
	if (youTubePlayer) {
		window.onYouTubeIframeAPIReady = readyFunction;
	} else {
		$(document).ready(function(){
				readyFunction()
		})
	}

	window.addEventListener(
		'DOMContentLoaded',
		function() {
			courseId = document.getElementById('course-id').value
			moduleId = document.getElementById('module-id').value
			videoId = document.getElementById('video-id') ? document.getElementById('video-id').value : null
			var elem = document.createElement('script')
			elem.src = 'https://www.youtube.com/iframe_api'
			var script = document.getElementsByTagName('script')[0]
			script.parentNode.insertBefore(elem, script)
		},
		false
	)
})()
