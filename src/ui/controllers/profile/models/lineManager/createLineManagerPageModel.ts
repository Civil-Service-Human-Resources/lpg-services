import {Transform} from 'class-transformer'
import {IsEmail, ValidateIf} from 'class-validator'
import {Match} from '../../../../../lib/utils/customValidators/match'
import {ValidPageModel} from '../../../models/ValidPageModel'
import {LineManagerPageModel} from './lineManagerPageModel'

export class CreateLineManagerPageModel extends ValidPageModel implements LineManagerPageModel {
	@ValidateIf(lm => lm.email !== undefined && lm.email !== '')
	@IsEmail(
		{},
		{
			message: 'profile.lineManager.email.invalid',
		}
	)
	@Transform(({value}) => {
		return value.toLowerCase()
	})
	public email: string

	@ValidateIf(lm => lm.email !== undefined && lm.email !== '')
	@Match('email', {
		message: 'profile.lineManager.confirm.match',
	})
	@Transform(({value}) => {
		return value.toLowerCase()
	})
	public confirm: string
}
