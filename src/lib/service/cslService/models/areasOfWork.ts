import {Type} from 'class-transformer'
import {AreaOfWork} from '../../../registry'

export class AreasOfWork {
	@Type(() => AreaOfWork)
	public areasOfWork: AreaOfWork[]
}
