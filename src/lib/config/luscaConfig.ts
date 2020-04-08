import * as config from "lib/config/index"

export function setCspPolicy(staticAssetDomain: string) {
	let contentCdn
	if (config.PROFILE === 'prod') {
		contentCdn = ' https://cdn.learn.civilservice.gov.uk'
	} else {
		contentCdn = ` https://${config.PROFILE}-cdn.cshr.digital`
	}

	let staticCdn: string
	if (staticAssetDomain) {
		staticCdn = ` ${staticAssetDomain}`
	} else {
		staticCdn = ''
	}

	const policy =  {
		'child-src': 'https://youtube.com https://www.youtube.com',
		'default-src': "'self'" + contentCdn + staticCdn,
		'font-src': 'data:' + staticCdn,
		'frame-src': 'https://youtube.com https://www.youtube.com',
		'img-src': "'self' data: https://www.google-analytics.com" + staticCdn,
		'script-src':
		"'self' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com " +
		"https://www.youtube.com https://s.ytimg.com 'unsafe-inline'" + staticCdn,
		'style-src': "'self' 'unsafe-inline'" + staticCdn,
	}
	return policy
}
