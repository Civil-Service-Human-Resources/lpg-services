const dateFormat = new Intl.DateTimeFormat('en-GB', {
	day: '2-digit',
	month: '2-digit',
	timeZone: 'Europe/London',
	year: 'numeric',
})

const timeFormat = new Intl.DateTimeFormat('en-GB', {
	day: '2-digit',
	hour: 'numeric',
	minute: '2-digit',
	month: '2-digit',
	timeZone: 'Europe/London',
	year: 'numeric',
})

export function formatDate(d: number | Date) {
	if (!(d instanceof Date)) {
		d = new Date(d)
	}
	return dateFormat.format(d)
}

export function formatTime(d: number | Date) {
	if (!(d instanceof Date)) {
		d = new Date(d)
	}
	return timeFormat.format(d)
}
