import * as datetime from 'lib/datetime'

describe('Should return formatted the date', () => {
	it('Should return a formatted date', () => {
		expect(datetime.formatDate(new Date(2018, 0, 1))).toBe('01/01/2018')
		expect(datetime.formatDate(new Date(2018, 5, 1))).toBe('01/06/2018')
		expect(datetime.formatDate(new Date(2018, 11, 1))).toBe('01/12/2018')
	})

	it('Should return formated date and time', () => {
		expect(datetime.formatTime(new Date(2018, 0, 1))).toBe('01/01/2018, 00:00')
		expect(datetime.formatTime(new Date(2018, 11, 1))).toBe('01/12/2018, 00:00')
		expect(datetime.formatTime(new Date(2018, 11, 1, 12, 0, 0))).toBe(
			'01/12/2018, 12:00'
		)
		expect(datetime.formatTime(new Date(2018, 11, 1, 11, 59, 59))).toBe(
			'01/12/2018, 11:59'
		)
		expect(datetime.formatTime(new Date(2018, 11, 1, 23, 59, 59))).toBe(
			'01/12/2018, 23:59'
		)
	})

	it('Should format duration seconds to ISO8601 ', () => {
		const map = new Map()
		map.set(1, 'PT1S')
		map.set(60, 'PT1M')
		map.set(61, 'PT1M1S')
		map.set(3599, 'PT59M59S')
		map.set(3600, 'PT1H')
		map.set(3601, 'PT1H1S')
		map.set(3660, 'PT1H1M')
		map.set(3661, 'PT1H1M1S')
		map.set(86399, 'PT23H59M59S')
		map.set(86400, 'P1DT')
		map.set(86401, 'P1DT1S')
		map.set(86460, 'P1DT1M')
		map.set(90000, 'P1DT1H')
		map.set(90061, 'P1DT1H1M1S')
		map.set(172799, 'P1DT23H59M59S')
		map.set(172800, 'P2DT')
		for (const [duration, output] of map.entries()) {
			expect(datetime.formatDuration(duration)).toBe(output)
		}
	})

	it('Should format duration seconds to ISO8601 course duration', () => {
		const map = new Map()
		map.set(1, '1S')
		map.set(60, '1M')
		map.set(61, '1M1S')
		map.set(3599, '59M59S')
		map.set(3600, '1H')
		map.set(3601, '1H1S')
		map.set(3660, '1H1M')
		map.set(3661, '1H1M1S')
		map.set(86399, '23H59M59S')
		map.set(86400, '1D')
		map.set(86401, '1D1S')
		map.set(86460, '1D1M')
		map.set(90000, '1D1H')
		map.set(90061, '1D1H1M1S')
		map.set(172799, '1D23H59M59S')
		map.set(172800, '2D')
		for (const [duration, output] of map.entries()) {
			expect(datetime.formatCourseDuration(duration)).toBe(output)
		}
	})

	it('Should handle NaN for formate duration (ISO8601 formatting)', () => {
		expect(datetime.formatDuration(NaN)).toBe('PT0S')
	})

	it('Should handle NaN for format course duration (ISO8601 formatting)', () => {
		expect(datetime.formatCourseDuration(NaN)).toBe('-')
	})
})
