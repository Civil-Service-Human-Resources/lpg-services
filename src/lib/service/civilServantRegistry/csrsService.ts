import {ResourceNotFoundError} from '../../exception/ResourceNotFoundError'
import {getLogger} from '../../logger'
import {OrganisationalUnit, User} from '../../model'
import {AreaOfWork, Grade, Interest, Profile} from '../../registry'
import {AnonymousCache} from '../../utils/anonymousCache'
import {learningRecordCache, requiredLearningCache} from '../cslService/cslServiceClient'
import {GetOrganisationalUnitParams} from '../cslService/models/csrs/getOrganisationalUnitParams'
import {AreasOfWork} from './areaOfWork/areasOfWork'
import * as civilServantClient from './civilServant/civilServantClient'
import {ProfileCache} from './civilServant/profileCache'
import {Grades} from './grade/grades'
import * as interestClient from './interest/interestClient'
import * as cslService from '../cslService/cslServiceClient'
import {Interests} from './interest/interests'
import {PatchCivilServant} from './models/patchCivilServant'
import {OrganisationalUnitCache} from './organisationalUnit/organisationalUnitCache'
import * as organisationalUnitClient from './organisationalUnit/organisationUnitClient'

const logger = getLogger('csrsService')

let organisationalUnitCache: OrganisationalUnitCache
let profileCache: ProfileCache
let gradeCache: AnonymousCache<Grades>
let areaOfWorkCache: AnonymousCache<AreasOfWork>
let interestCache: AnonymousCache<Interests>

export function setCaches(
	orgCache: OrganisationalUnitCache,
	csrsProfileCache: ProfileCache,
	csrsGradeCache: AnonymousCache<Grades>,
	csrsAreaOfWorkCache: AnonymousCache<AreasOfWork>,
	csrsInterestCache: AnonymousCache<Interests>
) {
	organisationalUnitCache = orgCache
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

export async function updateCivilServantOrganisationalUnit(user: User, organisationUnitId: number) {
	await cslService.setOrganisationUnit(user, organisationUnitId)
	const profile = await fetchProfile(user.id, user.accessToken)
	profile.organisationalUnit = await getOrganisation(user, organisationUnitId)
	await updateProfileCache(profile)
	user.updateWithProfile(profile)
	await learningRecordCache.delete(user.id)
	await requiredLearningCache.delete(user.id)
}

export async function updateCivilServantName(user: User, fullName: string, newProfile: boolean) {
	await cslService.setFullName(user, fullName, newProfile)
	const profile = await fetchProfile(user.id, user.accessToken)
	profile.fullName = fullName
	await profileCache.setObject(profile)
	user.updateWithProfile(profile)
}

export async function updateCivilServantProfession(user: User, areaOfWork: AreaOfWork) {
	await cslService.setProfession(user, areaOfWork.getId())
	const profile = await fetchProfile(user.id, user.accessToken)
	profile.profession = areaOfWork
	await profileCache.setObject(profile)
	user.updateWithProfile(profile)
}

export async function updateCivilServantOtherAreasOfWork(user: User, areasOfWork: AreaOfWork[]) {
	await cslService.setOtherAreasOfWork(
		user,
		areasOfWork.map(aow => aow.getId())
	)
	const profile = await fetchProfile(user.id, user.accessToken)
	profile.otherAreasOfWork = areasOfWork
	await profileCache.setObject(profile)
	user.updateWithProfile(profile)
}

export async function updateCivilServantGrade(user: User, grade: Grade) {
	await cslService.setGrade(user, grade.getId())
	const profile = await fetchProfile(user.id, user.accessToken)
	profile.grade = grade
	await profileCache.setObject(profile)
	user.updateWithProfile(profile)
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
	if (grades === undefined) {
		grades = new Grades(await cslService.getGrades(user))
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

async function getOrganisationsWithDefaultParams(user: User, organisationalUnitIds: number[]) {
	const params = new GetOrganisationalUnitParams(organisationalUnitIds, true)
	const resp = await cslService.getOrganisationalUnits(params, user)
	for (const organisationalUnit of resp.organisationalUnits) {
		await organisationalUnitCache.setObject(organisationalUnit)
	}
	return resp
}

async function getOrganisationWithDefaultParams(user: User, organisationalUnitId: number): Promise<OrganisationalUnit | undefined> {
	const resp = await getOrganisationsWithDefaultParams(user, [organisationalUnitId])
	console.log(organisationalUnitId)
	console.log(resp.organisationalUnits)
	return resp.organisationalUnits.find(o => o.id === organisationalUnitId)
}

export async function getOrganisation(user: User, organisationalUnitId: number): Promise<OrganisationalUnit> {
	let org = await organisationalUnitCache.get(organisationalUnitId)
	if (org === undefined) {
		org = await getOrganisationWithDefaultParams(user, organisationalUnitId)
		if (org === undefined) {
			throw new ResourceNotFoundError(`Organisation with ID ${organisationalUnitId} not found`)
		}
	}
	return org
}

export async function getOrgHierarchy(organisationalUnitId: number, user: User, hierarchy: OrganisationalUnit[] = []): Promise<OrganisationalUnit[]> {
	const org = await organisationalUnitCache.get(organisationalUnitId)
	if (org === undefined) {
		const resp = await getOrganisationsWithDefaultParams(user, [organisationalUnitId])
		hierarchy.push(...resp.getHierarchy(organisationalUnitId))
	} else {
		hierarchy.push(org)
		if (org.parentId) {
			hierarchy = await getOrgHierarchy(org.parentId, user, hierarchy)
		}
	}
	return hierarchy
}

export async function getOrganisationalUnitsForSearch(user: User): Promise<OrganisationalUnit[]> {
	const resp = await organisationalUnitClient.getOrganisationalUnits(
		{
			page: 0,
			size: 20,
		},
		user
	)
	return resp.content
}
