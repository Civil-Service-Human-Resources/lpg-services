/*

import * as path from 'path'
import * as fs from 'fs'
import * as express from 'express'

export function sayHi() {
	console.log('hello')
}

let currentRequest: express.Request

export function getCurrentRequest() {
	return currentRequest
}

export function isCapitalised(ident: string) {
	if (!ident) {
		return false
	}
	const char = ident.charCodeAt(0)
	return char >= 65 && char <= 90
}

export function toHtml(text: string) {
	if (text) {
		const lines = text
			.split('\n')
			.filter(line => !!line)
			.map(line => line.trim())

		let output = ''
		let inList = false
		for (const line of lines) {
			if (line.startsWith('•')) {
				if (!inList) {
					inList = true
					output += '<ul class="list-bullet u-space-b30">'
				}
				output += `<li>${line.substr(1).trim()}</li>`
			} else {
				if (inList) {
					inList = false
					output += '</ul>'
				}
				output += `<p>${line}</p>`
			}
		}
		return output
	}
	return ''
}
*/

export function allc() {
	console.log('hello')
}
