import * as azure from 'azure-storage'
import * as fs from 'fs'
import * as config from 'lib/config'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as log4js from 'log4js'
import * as mime from 'mime-types'
import * as path from 'path'
import {Writable} from 'stream'
import * as streamifier from 'streamifier'
import * as unzip from 'unzip'
import * as xml2js from 'xml2js'

const blob = azure.createBlobService()
const logger = log4js.getLogger('lib/management-ui/fileStore')

const filesToSubstitute = [
	'close_methods.js',
	'portal_overrides.js',
	'tincan_wrapper.js',
]

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
	file: any
) {
	logger.info(`Starting upload of ${file.name} to ${course.id}/${module.id}`)

	const currentCourse = await catalog.get(course.id)!
	const currentModule = currentCourse!.modules.find(m => m.id === module.id)!
	if (module.type === 'elearning') {
		const responses = await uploadEntries(
			`${course.id}/${module.id}`,
			file.name,
			true
		)
		const metadata = responses.find(result => !!result)
		if (!metadata || !metadata.launchPage) {
			// 	// TODO: if no launch page...
			throw new Error(
				`No launch page found for course ${course.id} and module ${module.id}`
			)
		}

		currentModule.startPage = metadata.launchPage
		await catalog.add(currentCourse!)

		logger.info(
			`Upload of ${file.name} complete, startPage set to ${metadata.launchPage}`
		)
	} else {
		//if it is a document
		if (module.type === 'video') {
			currentModule.location = `${config.CONTENT_URL}/${course.id}/${
				currentModule.id
			}/${file.name}`
		} else {
			currentModule.url = `${config.CONTENT_URL}/${course.id}/${
				currentModule.id
			}/${file.name}`
		}

		if (file.duration) {
			currentModule.duration = file.duration
		}

		const fileData = fs.createReadStream(file.path)
		await doUpload(`${course.id}/${module.id}/${file.name}`, fileData)

		await catalog.add(currentCourse!)
		logger.info(`Upload of ${file.name} complete, with no start page`)
	}

	fs.unlinkSync(file.path)
	logger.info(`${file.name} removed`)
}

async function upload(uid: string, entry: unzip.Entry) {
	let metadata: any = null
	const filename = entry.path.substring(entry.path.lastIndexOf('/') + 1)
	const storagePath = `${uid}/${entry.path}`
	logger.debug(`uploading to: ${storagePath}`)

	if (filesToSubstitute.indexOf(filename) > -1) {
		entry.autodrain()
		const fileData = getFile(filename)
		await doUpload(storagePath, fileData)
	} else {
		if (entry.path.endsWith('imsmanifest.xml')) {
			metadata = await parseMetadata(entry)
		}
		await doUpload(storagePath, entry)
	}
	return metadata
}

function getFile(filename: string) {
	const filePath = path.join(
		__dirname,
		'..',
		'..',
		'ui',
		'assets',
		'js',
		filename
	)
	return fs.createReadStream(filePath)
}

async function doUpload(storagePath: string, entry: any) {
	await new Promise((resolve, reject) => {
		entry
			.pipe(
				blob.createWriteStreamToBlockBlob(
					config.CONTENT_CONTAINER,
					storagePath,
					{
						contentSettings: {
							contentType:
								mime.lookup(storagePath) || 'application/octet-stream',
						},
					},
					(err, blobData) => {
						if (err) {
							reject(err)
						} else {
							resolve(blobData)
						}
					}
				)
			)
			.on('error', (e: Error) => {
				reject(e)
			})
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
