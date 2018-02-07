import * as express from 'express'
import * as template from 'lib/ui/template'
import * as youtube from 'lib/youtube'

export interface MetaInfo {
	info: youtube.BasicInfo
	url: string
}

export interface VideoInfo {
	id: string
	scriptBlock: string
	styleBlock: string
	title: string
}

export interface VideoList {
	videos: MetaInfo[]
}

function renderNotFound(req: express.Request) {
	return template.render('video/not-found', req, {})
}

function renderPlay(req: express.Request, props: VideoInfo) {
	return template.render('video/play', req, props)
}

function renderSelect(req: express.Request, props: VideoList) {
	return template.render('video/select', req, props)
}

const VIDEOS = [
	'https://www.youtube.com/watch?v=lQx6YBtQZbw',
	'https://www.youtube.com/watch?v=IPYeCltXpxw',
	'https://www.youtube.com/watch?v=_X0mgOOSpLU',
	'https://www.youtube.com/watch?v=_iUs3ZEBDjo',
]

export async function play(req: express.Request, res: express.Response) {
	const url = req.query.url
	if (!url) {
		const videos: MetaInfo[] = []
		for (const vid of VIDEOS) {
			const data = await youtube.getBasicInfo(vid)
			if (!data) {
				continue
			}
			console.log(data)
			videos.push({info: data, url: vid})
		}
		res.send(renderSelect(req, {videos}))
		return
	}
	const info = await youtube.getBasicInfo(url)
	if (!info) {
		res.send(renderNotFound(req))
		return
	}
	console.log(info)
	const duration = await youtube.getDuration(info.id)
	if (!duration) {
		res.send(renderNotFound(req))
		return
	}
	info.height = Math.floor(info.height * 1.5)
	info.width = Math.floor(info.width * 1.5)
	const video = {
		id: info.id,
		scriptBlock: `<script>
VIDEO_DURATION = ${duration}
VIDEO_HEIGHT = ${info.height}
VIDEO_ID = ${JSON.stringify(info.id)}
VIDEO_WIDTH = ${info.width}
</script>`,
		styleBlock: `<style>
.video iframe {
    border: 0;
    height: ${info.height}px;
    width: ${info.width}px;
}
</style>`,
		title: info.title,
	}
	res.send(renderPlay(req, video))
}
