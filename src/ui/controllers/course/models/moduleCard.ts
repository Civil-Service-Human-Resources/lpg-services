import {ModuleType} from '../../../../lib/model'

export interface BaseModuleCard {
	associatedLearning: boolean
	description: string
	isMandatory: boolean
	launchLink: string
	title: string
	type: ModuleType
	template: string
	duration: string
	displayState?: string
	mustConfirmBooking?: boolean
	cost?: number
}

export interface F2FModuleCard extends BaseModuleCard {
	canBeBooked: boolean
	cancellationLink?: string
}

export interface FileModuleCard extends BaseModuleCard {
	fileName: string
	fileExtAndSize: string
}
