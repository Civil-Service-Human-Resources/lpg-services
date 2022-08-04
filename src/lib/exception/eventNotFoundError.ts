export class EventNotFoundError extends Error {
	constructor(readonly courseId: string, readonly moduleId: string, readonly eventId: string) {
		super(`Event with ID ${eventId} not found within course/module ${courseId}/${moduleId}`)
	}
}
