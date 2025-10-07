import {Course} from '../../../model'
import {Suggestion} from './suggestion'

export class SuggestionsMap {
	private map: Map<Suggestion, Record<string, Course[]>> = new Map()

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

	getAllCourses(): Course[] {
		const courses: Course[] = []
		this.map.forEach(record => {
			courses.push(...Object.values(record).flatMap(recordCourses => recordCourses))
		})
		return courses
	}

	getCourse(id: string) {
		return this.getAllCourses().find(course => course.id === id)
	}
}
