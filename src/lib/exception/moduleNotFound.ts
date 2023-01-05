export class ModuleNotFoundError extends Error {
	constructor(readonly courseId: string, readonly moduleId: string) {
		super(`Module with ID ${moduleId} not found within course ${courseId}`)
	}
}
