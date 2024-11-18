import {Option} from '../../../model/option'
import {ValidPageModel} from '../../models/ValidPageModel'

export class OptionsBasePageModel extends ValidPageModel {
	public options: Option[]

	constructor(options: Option[]) {
		super()
		this.options = options
	}
}
