import * as config from '../../lib/config/index'

export function setCspPolicy(staticAssetDomain: string) {
	const gaCsp = config.GOOGLE_ANALYTICS_CSP_ORIGINS.replace(/\,/gi, ' ')

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

	const policy = {
		'child-src': 'https://youtube.com https://www.youtube.com',
		'default-src': `'self' ${gaCsp} ${contentCdn} ${staticCdn}`.trim(),
		'font-src': `'self' data: ${staticCdn}`.trim(),
		'frame-src': 'https://youtube.com https://www.youtube.com',
		'img-src': `'self' data: ${gaCsp} ${contentCdn} ${staticCdn}`.trim(),
		'script-src':
			// tslint:disable-next-line:max-line-length
			`'self' 'unsafe-eval' 'unsafe-inline' ${gaCsp} https://www.youtube.com https://s.ytimg.com ${staticCdn}`.trim(),
		'style-src': `'self' 'unsafe-inline' ${staticCdn}`.trim(),
	}
	return policy
}
