import {NextFunction, Request, Response} from 'express'

import {ResourceNotFoundError} from '../exception/ResourceNotFoundError'
import {User} from '../model'
import {fetchProfile, getOrgHierarchy, updateProfileCache} from '../service/civilServantRegistry/csrsService'

export async function requiresDepartmentHierarchy(req: Request, res: Response, next: NextFunction) {
	const user: User = req.user
	if (user && user.organisationalUnit !== undefined) {
		try {
			const departmentHierarchy = await getOrgHierarchy(user.organisationalUnit.id, user)
			res.locals.departmentHierarchyCodes = departmentHierarchy.map(o => o.code)
		} catch (error) {
			if (error instanceof ResourceNotFoundError) {
				const profile = await fetchProfile(user.id, user.accessToken)
				profile.organisationalUnit = undefined
				await updateProfileCache(profile)
				res.redirect(`/profile/organisation`)
			}
		}
	}
	next()
}
