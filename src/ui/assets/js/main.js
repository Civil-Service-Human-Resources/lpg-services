$(document).ready(function() {
	$('body').addClass('js-enabled')
	$(document).on('click', '[data-target="view-all-button"]', function(event) {
		event.preventDefault()
		$(this).toggleClass('view-all--showing')
		$('#view-all').toggleClass('js-hidden')
	})
})
