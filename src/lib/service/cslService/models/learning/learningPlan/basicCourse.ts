import {RecordState} from '../../record'
import {ICourse} from '../../../../../model'

export class BasicCourse implements ICourse {
	public id: string
	public title: string
	public shortDescription: string
	public type: string
	public duration: number
	public moduleCount: number
	public costInPounds: number
	public status: RecordState
}
