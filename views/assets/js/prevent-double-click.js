;(function (Modules) {
	'use strict'

	function DiscitePreventDoubleClick() {}

	DiscitePreventDoubleClick.prototype.start = function ($element) {
		let button = $element[0]

		button.addEventListener('click', function (e) {
			if (button.dataset.clicked === 'true') {
				e.preventDefault()
				e.stopPropagation()
				return
			}

			// Disable the button immediately
			button.dataset.clicked = 'true'
			button.setAttribute('aria-disabled', 'true')
			button.classList.add('is-disabled')

			// Re-enable the button after 2 seconds (2000ms)
			setTimeout(function () {
				button.dataset.clicked = 'false'
				button.removeAttribute('aria-disabled')
				button.classList.remove('is-disabled')
			}, 2000)
		})
	}

	Modules.DiscitePreventDoubleClick = DiscitePreventDoubleClick
})(window.GOVUK.Modules)
