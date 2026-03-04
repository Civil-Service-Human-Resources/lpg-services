require('./govuk_frontend_toolkit/govuk/show-hide-content')
require('./govuk_frontend_toolkit/govuk/modules')
require('./govuk_frontend_toolkit/govuk/govuk-template')
require('./accordion')
require('./cookies')
require('./prevent-double-click')

const accessibleAutocomplete = require('accessible-autocomplete')

document.addEventListener('DOMContentLoaded', function () {
	let modules = Array.prototype.slice.call(document.querySelectorAll('[data-module]'))

	modules.forEach(function (element) {
		let moduleName = element
			.getAttribute('data-module')
			.split('-')
			.map(function (word) {
				return word.charAt(0).toUpperCase() + word.slice(1)
			})
			.join('')

		if (window.GOVUK && window.GOVUK.Modules && typeof window.GOVUK.Modules[moduleName] === 'function') {
			let module = new window.GOVUK.Modules[moduleName]()
			module.start(element)
		}
	})

	const organisationSelect = document.querySelector('#organisation')
	if (organisationSelect) {
		accessibleAutocomplete.enhanceSelectElement({
			autoselect: false,
			defaultValue: '',
			minLength: 1,
			selectElement: organisationSelect,
			showAllValues: true,
		})
	}

	const cancelReasonSelect = document.querySelector('#cancel-reason')
	if (cancelReasonSelect) {
		accessibleAutocomplete.enhanceSelectElement({
			autoselect: false,
			defaultValue: '',
			minLength: 1,
			selectElement: cancelReasonSelect,
			showAllValues: true,
		})
	}
})
