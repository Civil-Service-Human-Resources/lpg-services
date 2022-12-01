import { Course } from '../../../model'
import { Suggestion } from './suggestion'

export class SuggestionsMap {
	private map: Map<Suggestion, Record<string, Course[]>> = {}

	addToMap(suggestion: Suggestion, key: string, courses: Course[]) {
		const mappings = this.getMapping(suggestion)
		mappings[key] = courses
		this.map.set(suggestion, mappings)
	}

	getMapping(suggestion: Suggestion) {
		let mappings = this.map.get(suggestion)
		if (!mappings) {
			mappings = {}
		}
		return mappings
	}
}
