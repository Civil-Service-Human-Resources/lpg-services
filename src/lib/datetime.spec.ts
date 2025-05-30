import {expect} from 'chai'
import * as datetime from './datetime'

describe('Should return formatted the date', () => {
	it('Should return a formatted date', () => {
		expect(datetime.formatDate(new Date(2018, 0, 1))).to.equal('01 Jan 2018')
		expect(datetime.formatDate(new Date(2018, 5, 1))).to.equal('01 Jun 2018')
		expect(datetime.formatDate(new Date(2018, 11, 1))).to.equal('01 Dec 2018')
	})

	it('Should return formated date and time', () => {
		expect(datetime.formatTime(new Date(2018, 0, 1))).to.equal('01 Jan 2018, 00:00')
		expect(datetime.formatTime(new Date(2018, 11, 1))).to.equal('01 Dec 2018, 00:00')
		expect(datetime.formatTime(new Date(2018, 11, 1, 12, 0, 0))).to.equal('01 Dec 2018, 12:00')
		expect(datetime.formatTime(new Date(2018, 11, 1, 11, 59, 59))).to.equal('01 Dec 2018, 11:59')
		expect(datetime.formatTime(new Date(2018, 11, 1, 23, 59, 59))).to.equal('01 Dec 2018, 23:59')
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
			expect(datetime.formatDuration(duration)).to.equal(output)
		}
	})

	it('Should format duration seconds to course duration', () => {
		const map = new Map()
		map.set(1, '1 minute')
		map.set(60, '1 minute')
		map.set(61, '1 minute')
		map.set(3599, '59 minutes')
		map.set(3600, '1 hour')
		map.set(3601, '1 hour')
		map.set(3660, '1 hour 1 minute')
		map.set(3661, '1 hour 1 minute')
		map.set(28799, '7 hours 59 minutes')
		map.set(28800, '1 day')
		map.set(28801, '1 day')
		map.set(28860, '1 day 1 minute')
		map.set(32400, '1 day 1 hour')
		map.set(32461, '1 day 1 hour 1 minute')
		map.set(57599, '1 day 7 hours 59 minutes')
		map.set(57600, '2 days')
		for (const [duration, output] of map.entries()) {
			expect(datetime.formatCourseDuration(duration)).to.equal(output)
		}
	})

	it('Should handle NaN for formate duration (ISO8601 formatting)', () => {
		expect(datetime.formatDuration(NaN)).to.equal('PT0S')
	})

	it('Should handle NaN for format course duration (ISO8601 formatting)', () => {
		expect(datetime.formatCourseDuration(NaN)).to.equal('-')
	})

	it('should add a second value to a date value', () => {
		const map = new Map()

		map.set(new Date(2018, 0, 1, 13, 0), ['01 Jan 2018', ' 17:00'])
		map.set(new Date(2018, 11, 1, 1, 20), ['01 Dec 2018', ' 05:20'])
		map.set(new Date(2018, 11, 1, 12, 0, 0), ['01 Dec 2018', ' 16:00'])
		map.set(new Date(2018, 11, 1, 11, 59, 59), ['01 Dec 2018', ' 15:59'])
		map.set(new Date(2018, 11, 1, 23, 59, 59), ['02 Dec 2018', ' 03:59'])

		for (const [dateToTest, output] of map.entries()) {
			const timeAddedString = datetime.addSeconds(dateToTest, 14400) as string
			const time = datetime.addSeconds(dateToTest, 14400, true)
			const date = datetime.formatDate(new Date(timeAddedString))

			expect(date).to.equal(output[0])
			expect(time).to.equal(output[1])
		}
	})
})
