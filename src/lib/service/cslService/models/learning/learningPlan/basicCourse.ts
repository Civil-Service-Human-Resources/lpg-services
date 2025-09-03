import {RecordState} from '../../record'

export class BasicCourse {
	public id: string
	public title: string
	public shortDescription: string
	public type: string
	public duration: number
	public moduleCount: number
	public costInPounds: number
	public status: RecordState
}
