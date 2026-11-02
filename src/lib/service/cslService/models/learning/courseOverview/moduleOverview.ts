import {Expose} from 'class-transformer'
import {ModuleType} from '../../../../../model'
import {RecordState} from '../../record'

export class ModuleOverview {
	@Expose()
	public courseId: string
	public id: string
	public title: string
	public description: string
	public mandatory: boolean
	public associatedLearning: boolean
	public type: ModuleType
	public duration: number
	public costInPounds: number
	public state: RecordState
	public mustConfirmBooking: boolean
}

export class FileModuleOverview extends ModuleOverview {
	public filename: string
	public extension: string
	public sizeInKb: number
}

export class F2FModuleOverview extends ModuleOverview {
	public bookedEventId: string | null
	public canBeBooked: boolean
	public canBeCancelled: boolean
}
