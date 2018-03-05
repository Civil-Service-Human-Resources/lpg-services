import * as express from 'express'
import * as model from 'lib/model'

export interface CourseRequest extends express.Request {
	course: model.Course
	module?: model.Module
	event?: model.Event
}
