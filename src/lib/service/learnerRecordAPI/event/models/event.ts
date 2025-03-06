export class EventResponse{
    events: Event[]

    constructor(events: Event[]){
        this.events = events
    }
}

export class Event{
    uid: string
    path: string
    status: string
    cancellationReason: string

    constructor(uid: string, path: string, status: string, cancellationReason: string){
        this.uid = uid
        this.path = path
        this.status = status
        this.cancellationReason = cancellationReason
    }
}