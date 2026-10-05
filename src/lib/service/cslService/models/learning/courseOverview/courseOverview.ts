import {Transform, Type} from 'class-transformer'
import {GRADE_PRIORITY_MAP, GRADE_PRIORITY_ORDER_ENABLED} from '../../../../../config'
import {CourseStatus, CourseType} from '../../../../../model'
import {F2FModuleOverview, FileModuleOverview, ModuleOverview} from './moduleOverview'
import {TagOverview} from './tagOverview'

export type LearningPlanStatus = 'IS_IN_LEARNING_PLAN' | 'NOT_IN_LEARNING_PLAN' | 'CANNOT_BE_ADDED_TO_LEARNING_PLAN'

export const reprioritiseGrades = (grades: string[]) => {
	if (!GRADE_PRIORITY_ORDER_ENABLED) {
		return grades
	}
	return (grades as string[])
		.map((grade: string) => ({
			original: grade,
			lower: grade.toLowerCase(),
			priority: GRADE_PRIORITY_MAP.has(grade.toLowerCase())
				? GRADE_PRIORITY_MAP.get(grade.toLowerCase())!
				: Number.MAX_SAFE_INTEGER,
		}))
		.sort((a, b) => {
			if (a.priority !== b.priority) {
				return a.priority - b.priority
			}

			const lowerCompare = a.lower.localeCompare(b.lower)
			if (lowerCompare !== 0) {
				return lowerCompare
			}

			return a.original.localeCompare(b.original)
		})
		.map(item => item.original)
}

export class CourseOverview {
	public id: string
	public title: string
	public description: string
	public status: CourseStatus
	public learningOutcomes: string
	public isInLearningPlan: LearningPlanStatus
	public type: CourseType
	public duration: number
	@Type(() => TagOverview)
	public learningTags: TagOverview[]

	@Transform(({value}) => reprioritiseGrades(value))
	public grades: string[]
	public areasOfWork: string[]
	public costInPounds: number
	@Type(() => ModuleOverview, {
		discriminator: {
			property: 'type',
			subTypes: [
				{value: FileModuleOverview, name: 'file'},
				{value: F2FModuleOverview, name: 'face-to-face'},
				{value: ModuleOverview, name: 'elearning'},
				{value: ModuleOverview, name: 'link'},
				{value: ModuleOverview, name: 'video'},
			],
		},
		keepDiscriminatorProperty: true,
	})
	public modules: ModuleOverview[]

	public mandatoryModuleCount: number
}