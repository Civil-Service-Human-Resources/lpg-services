import {Transform} from 'class-transformer'
import {IsEmail, IsNotEmpty, ValidateIf} from 'class-validator'
import {Match} from '../../../../../lib/utils/customValidators/match'
import {ValidPageModel} from '../../../models/ValidPageModel'
import {LineManagerPageModel} from './lineManagerPageModel'

export class EditLineManagerPageModel extends ValidPageModel implements LineManagerPageModel {
	@IsEmail(
		{},
		{
			groups: ['edit', 'create'],
			message: 'profile.lineManager.email.invalid',
		}
	)
	@IsNotEmpty({
		groups: ['edit'],
		message: 'profile.lineManager.email.empty',
	})
	@Transform(({value}) => {
		return value.toLowerCase()
	})
	public email: string

	@ValidateIf(lm => lm.email !== undefined && lm.email !== '')
	@IsNotEmpty({
		groups: ['edit'],
		message: 'profile.lineManager.confirm.empty',
	})
	@Match('email', {
		message: 'profile.lineManager.confirm.match',
	})
	@Transform(({value}) => {
		return value.toLowerCase()
	})
	public confirm: string
}
