import DateTimeFormatOptions = Intl.DateTimeFormatOptions

const dateFormat = new Intl.DateTimeFormat('en-GB', {
	day: '2-digit',
	month: 'short',
	timeZone: 'Europe/London',
	year: 'numeric',
})

// From:
// https://github.com/google/closure-library/blob/master/closure/goog/date/date.js
const isoRegex = new RegExp(
	'^(-)?P(?:(\\d+)Y)?(?:(\\d+)M)?(?:(\\d+)D)?' +
		'(T(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+(?:\\.\\d+)?)S)?)?$'
)

const timeFormat = new Intl.DateTimeFormat('en-GB', {
	day: '2-digit',
	hour: 'numeric',
	minute: '2-digit',
	month: 'short',
	timeZone: 'Europe/London',
	year: 'numeric',
})

function divmod(a: number, b: number) {
	return [Math.floor(a / b), a % b]
}

function ensureFullICU() {
	const spanish = new Intl.DateTimeFormat('es', {month: 'long'})
	if (spanish.format(new Date(2000, 0, 1)) !== 'enero') {
		throw new Error(
			'Please ensure that the NODE_ICU_DATA environment variable has been set'
		)
	}
}

export function formatCourseDuration(d: number) {
	console.log(d)
	if (!d) {
		return '-'
	}
	let out = ''
	// treat a day as 8 hours
	const [days, daySeconds] = divmod(d, 28800)
	if (days) {
		out += `${days} day${days > 1 ? 's' : ''}`
	}
	const [hours, hourSeconds] = divmod(daySeconds, 3600)
	if (hours) {
		if (out) {
			out += ' '
		}
		out += `${hours} hour${hours > 1 ? 's' : ''}`
	}
	const [minutes] = divmod(hourSeconds, 60)
	if (minutes) {
		if (out) {
			out += ' '
		}
		out += `${minutes} minute${minutes > 1 ? 's' : ''}`
	}
	if (minutes === 0 && hours === 0 && days === 0) {
		out += `1 minute`
	}
	return out
}

export function formatDate(d: number | Date) {
	if (!(d instanceof Date)) {
		d = new Date(d)
	}
	return dateFormat.format(d)
}

export function HTMLFormatDate(d: number | Date, withTime?: boolean) {
	if (!(d instanceof Date)) {
		d = new Date(d)
	}

	let options: DateTimeFormatOptions = {
		day: '2-digit',
		month: '2-digit',
		timeZone: 'Europe/London',
		year: 'numeric',
	}
	if (withTime) {
		options = {...options, hour: '2-digit', minute: '2-digit'}
	}

	const HTMLDateFormat = new Intl.DateTimeFormat('en-GB', options)

	const arrDate = HTMLDateFormat.format(d).split('/')

	let formatted: string
	if (!withTime) {
		formatted = `${arrDate[2]}-${arrDate[1]}-${arrDate[0]}`
	} else {
		const yearTime = arrDate[2].split(', ')
		const arrDateTime = [...arrDate.slice(0, 2), ...yearTime]

		formatted = `${arrDateTime[2]}-${arrDateTime[1]}-${arrDateTime[0]}T${
			arrDateTime[3]
		}`
	}
	return formatted
}

// Convert duration in seconds to an ISO 8601 format duration string. Used to
// send appropriately formatted values to APIs like xAPI.
export function formatDuration(d: number) {
	let out = 'P'
	let timeSet = false
	const [days, daySeconds] = divmod(d, 86400)
	if (days) {
		out += `${days}D`
		timeSet = true
	}
	out += 'T'
	const [hours, hourSeconds] = divmod(daySeconds, 3600)
	if (hours) {
		out += `${hours}H`
		timeSet = true
	}
	const [minutes, seconds] = divmod(hourSeconds, 60)
	if (minutes) {
		out += `${minutes}M`
		timeSet = true
	}
	if (seconds) {
		out += `${seconds}S`
		timeSet = true
	}
	if (!timeSet) {
		out += '0S'
	}
	return out
}

export function formatTime(d: number | Date, timeOnly?: boolean) {
	if (!(d instanceof Date)) {
		d = new Date(d)
	}
	if (timeOnly) {
		return timeFormat
			.format(d)
			.split(',')
			.pop()
	}

	return timeFormat.format(d)
}

export function parseMP4Duration(duration: string) {
	if (duration.endsWith(' s')) {
		const seconds = Math.round(parseInt(duration.replace(' s', ''), 10))
		return seconds
	} else {
		const arrDurration = duration.split(':')
		const seconds =
			parseInt(arrDurration[0], 10) * (60 * 60) +
			parseInt(arrDurration[1], 10) * 60 +
			parseInt(arrDurration[2], 10)

		return seconds
	}
}

export function parseDuration(isoDuration: string): number | undefined {
	const parts = isoDuration.match(isoRegex)
	if (!parts) {
		return
	}
	// Abort if the duration specifies either year or month components.
	if (parts[2] || parts[3]) {
		return
	}
	let duration = 0
	duration += parseFloat(parts[8]) || 0
	duration += (parseInt(parts[7], 10) || 0) * 60
	duration += (parseInt(parts[6], 10) || 0) * 3600
	duration += (parseInt(parts[4], 10) || 0) * 86400
	// Accept the leading minus sign for now, but might want to abort in future.
	if (parts[1]) {
		return -duration
	}
	return duration
}

export function addSeconds(date: Date, seconds: number, parsedTime?: boolean) {
	const milliseconds = seconds * 1000
	const newDate = new Date(date.getTime() + milliseconds)
	if (parsedTime) {
		return formatTime(newDate, true)
	}
	return newDate
}

ensureFullICU()
