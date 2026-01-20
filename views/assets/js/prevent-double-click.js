;(function (Modules) {
	'use strict'

	if (!Modules) {
		return
	}

	function DiscitePreventDoubleClick() {
		this.debounceFormSubmitTimer = null
	}

	DiscitePreventDoubleClick.prototype.start = function ($module) {
		this.$module = $module && $module.length && $module[0] ? $module[0] : $module

		if (!this.$module) {
			return
		}

		this.init()
	}

	DiscitePreventDoubleClick.prototype.init = function () {
		let timeoutAttr = this.$module.getAttribute('data-timeout')
		this.preventionTimeout = timeoutAttr ? parseInt(timeoutAttr, 10) : 2000
		this.$module.addEventListener('click', this.handleClick.bind(this))
	}

	DiscitePreventDoubleClick.prototype.handleClick = function (event) {
		if (this.$module.getAttribute('data-clicked') === 'true') {
			event.preventDefault()
			event.stopPropagation()
			return
		}

		this.$module.setAttribute('data-clicked', 'true')
		this.$module.setAttribute('aria-disabled', 'true')
		this.$module.classList.add('is-disabled')

		this.debounceFormSubmitTimer = setTimeout(this.reset.bind(this), this.preventionTimeout)
	}

	DiscitePreventDoubleClick.prototype.reset = function () {
		if (this.$module) {
			this.$module.setAttribute('data-clicked', 'false')
			this.$module.removeAttribute('aria-disabled')
			this.$module.classList.remove('is-disabled')
		}
	}

	Modules.DiscitePreventDoubleClick = DiscitePreventDoubleClick
})(window.GOVUK && window.GOVUK.Modules)
