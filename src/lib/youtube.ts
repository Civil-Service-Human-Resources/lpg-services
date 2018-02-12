import {default as axios} from 'axios'
import * as config from './config'

export interface BasicInfo {
	height: number
	id: string
	thumbnail_height: string
	thumbnail_url: string
	thumbnail_width: string
	title: string
	width: number
}

// From:
// https://github.com/google/closure-library/blob/master/closure/goog/date/date.js
const isoRegex = new RegExp(
	'^(-)?P(?:(\\d+)Y)?(?:(\\d+)M)?(?:(\\d+)D)?' +
		'(T(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+(?:\\.\\d+)?)S)?)?$'
)

function convertDuration(isoDuration: string): number | undefined {
	const parts = isoDuration.match(isoRegex)
	if (!parts) {
		return
	}
	// Abort if the duration specifies either year or month components.
	if (parts[2] || parts[3]) {
		return
	}
	let duration = 0
	duration += parseFloat(parts[8]) || 0
	duration += (parseInt(parts[7], 10) || 0) * 60
	duration += (parseInt(parts[6], 10) || 0) * 3600
	duration += (parseInt(parts[4], 10) || 0) * 86400
	// Accept the leading minus sign for now, but might want to abort in future.
	if (parts[1]) {
		return -duration
	}
	return duration
}

// NOTE: Callers may want to retry in case of error with YouTube.
export async function getBasicInfo(
	url: string
): Promise<BasicInfo | undefined> {
	let resp
	try {
		resp = await axios.get(
			`https://www.youtube.com/oembed?url=${encodeURIComponent(
				url
			)}&format=json&key=${config.YOUTUBE_API_KEY}`
		)
	} catch (err) {
		return
	}
	if (resp.status !== 200) {
		return
	}
	if (resp.data.type !== 'video' && resp.data.html) {
		return
	}
	const suffix = resp.data.html.split('embed/')[1]
	if (!suffix) {
		return
	}
	const id = suffix.split('?')[0]
	if (!id) {
		return
	}
	return {
		height: resp.data.height,
		id,
		thumbnail_height: resp.data.thumbnail_height,
		thumbnail_url: resp.data.thumbnail_url,
		thumbnail_width: resp.data.thumbnail_width,
		title: resp.data.title,
		width: resp.data.width,
	}
}

export async function getDuration(
	videoID: string
): Promise<number | undefined> {
	let resp
	try {
		resp = await axios.get(
			`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoID}&key=${
				config.YOUTUBE_API_KEY
			}`
		)
	} catch (err) {
		return
	}
	if (resp.data && resp.data.items && resp.data.items[0]) {
		return convertDuration(resp.data.items[0].contentDetails.duration)
	}
}
