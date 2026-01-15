;(function (Modules) {
	'use strict'

	function DiscitePreventDoubleClick(module) {
		this.module = module
	}

	DiscitePreventDoubleClick.prototype.init = function () {
		var button = this.module

		console.log(
			'DiscitePreventDoubleClick initialised for module:',
			button.dataset.url,
			'newTab:',
			button.dataset.newTab
		)

		button.addEventListener('click', function () {
			if (button.dataset.clicked === 'true') {
				return
			}

			button.dataset.clicked = 'true'
			button.setAttribute('aria-disabled', 'true')
			button.classList.add('is-disabled')
		})
	}

	Modules.DiscitePreventDoubleClick = DiscitePreventDoubleClick
})(window.GOVUK.Modules)
