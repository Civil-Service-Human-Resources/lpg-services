import {NextFunction, Request, Response} from 'express'

import {ResourceNotFoundError} from '../exception/ResourceNotFoundError'
import {User} from '../model'
import {getOrgHierarchy} from '../service/civilServantRegistry/csrsService'

export async function requiresDepartmentHierarchy(req: Request, res: Response, next: NextFunction) {
	const user: User = req.user
	if (user && user.departmentId) {
		try {
			const departmentHierarchyCodes = (await getOrgHierarchy(user.departmentId, user)).map(o => o.code)
			res.locals.departmentHierarchyCodes = departmentHierarchyCodes
		} catch (error) {
			if (error instanceof ResourceNotFoundError) {
				user.department = undefined
				user.departmentId = undefined
				user.organisationalUnit = undefined
				req.session!.passport.user = JSON.stringify(user)

				/* tslint:disable-next-line:no-empty */
				req.session!.save(() => {})
				res.redirect(`/profile/organisation?originalUrl=${req.originalUrl}`)
			}
		}
	}
	next()
}
