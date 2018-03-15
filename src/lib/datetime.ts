const dateFormat = new Intl.DateTimeFormat('en-GB', {
	day: '2-digit',
	month: '2-digit',
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
	month: '2-digit',
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
// TODO(tav): This may end up having more logic, e.g. approximating anything
// over 8 hours to be represented as a day, using more explicit wording, e.g. 2
// days and 4 hours, etc.
export function formatCourseDuration(d: number) {
	if (!d) {
		return '-'
	}
	let out = ''
	const [days, daySeconds] = divmod(d, 86400)
	if (days) {
		out += `${days}D`
	}
	const [hours, hourSeconds] = divmod(daySeconds, 3600)
	if (hours) {
		out += `${hours}H`
	}
	const [minutes, seconds] = divmod(hourSeconds, 60)
	if (minutes) {
		out += `${minutes}M`
	}
	if (seconds) {
		out += `${seconds}S`
	}
	return out
}

export function formatDate(d: number | Date) {
	if (!(d instanceof Date)) {
		d = new Date(d)
	}
	let formatted
	try {
		formatted = dateFormat.format(d)
	} catch (e) {
		formatted = ''
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

export function formatTime(d: number | Date) {
	if (!(d instanceof Date)) {
		d = new Date(d)
	}
	return timeFormat.format(d)
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

ensureFullICU()
