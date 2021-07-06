import * as config from "lib/config/index"

export function setCspPolicy(staticAssetDomain: string) {
	let contentCdn
	if (config.PROFILE === 'prod') {
		contentCdn = 'https://cdn.learn.civilservice.gov.uk'
	} else {
		contentCdn = `https://cdn.${config.PROFILE}.learn.civilservice.gov.uk`
	}

	let staticCdn: string
	if (staticAssetDomain) {
		staticCdn = `${staticAssetDomain}`
	} else {
		staticCdn = ''
	}

	const youtubeUrls = 'https://youtube.com https://www.youtube.com'

	const policy =  {
		'child-src': youtubeUrls,
		'default-src': `'self' ${contentCdn} ${staticCdn}`.trim(),
		'font-src': `'self' data: ${staticCdn}`.trim(),
		'frame-src': youtubeUrls,
		'img-src': `'self' data: https://www.google-analytics.com ${contentCdn} ${staticCdn}`.trim(),
		'media-src': youtubeUrls,
		'script-src':
		// tslint:disable-next-line:max-line-length
		`'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.youtube.com https://s.ytimg.com ${staticCdn}`.trim(),
		'style-src': `'self' 'unsafe-inline' ${staticCdn}`.trim(),
	}
	return policy
}
