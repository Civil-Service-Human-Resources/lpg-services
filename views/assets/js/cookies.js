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

var seen_cookie_message = getCookie('seen_cookie_message')
if (seen_cookie_message == 'yes') {
	document.getElementById('global-cookie-message').style.display = 'none'
}
