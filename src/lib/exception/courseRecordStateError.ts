/**
 * Generic catch-all exception for course record state errors.
 */
export class CourseRecordStateError extends Error {
	constructor(message: string) {
		super(message)
	}
}
