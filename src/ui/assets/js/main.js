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

  var seen_cookie_message = getCookie("seen_cookie_message");
  if (seen_cookie_message == "yes") {
    document.getElementById('global-cookie-message').style.display = 'none';
  }


  var selectEl = document.querySelector('.type-ahead')
  if (selectEl) {
    accessibleAutocomplete.enhanceSelectElement({
      autoselect: true,
      defaultValue: selectEl.options[selectEl.options.selectedIndex].innerHTML,
      minLength: 1,
      selectElement: selectEl,
    })
  }

  $('.filter-toggle').not(':has(input[checked])').addClass('filter-toggle--shut');

  $('.filter-toggle legend').click(function (e) {
    e.preventDefault()
    $(this).parents('.filter-toggle').toggleClass('filter-toggle--shut');
  });
})

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
