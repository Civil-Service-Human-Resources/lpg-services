;(function (global) {
	'use strict'

	var $ = global.jQuery
	var GOVUK = global.GOVUK || {}
	GOVUK.Modules = GOVUK.Modules || {}

	GOVUK.Modules.PreventDoubleClick = function () {
		this.start = function (element) {
			element.on('click', function (e) {
				if (element.data('clicked')) {
					e.preventDefault()
					e.stopPropagation()
				} else {
					element.data('clicked', true)
					setTimeout(function () {
						element.prop('disabled', true)
					}, 0)
				}
			})
		}
	}

	global.GOVUK = GOVUK
})(window)
