import {NextFunction, Request, Response} from 'express'
import * as log4js from 'log4js'
import * as config from '../config'
import {User} from '../model'

log4js.configure(config.LOGGING)
const logger = log4js.getLogger('profileChecker')

export class ProfileChecker {
	/* tslint:disable:variable-name */
	private _profileSections: ProfileSection[] = [
		new ProfileSection('givenName', '/profile/name', (user: User) => {
			return Boolean(user.givenName)
		}),
		new ProfileSection('organisationalUnit', '/profile/organisation', (user: User) => {
			// tslint:disable-next-line:max-line-length
			return (Boolean (!user.forceOrgChange.isForceOrgChange()) && (Boolean(user.organisationalUnit &&  user.organisationalUnit.name)))
		}),
		new ProfileSection('department', '/profile/organisation', (user: User) => {
			return (Boolean (!user.forceOrgChange.isForceOrgChange()) && (Boolean(user.department)))
		}),
		// new ProfileSection('enterToken', '/profile/enterToken', (user: User) => {
		// 	return Boolean(user.tokenzied)
		// }),
		new ProfileSection('areasOfWork', '/profile/profession', (user: User) => {
			return Boolean(user.areasOfWork && user.areasOfWork.length)
		}),
		new ProfileSection('otherAreasOfWork', '/profile/otherAreasOfWork', (user: User) => {
			return Boolean(user.otherAreasOfWork && user.otherAreasOfWork.length)
		}),
	]
	isProfileRequest(request: Request) {
		console.log(request.path)
		return Boolean(this._profileSections.filter(entry => {
			console.log(entry.path)
			return entry.path === request.path
		}).length)
	}
	checkProfile() {
		return 	(request: Request, response: Response, next: NextFunction) => {
			if (!this.isProfileRequest(request)) {
				if (request.path !== "/profile/enterToken" ) {
					try {
						for (const section of this._profileSections) {
							if (!section.isPresent(request.user)) {
								request.session!.save(() => {
									response.redirect(`${section.path}?originalUrl=${request.originalUrl}`)
								})
								return
							}
						}
					}	catch (error) {
						logger.error(error)
						next(error)
					}
				}
			}

			next()
		}
	}
}

class ProfileSection {
	/* tslint:disable:variable-name */
	private _name: string
	private _path: string
	private _isPresent: (user: User) => boolean

	constructor(name: string, path: string, isPresent: (user: User) => boolean) {
		this._name = name
		this._path = path
		this._isPresent = isPresent
	}

	get name(): string {
		return this._name
	}

	get path(): string {
		return this._path
	}

	get isPresent(): (user: User) => boolean {
		return this._isPresent
	}
}
