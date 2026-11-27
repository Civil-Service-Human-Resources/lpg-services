// Progressively enhance the CSV report request functionality.
const jsonLocale = require('../../../locale/en.json').reporting.report_download
const successMsg = jsonLocale.success_message
const errorMsg = jsonLocale.error_message

const generateResultParagraph = success => {
	if (success) {
		const bannerDiv = document.createElement('div')
		bannerDiv.className = 'banner banner--confirmation profile-banner'
		bannerDiv.setAttribute('role', 'status')
		const p = document.createElement('p')
		p.className = 'no-margin'
		const strong = document.createElement('strong')
		strong.innerText = successMsg
		p.appendChild(strong)
		bannerDiv.appendChild(p)
		return bannerDiv
	} else {
		const resultParagraph = document.createElement('p')
		resultParagraph.className = 'error-message'
		resultParagraph.innerText = errorMsg
		return resultParagraph
	}
}

const elems = document.getElementsByClassName('download-report')
if (successMsg !== undefined && errorMsg !== undefined) {
	for (const elem of elems) {
		const panel = document.getElementsByClassName('download-report__panel')[0]
		const form = panel.getElementsByClassName('download-report__form')[0]
		let button = panel.getElementsByClassName('download-report__button')[0]
		let csrf = document.querySelector("[name='_csrf']").getAttribute('value')
		if (button !== undefined && csrf !== null) {
			const submitUrl = button.getAttribute('data-submiturl')
			form.remove()
			panel.appendChild(button)
			button.addEventListener('click', async e => {
				let success = false
				e.target.disabled = true
				try {
					const resp = await fetch(`${window.location.origin}${submitUrl}`, {
						method: 'POST',
						body: JSON.stringify({
							_csrf: csrf,
						}),
						headers: {'Content-type': 'application/json; charset=UTF-8'},
					})
					if (resp.ok) {
						const blob = await resp.blob()
						const url = window.URL.createObjectURL(blob)
						const a = document.createElement('a')
						a.href = url

						const disposition = resp.headers.get('content-disposition')
						let filename = 'learning-record.zip'
						if (disposition && disposition.includes('filename=')) {
							const matches = disposition.match(/filename="?([^"]+)"?/)
							if (matches && matches[1]) {
								filename = matches[1]
							}
						}

						a.download = filename
						document.body.appendChild(a)
						a.click()
						a.remove()
						window.URL.revokeObjectURL(url)
						success = true
					}
				} catch (e) {
					console.log('Error submitting report request')
				}
				const resultParagraph = generateResultParagraph(success)
				button.remove()
				panel.appendChild(resultParagraph)
			})
		}
	}
}
