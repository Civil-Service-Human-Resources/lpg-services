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
		if (!extensions) {
			extensions = {}
		}
		extensions.VideoLength = videoLength
		extensions.VideoSessionId = sessionId
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
			if (navigator.sendBeacon) {
				navigator.sendBeacon(url)
				return
			}
			async = false
		}
		var xhr = new XMLHttpRequest()
		xhr.addEventListener('load', function() {
			console.log('Received response for: ' + verb + ' (' + value + ')')
			console.log(this.responseText)
		})
		xhr.open('GET', url, async)
		xhr.send()
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
					videoLength = Math.floor(player.getDuration())
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
								prevState === YT.PlayerState.PLAYING
							) {
								segments.push([segmentStart, currentTime])
							}
							if (prevState !== YT.PlayerState.PAUSED) {
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
				},
				onStateChange: function(e) {
					// NOTE(tav): The current time will differ from the actual time the
					// event was received by a few milliseconds. Polling will solve this
					// issue, but then that masks any interleaving state changes.
					currentTime = Math.floor(player.getCurrentTime() * 1000) / 1000
					currentProgress = Math.floor(currentTime / videoLength * 1000) / 1000
					switch (e.data) {
						case YT.PlayerState.ENDED:
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
							if (prevState !== YT.PlayerState.PAUSED) {
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
						case YT.PlayerState.PAUSED:
							if (terminated) {
								return
							}
							justSeeked = false
							if (prevState === YT.PlayerState.PLAYING) {
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
							prevState = YT.PlayerState.PAUSED
							break
						case YT.PlayerState.PLAYING:
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
							if (prevState !== YT.PlayerState.PLAYING) {
								record('PlayedVideo', {VideoTime: currentTime})
							}
							prevState = YT.PlayerState.PLAYING
							break
					}
				},
			},
		})
	}
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
})()
