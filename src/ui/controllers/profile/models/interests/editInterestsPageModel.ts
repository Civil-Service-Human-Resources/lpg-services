import {ArrayNotEmpty} from 'class-validator'
import {CreateInterestsPageModel} from './createInterestsPageModel'

export class EditInterestsPageModel extends CreateInterestsPageModel {
	@ArrayNotEmpty({
		message: 'profile.interests',
	})
	public interestIds: string[] = []
}
