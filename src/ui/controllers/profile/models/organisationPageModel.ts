import {IsNotEmpty} from 'class-validator'
import {OptionsBasePageModel} from './optionsBasePageModel'

export class OrganisationPageModel extends OptionsBasePageModel {
	@IsNotEmpty({
		message: 'profile.organisation',
	})
	public organisation: number
}
