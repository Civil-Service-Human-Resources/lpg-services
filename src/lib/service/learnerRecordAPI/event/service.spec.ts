import { CourseRecord } from '../courseRecord/models/courseRecord'
import { ModuleRecord } from "../moduleRecord/models/moduleRecord"
import { RecordState } from "../models/record"
import { getEventUidsFromCourseRecords, updateStatusForCancelledEventsInCourseRecord } from "./service"
import { expect } from 'chai'

describe("Event Service", () => {
    describe("getEventUidsFromCourseRecords", () => {
        it("should should return 4 UIDs with their correct name", () => {
            let courseRecords: CourseRecord[] = getFakeCourseRecordArray()
            let eventIds = getEventUidsFromCourseRecords(courseRecords)

            expect(eventIds.length).to.equal(4)
            expect(eventIds[0]).to.equal("eventUid1")
            expect(eventIds[1]).to.equal("eventUid2")
            expect(eventIds[2]).to.equal("eventUid3")
            expect(eventIds[3]).to.equal("eventUid4")
        })
    })

    describe("updateStatusForCancelledEventsInCourseRecord", () => {
        it("should register 2 modules as unregistered", () => {
            let courseRecord: CourseRecord = getFakeCourseRecordWithModules()
            let cancelledEventsUids = ["eventUid1", "eventUid4"]

            updateStatusForCancelledEventsInCourseRecord(courseRecord, cancelledEventsUids, RecordState.Unregistered)

            let unregisteredModules = courseRecord.modules.filter(module => module.state === RecordState.Unregistered)

            expect(unregisteredModules.length).to.equal(2)
            expect(courseRecord.modules.find(module => module.eventId === "eventUid1")?.state).to.equal("UNREGISTERED")
            expect(courseRecord.modules.find(module => module.eventId === "eventUid2")?.state).to.equal("APPROVED")
            expect(courseRecord.modules.find(module => module.eventId === "eventUid3")?.state).to.equal("APPROVED")
            expect(courseRecord.modules.find(module => module.eventId === "eventUid4")?.state).to.equal("UNREGISTERED")
        })
    })
})

// Fake objects:

function getFakeCourseRecordArray(): CourseRecord[] {
    let moduleRecord1: ModuleRecord = getFakeModuleRecordWithEventId("eventUid1")
    let moduleRecord2: ModuleRecord = getFakeModuleRecordWithEventId("eventUid2")
    let moduleRecord3: ModuleRecord = getFakeModuleRecordWithEventId("eventUid3")
    let moduleRecord4: ModuleRecord = getFakeModuleRecordWithEventId("eventUid4")
    let moduleRecord5: ModuleRecord = getFakeModuleRecordWithoutEventId()

    let courseRecord1: CourseRecord = getFakeCourseRecord()
    courseRecord1.modules.push(moduleRecord1)
    courseRecord1.modules.push(moduleRecord2)

    let courseRecord2: CourseRecord = getFakeCourseRecord()
    courseRecord2.modules.push(moduleRecord3)
    courseRecord2.modules.push(moduleRecord4)
    courseRecord2.modules.push(moduleRecord5)

    return [courseRecord1, courseRecord2]
}

function getFakeCourseRecord() {
    return new CourseRecord("course1", "user1", RecordState.Approved, undefined, "course1", true)
}

function getFakeCourseRecordWithModules() {
    let courseRecord: CourseRecord = new CourseRecord("course1", "user1", RecordState.Approved, undefined, "course1", true)

    let moduleRecord1: ModuleRecord = getFakeModuleRecordWithEventId("eventUid1")
    let moduleRecord2: ModuleRecord = getFakeModuleRecordWithEventId("eventUid2")
    let moduleRecord3: ModuleRecord = getFakeModuleRecordWithEventId("eventUid3")
    let moduleRecord4: ModuleRecord = getFakeModuleRecordWithEventId("eventUid4")

    courseRecord.modules = [moduleRecord1, moduleRecord2, moduleRecord3, moduleRecord4]
    return courseRecord

}

function getFakeModuleRecordWithEventId(eventId: string) {
    let moduleRecord: ModuleRecord = new ModuleRecord(1, "abc", "user1", "course1", new Date(), new Date(), "module1", "face-to-face", RecordState.Approved, 0, false)
    moduleRecord.eventId = eventId
    return moduleRecord
}

function getFakeModuleRecordWithoutEventId() {
    let moduleRecord: ModuleRecord = new ModuleRecord(1, "abc", "user1", "course1", new Date(), new Date(), "module1", "face-to-face", RecordState.Approved, 0, false)
    return moduleRecord
}