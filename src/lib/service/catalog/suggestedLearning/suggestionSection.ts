import {Course} from '../../../model'

import {GetCoursesParams} from '../models/getCoursesParams'
import {Suggestion} from './suggestion'

export class SuggestionSection {
	public courses: Course[]
	constructor(
		public key: string,
		public suggestion: Suggestion,
		public params?: GetCoursesParams
	) {}
}
