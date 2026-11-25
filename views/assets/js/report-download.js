// Progressively enhance the CSV report request functionality.
const jsonLocale = require('../../../locale/en.json').reporting.report_download
const successMsg = jsonLocale.success_message
const errorMsg = jsonLocale.error_message

const generateResultParagraph = (success) => {
	const resultParagraph = document.createElement("p")
	resultParagraph.classList = "govuk-body"
	if (success) {
		resultParagraph.innerText = successMsg
	} else {
		resultParagraph.innerText = errorMsg
		resultParagraph.classList.add("govuk-error-message")
	}
	return resultParagraph
}


const elems = document.getElementsByClassName("download-report")
if (successMsg !== undefined && errorMsg !== undefined) {
	for (const elem of elems) {
		const panel = document.getElementsByClassName("download-report__panel")[0]
		const form = panel.getElementsByClassName("download-report__form")[0]
		let button = panel.getElementsByClassName("download-report__button")[0]
		let csrf = document.querySelector("[name='_csrf']").getAttribute("value")
		if (button !== undefined && csrf !== null) {
			const submitUrl = button.getAttribute('data-submiturl')
			form.remove()
			panel.appendChild(button)
			button.addEventListener("click", async (e) => {
				let success = false
				e.target.disabled = true
				try {
					const resp = await fetch(`${window.location.origin}${submitUrl}`, {
						method: 'POST',
						body: JSON.stringify({
							_csrf: csrf
						}),
						headers :{"Content-type": "application/json; charset=UTF-8"}
					})
					success = resp.ok
				} catch (e) {
					console.log("Error submitting report request")
				}
				const resultParagraph = generateResultParagraph(success)
				button.remove()
				panel.appendChild(resultParagraph)
			})
		}
	}
}
