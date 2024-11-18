import {validate} from 'class-validator'
import * as _ from 'lodash'

export abstract class ValidPageModel {
	public errors?: string[]

	hasErrors(): boolean {
		return this.errors !== undefined && this.errors.length > 0
	}

	async validate(groups: string[] = []) {
		const errors = await validate(this, {groups})
		/*tslint:disable*/
		this.errors = _.flatten(
			errors.map(error => {
				return Object.values(error.constraints)
			})
		)
	}
}
