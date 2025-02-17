import {Transform, TransformFnParams} from 'class-transformer'
import * as striptags from 'striptags'
import {costType, typesType} from '../../../../lib/service/catalog/models/courseSearchParams'

function stringToArrayTransformer() {
	return (params: TransformFnParams) => {
		if (typeof params.value === "string") {
			return [params.value]
		} else {
			return [...params.value]
		}
	}
}

export class CourseSearchQuery {

	@Transform(({value}) => {
		return +value
	})
	p: number = 0
	@Transform(({value}) => {
		return striptags(value)
	})
	q: string = ''
	@Transform(stringToArrayTransformer())
	courseType: typesType[] = []
	@Transform(stringToArrayTransformer())
	department: string[] = []
	@Transform(stringToArrayTransformer())
	areaOfWork: string[] = []
	@Transform(stringToArrayTransformer())
	interest: string[] = []
	cost?: costType

	getAsUrlParams(page?: number) {
		const urlParts = [`q=${this.q}`]
		this.courseType.forEach(courseType => {
			urlParts.push(`courseType=${courseType}`)
		})
		this.department.forEach(department => {
			urlParts.push(`department=${department}`)
		})
		this.areaOfWork.forEach(areaOfWork => {
			urlParts.push(`areaOfWork=${areaOfWork}`)
		})
		this.interest.forEach(interest => {
			urlParts.push(`interest=${interest}`)
		})
		if (this.cost) {
			urlParts.push(`cost=${this.cost}`)
		}
		if (page) {
			urlParts.push(`p=${page}`)
		}
		return "/search?" + urlParts.join("&")
	}
}
