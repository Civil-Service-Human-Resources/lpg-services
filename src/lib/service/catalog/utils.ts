import { Audience, Course, OrganisationalUnit, User } from "lib/model"
import { getParentOrgs } from "lib/registry"


class AudienceRelevancyMap {

    primaryMandatedAudiences: AudienceWithScore[]
    mandatedAudiences: AudienceWithScore[]
    otherAudiences: AudienceWithScore[]

    constructor(primaryMandatedAudiences: AudienceWithScore[],
                mandatedAudiences: AudienceWithScore[],
                otherAudiences: AudienceWithScore[]) {
        this.primaryMandatedAudiences = primaryMandatedAudiences
        this.mandatedAudiences = mandatedAudiences
        this.otherAudiences = otherAudiences
    }

    getPrimaryMandatedAudience() {
        if (this.primaryMandatedAudiences.length) {
            this.primaryMandatedAudiences.sort((a, b) => {
                return a.audience.requiredBy!.getTime() - b.audience.requiredBy!.getTime()
            })
            return this.primaryMandatedAudiences[0]
        } else {
            return null
        }
    }

    getMandatedAudience() {
        if (this.mandatedAudiences.length) {
            this.mandatedAudiences.sort((a, b) => {
                return a.audience.requiredBy!.getTime() - b.audience.requiredBy!.getTime()
            })
            return this.mandatedAudiences[0]
        } else {
            return null
        }
    }

    getHighestScoringNonMandatedAudience() {
        if (this.otherAudiences.length) {
            this.otherAudiences.sort((a, b) => {
                return b.score - a.score
            })
            return this.otherAudiences[0]
        } else {
            return null
        }
    }

}

class AudienceWithScore {

    audience: Audience
    score: number

    constructor(audience: Audience, score: number) {
        this.audience = audience
        this.score = score
    }
}


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

async function getDepartmentRelevancyScore(audience: Audience, departmentHierarchy: string[]) {
    let score = 0
    for (let i = 0; i < departmentHierarchy.length; i++) {
        const dep = departmentHierarchy[i]        
        if (audience.departments.indexOf(dep) > -1) {
            score = 1
            // department match + requiredby = mandatory learning, so return the max score
            if (audience.requiredBy) {
                // If the department is the user's department (NOT a parent/grandparent) then
                // return an even higher score
                if (i === 0) {
                    return 4
                } else {
                    return 3
                }
            }
        }
    }

    return score
}

async function getAudienceRelevanceForUser(audience: Audience,
                                            userAreasOfWork: string[],
                                            userDepartmentHierarchy: string[],
                                            userGradeCode: string): Promise<AudienceWithScore> {
    let relevance = -1

    if (!(audience.areasOfWork.length || audience.departments.length || audience.grades.length)) {
        return new AudienceWithScore(audience, 0)
    }

    let departmentScore = await getDepartmentRelevancyScore(audience, userDepartmentHierarchy)

    if (departmentScore === 3) {
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

/**
 * Rank course audiences via a relevancy score.
 * 4 = This audience is mandatory (required learning) for the user's department
 * 3 = This audience is mandatory (required learning) for a parent/grandparent of the user's department
 * -1 - 2 = All other audiences, ranked by how applicable they are to the user's department/grade/interests
 */
async function getRelevancyMap(user: User, audiences: Audience[]): Promise<AudienceRelevancyMap> {

    let userDepartmentHierarchy = await getOrgHierarchy(user.department!)
    const userAreasOfWork = user.areasOfWork || []
    const userGradeCode = user.grade.code || ""

    let primaryMandatedAudiences: AudienceWithScore[] = []
    let mandatedAudiences: AudienceWithScore[] = []
    let otherAudiences: AudienceWithScore[] = []

    audiences.forEach(async (aud) => {
        let audWithRelevancyScore: AudienceWithScore = await getAudienceRelevanceForUser(aud, userAreasOfWork, userDepartmentHierarchy, userGradeCode)
        
        if (audWithRelevancyScore.score === 4) {
            primaryMandatedAudiences.push(audWithRelevancyScore)
        }else if (audWithRelevancyScore.score === 3) {
            mandatedAudiences.push(audWithRelevancyScore)
        } else {
            otherAudiences.push(audWithRelevancyScore)
        }
    })

    return new AudienceRelevancyMap(primaryMandatedAudiences, mandatedAudiences, otherAudiences)
}


export async function getAudience(course: Course, user: User): Promise<Audience|undefined> {
    const audiences = course.audiences

    const relevanceMap = await getRelevancyMap(user, audiences)

    const primaryMandatedAudience = relevanceMap.getPrimaryMandatedAudience()
    if (primaryMandatedAudience !== null) {
        return primaryMandatedAudience.audience
    }

    const mandatedAudience = relevanceMap.getMandatedAudience()
    if (mandatedAudience !== null) {
        return mandatedAudience.audience
    }

    const nextHighestRatedAudience = relevanceMap.getHighestScoringNonMandatedAudience()
    if (nextHighestRatedAudience !== null) {
        return nextHighestRatedAudience.audience
    }

    return undefined

}