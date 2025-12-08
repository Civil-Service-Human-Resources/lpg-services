import {RecordState} from '../../record'

export class EventModule {
	public id: string
	public eventId: string
	public title: string
	public bookedDate: string
	public dates: string[]
	public state: RecordState
}
