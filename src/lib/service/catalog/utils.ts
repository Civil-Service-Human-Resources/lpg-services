import { getLogger } from "lib/logger"
import { Audience, OrganisationalUnit, User } from "lib/model"
import { getParentOrgs } from "lib/registry"

const logger = getLogger('utils.ts')

export abstract class AudienceBracket {

	audiences: AudienceWithScore[] = []
	minScore: number
	maxScore: number

	constructor(minScore: number, maxScore: number) {
		this.minScore = minScore
		this.maxScore = maxScore
	}

	abstract sort(): void

	async getTop(): Promise<AudienceWithScore|null> {
		if (this.audiences.length) {
			this.sort()
			return this.audiences[0]
		} else {
			return null
		}
	}

}

export class StandardAudienceBracket extends AudienceBracket {

	sort() {
		this.audiences.sort((a, b) => {
			return b.score - a.score
		})
	}

}

export class MandatoryAudienceBracket extends AudienceBracket {

	sort() {
		this.audiences.sort((a, b) => {
			return a.audience.requiredBy!.getTime() - b.audience.requiredBy!.getTime()
		})
	}

}

export class AudienceMap {

	audienceBrackets: AudienceBracket[]

	constructor(providedBrackets: AudienceBracket[]) {
		this.audienceBrackets = providedBrackets
	}

	async getBracket(score: number): Promise<AudienceBracket|null> {
		const matchingBrackets = this.audienceBrackets.filter(bracket => {
			return (score <= bracket.maxScore && score >= bracket.minScore)
		})
		if (matchingBrackets) {
			return matchingBrackets[0]
		}
		return null
	}

	async addAudience(audience: AudienceWithScore) {
		const audienceBracket = await this.getBracket(audience.score)
		if (audienceBracket !== null) {
			audienceBracket.audiences.push(audience)
		}
	}

}

export class AudienceWithScore {

	audience: Audience
	score: number

	constructor(audience: Audience, score: number) {
		this.audience = audience
		this.score = score
	}
}

const audienceBrackets: AudienceBracket[] = [
	new MandatoryAudienceBracket(4, 4),
	new MandatoryAudienceBracket(3, 3),
	new StandardAudienceBracket(-1, 2),
]

/**
 * getParentOrgs will return a list of Organisation objects, where the first element
 * is the provided org. Parents/graparents will appear in the list in
 * hierarchical order. If there are no parents, then just the provided org will be returned.
 */
export async function getOrgHierarchy(orgCode: string): Promise<string[]> {
	const orgArray: OrganisationalUnit[] = await getParentOrgs(orgCode)
	const hierarchy: string[] = orgArray.map(org => org.code)
	return hierarchy
}

export async function getDepartmentRelevancyScore(audience: Audience, departmentHierarchy: string[]) {
	let score = 0
	for await (const audienceDep of audience.departments) {
		const depIndex = departmentHierarchy.indexOf(audienceDep)
		if (depIndex > -1) {
			score = 1
			if (audience.requiredBy) {
				if (depIndex === 0) {
					return 4
				}
				return 3
			}
		}
	}
	return score
}

export async function getAudienceRelevanceForUser(
												audience: Audience,
												userAreasOfWork: string[],
												userDepartmentHierarchy: string[],
												userGradeCode: string): Promise<AudienceWithScore> {
	let relevance = -1
	logger.debug(`AUDIENCE: ${JSON.stringify(audience)}`)
	logger.debug(`DEP HIERARCHY: ${JSON.stringify(userDepartmentHierarchy)}`)
	logger.debug(`GRADE CODE: ${JSON.stringify(userGradeCode)}`)
	logger.debug(`AREAS OF WORK: ${JSON.stringify(userAreasOfWork)}`)
	if (!(audience.areasOfWork.length || audience.departments.length || audience.grades.length)) {
		return new AudienceWithScore(audience, 0)
	}

	const departmentScore = await getDepartmentRelevancyScore(audience, userDepartmentHierarchy)
	logger.debug(`Dep relevancy score: ${departmentScore}`)

	// A score equal to or higher than 3 indicates mandatory learning
	if (departmentScore >= 3) {
		return new AudienceWithScore(audience, departmentScore)
	} else {
		relevance += departmentScore
	}

	if (audience.areasOfWork.filter(areaOfWork => userAreasOfWork.indexOf(areaOfWork) > -1).length) {
		relevance += 1
	}

	if (audience.grades.indexOf(userGradeCode) > -1) {
		relevance += 1
	}
	return new AudienceWithScore(audience, relevance)
}

export async function getRelevancyMap(user: User, audiences: Audience[]) {
	const userDepartmentHierarchy = await getOrgHierarchy(user.department!)
	const userAreasOfWork = user.areasOfWork || []
	let userGradeCode = ""
	if (user.grade) {
		userGradeCode = user.grade.code || ""
	}

	const audienceMap = new AudienceMap(audienceBrackets)
	for await (const audience of audiences) {
		const audWithRelevancyScore: AudienceWithScore = await getAudienceRelevanceForUser(
			audience,
			userAreasOfWork,
			userDepartmentHierarchy,
			userGradeCode)
		logger.debug(`Final score: ${audWithRelevancyScore.score}`)
		await audienceMap.addAudience(audWithRelevancyScore)
	}

	return audienceMap
}

export async function getAudience(audiences: Audience[], user: User): Promise<Audience|undefined> {
	logger.debug(`AUDIENCE COUNT: ${audiences.length}`)
	const relevanceMap = await getRelevancyMap(user, audiences)
	for await (const audienceBracket of relevanceMap.audienceBrackets) {
		const topAudience = await audienceBracket.getTop()
		if (topAudience) {
			logger.debug(`FINAL AUDIENCE: ${JSON.stringify(topAudience.audience)}`)
			return topAudience.audience
		}
	}

	return undefined

}
