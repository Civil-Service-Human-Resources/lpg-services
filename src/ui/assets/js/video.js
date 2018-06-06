;(function() {
	var COMPLETION_POINT = 0.8
	var completed = false
	var courseId
	var currentProgress = 0.0
	var currentTime = 0
	var justSeeked = false
	var moduleId
	var prevState = undefined
	var segmentStart = undefined
	var segmentStartTime = undefined
	var segments = []
	var sessionId
	var terminated = false
	var videoId
	var videoLength = 0

	var youTubePlayer = true
	
	var detectVideoPlayer = function(){
		if ($('#video-player').size() !==0) {
			youTubePlayer = true
		} else {
			youTubePlayer = false
		}
	}

	var formatSegments = function() {
		return segments
			.map(function(el) {
				return el.join('[.]')
			})
			.join('[,]')
	}

	var getTotalTimePlaying = function() {
		var total = 0
		for (var i = 0; i < segments.length; i++) {
			total += segments[i][1] - segments[i][0]
		}
		return Math.floor(total)
	}

	var record = function(verb, extensions, viaBeacon) {
		console.log('recording: ',verb,' with ',extensions)
		if (!extensions) {
			extensions = {}
		}
		extensions.VideoLength = videoLength
		extensions.VideoSessionID = sessionId
		var url =
			'/api/lrs.record?courseId=' +
			encodeURIComponent(courseId) +
			'&moduleId=' +
			encodeURIComponent(moduleId) +
			'&verb=' +
			encodeURIComponent(verb) +
			'&extensions=' +
			encodeURIComponent(JSON.stringify(extensions))
		if (verb === 'Completed') {
			var duration = getTotalTimePlaying()
			var resultData = {completion: true, duration: duration}
			url += '&resultData=' + encodeURIComponent(JSON.stringify(resultData))
		}
		var async = true
		if (viaBeacon) {
			// TODO(tav): Technically, navigator.sendBeacon should make the HTTP call
			// without having to block the user with a sync call or getting killed by
			// the browser when the user closes the window. But for some reason this
			// doesn't seem to be working as expected. Investigate and fix later.
			//
			// if (navigator.sendBeacon) {
			// 	if (navigator.sendBeacon(url)) {
			//     return
			//   }
			// }
			async = false
		}
		var xhr = new XMLHttpRequest()
		xhr.open('GET', url, async)
		xhr.send()
	}

	var abstraction = function(player,item,event) {
		switch (item) {
			case 'duration':
				return youTubePlayer ? player.getDuration() : player.duration()
			case 'currentTime':
				return youTubePlayer ? player.getCurrentTime() : player.currentTime()
			case 'playing':
				return youTubePlayer ? YT.PlayerState.PLAYING : 'play'
			case 'paused':
				return youTubePlayer ? YT.PlayerState.PAUSED : 'pause'
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
				if (prevState !== abstraction(player,'paused')) {
					record(
						'PausedVideo',
						{
							VideoPlayedSegments: formatSegments(),
							VideoProgress: currentProgress,
							VideoTime: currentTime,
						},
						true
					)
				}
				record(
					'Terminated',
					{
						VideoPlayedSegments: formatSegments(),
						VideoProgress: currentProgress,
						VideoTime: currentTime,
					},
					true
				)
			},
			false
		)
	
		window.addEventListener(
			'DOMContentLoaded',
			function() {
				courseId = document.getElementById('course-id').value
				moduleId = document.getElementById('module-id').value
				sessionId = document.getElementById('session-id').value
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
						record('Completed', {
							VideoPlayedSegments: formatSegments(),
							VideoProgress: currentProgress,
							VideoTime: currentTime,
						})
						completed = true
					}
					if (prevState !== abstraction(player,'paused')) {
						record('PausedVideo', {
							VideoPlayedSegments: formatSegments(),
							VideoProgress: currentProgress,
							VideoTime: currentTime,
						})
					}
					record('Terminated', {
						VideoPlayedSegments: formatSegments(),
						VideoProgress: currentProgress,
						VideoTime: currentTime,
					})
					terminated = true
					break
				case  abstraction(player,'paused'):
					if (terminated) {
						return
					}
					justSeeked = false
					if (prevState === abstraction(player,'playing')) {
						var elapsedInRealTime = (Date.now() - segmentStartTime) / 1000
						var elapsedInVideo = currentTime - segmentStart
						if (
							elapsedInVideo < 0 ||
							Math.abs(elapsedInVideo - elapsedInRealTime) > 0.5
						) {
							// Guess at the time the seek was initialised.
							var prevEnd = segmentStart + elapsedInRealTime
							record('SeekedVideo', {
								VideoTimeFrom: prevEnd,
								VideoTimeTo: currentTime,
							})
							segments.push([segmentStart, prevEnd])
							justSeeked = true
						} else {
							segments.push([segmentStart, currentTime])
						}
						segmentStart = undefined
						record('PausedVideo', {
							VideoPlayedSegments: formatSegments(),
							VideoProgress: currentProgress,
							VideoTime: currentTime,
						})
					}
					prevState = abstraction(player,'paused')
					break
				case abstraction(player,'playing'):
					if (terminated) {
						return
					}
					if (currentProgress > COMPLETION_POINT && !completed) {
						completed = true
						record('Completed', {
							VideoPlayedSegments: formatSegments(),
							VideoProgress: currentProgress,
							VideoTime: currentTime,
						})
					}
					if (segmentStart === undefined) {
						if (!justSeeked) {
							var prevSegment = segments[segments.length - 1]
							if (prevSegment) {
								var prevEnd = prevSegment[1]
								if (Math.abs(currentTime - prevEnd) > 0.5) {
									record('SeekedVideo', {
										VideoTimeFrom: prevEnd,
										VideoTimeTo: currentTime,
									})
								}
							}
						}
						segmentStart = currentTime
						segmentStartTime = Date.now()
					}
					if (prevState !== abstraction(player,'playing')) {
						record('PlayedVideo', {VideoTime: currentTime})
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
			sessionId = document.getElementById('session-id').value
			videoId = document.getElementById('video-id') ? document.getElementById('video-id').value : null
			var elem = document.createElement('script')
			elem.src = 'https://www.youtube.com/iframe_api'
			var script = document.getElementsByTagName('script')[0]
			script.parentNode.insertBefore(elem, script)
		},
		false
	)
})()
