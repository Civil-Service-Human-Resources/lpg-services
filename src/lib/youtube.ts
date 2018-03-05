import axios from 'axios'
import * as config from 'lib/config'

export interface BasicInfo {
	height: number
	id: string
	thumbnail_height: string
	thumbnail_url: string
	thumbnail_width: string
	title: string
	width: number
}

function convertDuration(isoDuration: string): string {
	return isoDuration.substr(2).toLowerCase()
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
): Promise<string | undefined> {
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
