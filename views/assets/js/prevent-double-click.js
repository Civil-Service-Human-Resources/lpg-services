;(function (global) {
	'use strict'

	var $ = global.jQuery
	var GOVUK = global.GOVUK || {}
	GOVUK.Modules = GOVUK.Modules || {}

	GOVUK.Modules.PreventDoubleClick = function () {
		this.start = function (element) {
			// Ensure we are working with the form element
			var $form = element.is('form') ? element : element.closest('form')

			if ($form.length > 0) {
				$form.on('submit', function (e) {
					if ($form.data('submitted')) {
						e.preventDefault()
						e.stopPropagation()
					} else {
						$form.data('submitted', true)

						// If opening in a new tab, reset the lock after a few seconds
						// so the user can try again if needed.
						if ($form.attr('target') === '_blank') {
							setTimeout(function () {
								$form.data('submitted', false)
							}, 4000)
						}
					}
				})
			}
		}
	}

	global.GOVUK = GOVUK
})(window)
