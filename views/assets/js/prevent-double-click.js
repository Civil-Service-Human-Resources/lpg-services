;(function (Modules) {
	'use strict'

	function DiscitePreventDoubleClick() {}

	DiscitePreventDoubleClick.prototype.start = function ($element) {
		var button = $element[0]
		this.module = button

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
