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

	let filterToggles = document.getElementsByClassName('filter-toggle')
	for (let i = 0; i < filterToggles.length; i++) {
		let filterToggle = filterToggles[i]
		let filterToggleBtn = filterToggle.getElementsByClassName('filter-headings')[0]
		if (filterToggleBtn) {
			let anyChecked = filterToggle.querySelectorAll('input[type="checkbox"]:checked').length > 0
			if (!anyChecked) {
				filterToggle.classList.add('filter-toggle--shut')
				filterToggleBtn.setAttribute('aria-expanded', 'false')
			}

			filterToggleBtn.addEventListener('click', function (e) {
				e.preventDefault()
				console.log(e)
				let closed = filterToggle.classList.contains('filter-toggle--shut') &&
					filterToggleBtn.getAttribute('aria-expanded') === 'false'
				if (closed) {
					filterToggle.classList.remove('filter-toggle--shut')
					filterToggleBtn.setAttribute('aria-expanded', 'true')
				} else {
					filterToggle.classList.add('filter-toggle--shut')
					filterToggleBtn.setAttribute('aria-expanded', 'false')
				}
			})
		}
	}
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
