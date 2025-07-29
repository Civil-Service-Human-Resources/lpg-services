import {RecordState} from '../../record'

export class LearningPlanCourse {
	public id: string
	public title: string
	public shortDescription: string
	public type: string
	public duration: number
	public moduleCount: number
	public costInPounds: number
	public status: RecordState
	public justAdded: boolean = false
}
