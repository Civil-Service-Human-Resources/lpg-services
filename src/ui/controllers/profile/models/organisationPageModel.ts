import {Transform} from 'class-transformer'
import {IsNotEmpty} from 'class-validator'
import {OptionsBasePageModel} from './optionsBasePageModel'

export class OrganisationPageModel extends OptionsBasePageModel {
	@IsNotEmpty({
		message: 'profile.organisation',
	})
	@Transform(({value}) => {
		return parseInt(value)
	})
	public organisation: number
}
