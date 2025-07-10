import {getLogger} from '../../logger'
import {OrganisationalUnit, User} from '../../model'
import {AreaOfWork, Grade, Interest, Profile} from '../../registry'
import {AnonymousCache} from '../../utils/anonymousCache'
import {learningRecordCache, requiredLearningCache} from '../cslService/cslServiceClient'
import {AreasOfWork} from './areaOfWork/areasOfWork'
import * as civilServantClient from './civilServant/civilServantClient'
import {ProfileCache} from './civilServant/profileCache'
import * as gradeClient from './grade/gradeClient'
import {Grades} from './grade/grades'
import * as interestClient from './interest/interestClient'
import * as cslService from '../cslService/cslServiceClient'
import {Interests} from './interest/interests'
import {OrganisationalUnitTypeAhead} from './models/organisationalUnitTypeAhead'
import {PatchCivilServant} from './models/patchCivilServant'
import {OrganisationalUnitCache} from './organisationalUnit/organisationalUnitCache'
import {OrganisationalUnitTypeaheadCache} from './organisationalUnit/organisationalUnitTypeaheadCache'
import * as organisationalUnitClient from './organisationalUnit/organisationUnitClient'

const logger = getLogger('csrsService')

let organisationalUnitCache: OrganisationalUnitCache
let organisationalUnitTypeaheadCache: OrganisationalUnitTypeaheadCache
let profileCache: ProfileCache
let gradeCache: AnonymousCache<Grades>
let areaOfWorkCache: AnonymousCache<AreasOfWork>
let interestCache: AnonymousCache<Interests>

export function setCaches(
	orgCache: OrganisationalUnitCache,
	orgTypeaheadCache: OrganisationalUnitTypeaheadCache,
	csrsProfileCache: ProfileCache,
	csrsGradeCache: AnonymousCache<Grades>,
	csrsAreaOfWorkCache: AnonymousCache<AreasOfWork>,
	csrsInterestCache: AnonymousCache<Interests>
) {
	organisationalUnitCache = orgCache
	organisationalUnitTypeaheadCache = orgTypeaheadCache
	profileCache = csrsProfileCache
	gradeCache = csrsGradeCache
	areaOfWorkCache = csrsAreaOfWorkCache
	interestCache = csrsInterestCache
}

export async function setLogoutFlag(uid: string) {
	logger.info(`Logout flag being set for user ${uid}`)
	const profile = await profileCache.get(uid)
	if (profile) {
		profile.setShouldLogout()
		await updateProfileCache(profile)
	}
}

export async function removeProfileFromCache(uid: string) {
	logger.debug(`Removing user ${uid} from profile cache`)
	await profileCache.delete(uid)
}

export async function fetchNewProfile(accessToken: string) {
	const profile = await civilServantClient.loginAndFetchProfile(accessToken)
	await updateProfileCache(profile)
	return profile
}

export async function fetchProfile(uid: string, accessToken: string): Promise<Profile> {
	let profile = await profileCache.get(uid)
	if (!profile) {
		profile = await fetchNewProfile(accessToken)
	}
	return profile
}

export async function updateProfileCache(profile: Profile) {
	await profileCache.setObject(profile)
}

export async function patchCivilServantOrganisationUnit(user: User, organisationUnitId: number) {
	await civilServantClient.patchCivilServantOrganisation(user, organisationUnitId)
	const profile = await fetchProfile(user.id, user.accessToken)
	profile.organisationalUnit = await getOrganisation(user, organisationUnitId)
	await updateProfileCache(profile)
	user.updateWithProfile(profile)
	await learningRecordCache.delete(user.id)
	await requiredLearningCache.delete(user.id)
}

export async function patchCivilServantName(user: User, name: string) {
	const patch = new PatchCivilServant(name, undefined, undefined, undefined, undefined)
	await patchCivilServant(user, patch)
}

export async function patchCivilServantProfession(user: User, areaOfWork: AreaOfWork) {
	const patch = new PatchCivilServant(undefined, undefined, undefined, areaOfWork, undefined)
	await patchCivilServant(user, patch)
}

export async function updateCivilServantOtherAreasOfWork(user: User, areasOfWork: AreaOfWork[], newProfile: boolean) {
	await cslService.setOtherAreasOfWork(
		user,
		areasOfWork.map(aow => aow.getId()),
		newProfile
	)
	const profile = await fetchProfile(user.id, user.accessToken)
	profile.otherAreasOfWork = areasOfWork
	await profileCache.setObject(profile)
	user.updateWithProfile(profile)
}

export async function patchCivilServantGrade(user: User, grade: Grade) {
	const patch = new PatchCivilServant(undefined, grade, undefined, undefined, undefined)
	await patchCivilServant(user, patch)
}

export async function patchCivilServantInterests(user: User, interests: Interest[]) {
	const patch = new PatchCivilServant(undefined, undefined, interests, undefined, undefined)
	await patchCivilServant(user, patch)
}

export async function patchCivilServant(user: User, patch: PatchCivilServant) {
	await civilServantClient.patchCivilServant(user, patch)
	const profile = await fetchProfile(user.id, user.accessToken)
	profile.updateWithPatch(patch)
	await updateProfileCache(profile)
	user.updateWithProfile(profile)
}

export async function patchCivilServantLineManager(user: User, lineManagerEmail: string) {
	const updatedrofile = await civilServantClient.checkAndUpdateLineManager(user, lineManagerEmail)
	const profile = await fetchProfile(user.id, user.accessToken)
	profile.lineManagerEmailAddress = updatedrofile.lineManagerEmailAddress
	profile.lineManagerName = updatedrofile.lineManagerName
	await updateProfileCache(profile)
	user.updateWithProfile(profile)
}

export async function getAreasOfWork(user: User): Promise<AreasOfWork> {
	let areasOfWork = await areaOfWorkCache.get()
	if (areasOfWork === undefined) {
		areasOfWork = AreasOfWork.createFromTree(await cslService.getAreasOfWork(user))
		await areaOfWorkCache.set(areasOfWork)
	}
	return areasOfWork
}

export async function getGrades(user: User): Promise<Grades> {
	let grades = await gradeCache.get()
	if (!grades) {
		grades = new Grades(await gradeClient.getGrades(user))
		await gradeCache.set(grades)
	}
	return grades
}

export async function getInterests(user: User): Promise<Interests> {
	let interests = await interestCache.get()
	if (!interests) {
		interests = new Interests(await interestClient.getInterests(user))
		await interestCache.set(interests)
	}
	return interests
}

export async function getOrganisation(
	user: User,
	organisationalUnitId: number,
	includeParent: boolean = false
): Promise<OrganisationalUnit> {
	let org = await organisationalUnitCache.get(organisationalUnitId)
	if (org === undefined) {
		org = await organisationalUnitClient.getOrganisationalUnit(
			organisationalUnitId,
			{includeParents: includeParent},
			user
		)
		await organisationalUnitCache.setMultiple(org.getHierarchyAsArray())
	}
	if (includeParent && org.parentId != null && org.parent == null) {
		org.parent = await getOrganisation(user, org.parentId)
	}
	return org
}

async function refreshTypeahead(user: User): Promise<OrganisationalUnitTypeAhead> {
	const organisationalUnits = await organisationalUnitClient.getAllOrganisationalUnits(user)
	const typeahead = OrganisationalUnitTypeAhead.createAndSort(organisationalUnits)
	await organisationalUnitTypeaheadCache.setTypeahead(typeahead)
	return typeahead
}

export async function getOrgHierarchy(
	organisationId: number,
	user: User,
	hierarchy: OrganisationalUnit[] = []
): Promise<OrganisationalUnit[]> {
	const org = await organisationalUnitCache.get(organisationId)
	if (org == null) {
		const orgWithAllParents = await organisationalUnitClient.getOrganisationalUnit(
			organisationId,
			{includeParents: true},
			user
		)
		const orgArray = orgWithAllParents.getHierarchyAsArray()
		await organisationalUnitCache.setMultiple(orgArray)
		hierarchy.push(...orgArray)
	} else {
		hierarchy.push(org)
		if (org.parentId) {
			return await getOrgHierarchy(org.parentId, user, hierarchy)
		}
	}
	return hierarchy
}

export async function getAllOrganisationUnits(user: User): Promise<OrganisationalUnitTypeAhead> {
	let typeahead = await organisationalUnitTypeaheadCache.getTypeahead()
	if (typeahead === undefined) {
		typeahead = await refreshTypeahead(user)
	}
	return typeahead
}
