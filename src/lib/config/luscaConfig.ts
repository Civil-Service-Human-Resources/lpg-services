import * as config from "lib/config/index"

export function setCspPolicy() {
	let cdn = {}
	if (config.PROFILE === 'prod') {
		cdn = 'https://cdn.learn.civilservice.gov.uk/'
	} else {
		cdn = `https://${config.PROFILE}-cdn.cshr.digital/`
	}

	const policy =  {
		'child-src': 'https://youtube.com https://www.youtube.com',
		'default-src': "'self' " + cdn,
		'font-src': 'data:',
		'frame-src': 'https://youtube.com https://www.youtube.com',
		'img-src': "'self' data: https://www.google-analytics.com",
		'script-src':
		"'self' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com " +
		"https://www.youtube.com https://s.ytimg.com 'unsafe-inline'",
		'style-src': "'self' 'unsafe-inline'",
	}
	return policy
}
