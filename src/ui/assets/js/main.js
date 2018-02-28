$(document).ready(function() {
	// Install click handler to reveal the feedback form.
	var feedbackRevealed = false
	$('.feedback-prompt').click(function(e) {
		e.preventDefault()
		if (feedbackRevealed) {
			var details = $('.feedback-details')[0]
			details.style.display = 'none'
			feedbackRevealed = false
			return
		}
		feedbackRevealed = true
		var details = $('.feedback-details')[0]
		details.style.display = 'block'
		$('#whatDoing').focus()
		if (details.scrollIntoView) {
			details.scrollIntoView()
		}
	})
	// Install submit handler to intercept the feedback submission.
	$('.feedback form').submit(function(e) {
		e.preventDefault()
		// TODO(tav): Handle error state
		$.post('/feedback.record', $('.feedback form').serialize(), function(resp) {
			$('.feedback-details')[0].innerHTML = resp
		})
	})
})
