import {CourseStatus} from '../../../../lib/model'
import {PageWithBackLink} from '../../models/BasePages'
import {BaseModuleCard} from './moduleCard'

export interface CoursePage {
	title: string
	description: string
	status: CourseStatus
	learningOutcomes: string
}

export interface CourseDetails {
	duration: string
	areasOfWork: string[]
	grades: string[]
	cost: number | undefined
	location?: string
}

export interface BasicCoursePage extends CoursePage, PageWithBackLink {}

export interface ContentCoursePage extends BasicCoursePage, CourseDetails {
	type: string
}

export interface SingleModuleCoursePage extends ContentCoursePage {
	moduleDetails: BaseModuleCard
}

export interface BlendedCoursePage extends ContentCoursePage {
	modules: BaseModuleCard[]
	mandatoryModuleCount: number
}
