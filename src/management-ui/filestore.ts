import * as azure from 'azure-storage'
import * as fs from 'fs'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as log4js from 'log4js'
import * as mime from 'mime-types'
import * as path from 'path'
import {Readable, Writable} from 'stream'
import * as streamifier from 'streamifier'
import * as unzip from 'unzip'
import * as xml2js from 'xml2js'

const blob = azure.createBlobService()
const logger = log4js.getLogger('lib/management-ui/fileStore')

const filesToSubstitute: Record<string, {data: string | null; set: boolean}> = {
	'close_methods.js': {
		data: null,
		set: false,
	},
	'player_overrides.js': {
		data: null,
		set: false,
	},
	'tincan_wrapper.js': {
		data: null,
		set: false,
	},
}

async function parseMetadata(entry: unzip.Entry) {
	return new Promise((resolve, reject) => {
		let content = ''
		entry.pipe(
			new Writable({
				final: () => {
					resolve(content)
				},
				write: (chunk: any, encoding: any, next: any) => {
					content += chunk.toString()
					next()
				},
			})
		)
	})
		.then(content => {
			return new Promise((resolve, reject) => {
				xml2js.parseString(content, (err, data) => {
					if (err) {
						reject(err)
					} else {
						resolve(data)
					}
				})
			})
		})
		.then((data: any) => {
			if (data.manifest) {
				let identifier
				let title
				let launchPage
				if (data.manifest.organizations) {
					for (const wrapper of data.manifest.organizations) {
						const organization = wrapper.organization
						if (organization.length) {
							identifier = organization[0].$.identifier
							if (organization[0].title && organization[0].title.length) {
								title = organization[0].title[0]
							}
							break
						}
					}
				}
				if (data.manifest.resources) {
					for (const wrapper of data.manifest.resources) {
						const resource = wrapper.resource
						if (resource.length) {
							const type = resource[0].$['adlcp:scormtype']
							const href = resource[0].$.href
							if (type === 'sco') {
								launchPage = href
								break
							}
						}
					}
				}
				return {
					identifier,
					launchPage,
					title,
				}
			}
			return {}
		})
}

export async function saveContent(
	course: model.Course,
	module: model.Module,
	file: any,
	isFileName: boolean = false
) {
	const responses = await uploadEntries(
		`${course.id}/${module.id}`,
		file,
		isFileName
	)

	const metadata = responses.find(result => !!result)

	if (!metadata || !metadata.launchPage) {
		// 	// TODO: if no launch page...
		throw new Error(
			`No launch page found for course ${course.id} and module ${module.id}`
		)
	}

	const currentCourse = await catalog.get(course.id)
	const currentModule = currentCourse!.modules.find(m => m.id === module.id)
	currentModule!.startPage = metadata.launchPage

	await catalog.add(currentCourse!)

	fs.unlinkSync(file.name)
}

async function getFile(filename: string) {
	const fpath = path.join(__dirname, '..', '..', 'ui', 'assets', 'js', filename)

	return new Promise(async (resolve, reject) => {
		let readStream: fs.ReadStream
		let data = ''
		if (filesToSubstitute[filename].set) {
			resolve(filesToSubstitute[filename].data as string)
		} else {
			try {
				readStream = fs.createReadStream(fpath)
				readStream
					.on('data', chunk => {
						data += chunk
					})
					.on('end', () => {
						filesToSubstitute[filename].set = true
						filesToSubstitute[filename].data = data
						resolve(data)
					})
			} catch (e) {
				reject(e)
			}
		}
	})
		.then(data => {
			return new Readable({
				read(size) {
					this.push(filesToSubstitute[filename].data)
					this.push(null)
				},
			})
		})
		.catch(data => {
			throw new Error('Error reading data')
		})
}

async function upload(uid: string, entry: unzip.Entry) {
	return new Promise<any>(async (resolve, reject) => {
		let metadata = {}

		const filename = entry.path.substring(entry.path.lastIndexOf('/') + 1)
		const storagePath = `${uid}/${entry.path}`
		logger.debug(`uploading to: ${storagePath}`)
		if (Object.keys(filesToSubstitute).indexOf(filename) >= 0) {
			const fileData = (await getFile(filename)) as fs.ReadStream
			fileData.pipe(
				blob.createWriteStreamToBlockBlob(
					'lpgdevcontent',
					storagePath,
					{
						contentSettings: {
							contentType:
								mime.lookup(entry.path) || 'application/octet-stream',
						},
					},
					err => {
						if (err) {
							reject(err)
						} else {
							resolve(null)
						}
					}
				)
			)
		} else {
			// buisness as usual
			if (entry.path.endsWith('imsmanifest.xml')) {
				metadata = await parseMetadata(entry)
			}

			const mimeType = mime.lookup(entry.path) || 'application/octet-stream'
			entry.pipe(
				blob.createWriteStreamToBlockBlob(
					'lpgdevcontent',
					storagePath,
					{
						contentSettings: {
							contentType: mimeType,
						},
					},
					err => {
						if (err) {
							reject(err)
						} else {
							resolve(metadata)
						}
					}
				)
			)
		}
	})
}

async function uploadEntries(
	uid: string,
	file: any,
	isFileName: boolean = false
) {
	return new Promise<any[]>((resolve, reject) => {
		const promises: any[] = []
		const stream = isFileName
			? fs.createReadStream(file)
			: streamifier.createReadStream(file.data)
		stream
			.pipe(unzip.Parse())
			.on('entry', (entry: unzip.Entry) => {
				if (entry.type === 'Directory') {
					entry.autodrain()
					return
				}
				promises.push(upload(uid, entry))
			})
			.on('close', () => {
				Promise.all(promises)
					.then(resolve)
					.catch(reject)
			})
			.on('error', reject)
	})
}
