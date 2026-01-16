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

			button.dataset.clicked = 'true'
			button.setAttribute('aria-disabled', 'true')
			button.classList.add('is-disabled')
		})
	}

	Modules.DiscitePreventDoubleClick = DiscitePreventDoubleClick
})(window.GOVUK.Modules)
