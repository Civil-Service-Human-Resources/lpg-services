$(document).ready(function () {
	var seen_cookie_message = getCookie('seen_cookie_message')
	if (seen_cookie_message == 'yes') {
		document.getElementById('global-cookie-message').style.display = 'none'
	}

	var selectEl = document.querySelector('.type-ahead')
	if (selectEl) {
		accessibleAutocomplete.enhanceSelectElement({
			autoselect: false,
			defaultValue: '',
			minLength: 1,
			selectElement: selectEl,
			showAllValues: true,
		})
	}

	$('.filter-toggle').not(':has(input[checked])').addClass('filter-toggle--shut')

	$('.filter-toggle legend').click(function (e) {
		e.preventDefault()
		$(this).parents('.filter-toggle').toggleClass('filter-toggle--shut')
	})
	$('.filter-toggle legend').on('keypress', function (e) {
		e.preventDefault()
		$(this).parents('.filter-toggle').toggleClass('filter-toggle--shut')
	})
})

function getCookie(cname) {
	var name = cname + '='
	var decodedCookie = decodeURIComponent(document.cookie)
	var ca = decodedCookie.split(';')
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i]
		while (c.charAt(0) == ' ') {
			c = c.substring(1)
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length)
		}
	}
	return ''
}
