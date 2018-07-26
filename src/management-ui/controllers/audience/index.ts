import * as express from 'express'
import * as extended from 'lib/extended'
import * as model from 'lib/model'
import * as template from 'lib/ui/template'
import {storeModule} from '../module/edit'

export enum OptionTypes {
	Radio = 'radio',
	Checkbox = 'checkbox',
	Date = 'date',
}

export enum nodeDetails {
	department = 'audience_department_label',
	profession = 'audience_area_label',
	grade = 'audience_grade_label',
	interest = 'audience_interest_label',
	optional = 'audience_optional_label',
	frequency = 'audience_frequency_label',
	required = 'audience_required-by_label',
}

export enum pluralizer {
	profession = 'areas-of-work',
	department = 'departments',
	grade = 'grades',
	interest = 'interests',
	optional = 'optional',
	frequency = 'frequency',
	required = 'required-by',
}

const Singular: string[] = ['frequency', 'optional', 'requiredBy']

function isDateType(term: string) {
	return term === 'required-by'
}

function isSingular(term: string) {
	return Singular.indexOf(term) > -1
}

export function pascalToCamel(pascal: string) {
	return pascal.replace(/-([a-z])/g, (m: string, w: string) => {
		return w.toUpperCase()
	})
}

export async function setAudienceNode(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest
	const {course, module} = req
	const node = req.params.profileDetail
	const audienceNumber = req.params.audienceNumber

	let fieldValue = req.body[node]
	if (fieldValue === '') {
		// ensure if field value is an empty string (i.e. unset) we set it to null
		fieldValue = null
	}

	if (!module!.audiences[audienceNumber]) {
		module!.audiences[audienceNumber] = model.Audience.create({})
	}

	const nodePlural: any = pascalToCamel(pluralizer[node])

	let collection = (module!.audiences[audienceNumber] as any)[nodePlural]

	if (Array.isArray(fieldValue)) {
		collection = fieldValue
	} else if (!isSingular(nodePlural)) {
		collection = fieldValue ? [fieldValue] : []
	} else {
		collection = fieldValue
	}

	const extend = model.Audience.create(module!.audiences[audienceNumber]) as any
	extend[nodePlural] = collection
	module!.audiences[audienceNumber] = extend

	await storeModule(ireq, module!)
	res.redirect(`/courses/${course.id}/${module!.id}/${module!.type}`)
}

export function getAudienceNode(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest
	const {module} = req
	const node = ireq.params.profileDetail
	const audienceNumber = req.params.audienceNumber
	const label = nodeDetails[node]
	const nodePlural: any = pluralizer[node]
	let values =
		(module!.audiences[audienceNumber] as any)[pascalToCamel(nodePlural)] || []
	let options = {}
	let optionType: string = ''

	options = ireq.__(nodePlural)
	if (isDateType(nodePlural)) {
		optionType = OptionTypes.Date
		values =
			(module!.audiences[audienceNumber] as any)[pascalToCamel(nodePlural)] ||
			new Date()
	} else {
		optionType = isSingular(nodePlural)
			? OptionTypes.Radio
			: OptionTypes.Checkbox
	}
	res.send(
		template.render('audience/edit', ireq, res, {
			label,
			node,
			optionType,
			options: Object.entries(options),
			values,
		})
	)
}
