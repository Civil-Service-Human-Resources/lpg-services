require('./govuk_frontend_toolkit/govuk/show-hide-content')
require('./govuk_frontend_toolkit/govuk/modules')
require('./govuk_frontend_toolkit/govuk/govuk-template')
require('./accordion')
require('./cookies')
require('./typeahead')
require('./prevent-double-click')

document.addEventListener('DOMContentLoaded', function () {
	let modules = document.querySelectorAll('[data-module]')

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
})
