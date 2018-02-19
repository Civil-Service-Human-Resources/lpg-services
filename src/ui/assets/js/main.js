$(document).ready(function() {
	$('body').addClass('js-enabled')
	$(document).on('click', '[data-target="view-all-button"]', function(event) {
		event.preventDefault()
		$(this).toggleClass('view-all--showing')
		$('#view-all').toggleClass('js-hidden')
	})
	// Install click handler to reveal the feedback form.
	var feedbackRevealed = false
	$('.feedback-prompt').click(function(e) {
		e.preventDefault()
		if (feedbackRevealed) {
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
