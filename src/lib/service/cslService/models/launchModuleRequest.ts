export interface LaunchModuleRequest {
	learnerFirstName: string
	learnerLastName: string
	courseRecordInput: CourseRecordInput
}

interface CourseRecordInput {
	courseTitle: string,
	isRequired: boolean,
	moduleRecords: ModuleRecordInput[]
}

interface ModuleRecordInput {
	duration: number
	moduleTitle: string
	optional: boolean
	moduleType: string
}
