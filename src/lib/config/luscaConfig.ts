export function setCspPolicy(staticAssetDomain: string) {

	let staticCdn: string
	if (staticAssetDomain) {
		staticCdn = `${staticAssetDomain}`
	} else {
		staticCdn = ''
	}

	const policy =  {
		'child-src': 'https://youtube.com https://www.youtube.com',
		'default-src': `'self' ${staticCdn}`.trim(),
		'font-src': `'self' data: ${staticCdn}`.trim(),
		'frame-src': 'https://youtube.com https://www.youtube.com',
		'img-src': `'self' data: https://www.google-analytics.com ${staticCdn}`.trim(),
		'script-src':
		// tslint:disable-next-line:max-line-length
		`'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.youtube.com https://s.ytimg.com ${staticCdn}`.trim(),
		'style-src': `'self' 'unsafe-inline' ${staticCdn}`.trim(),
	}
	return policy
}
