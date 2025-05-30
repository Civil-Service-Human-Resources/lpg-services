;(function () {
	'use strict'
	// header navigation toggle
	if (document.querySelectorAll && document.addEventListener) {
		var els = document.querySelectorAll('.js-header-toggle'),
			i,
			_i
		for (i = 0, _i = els.length; i < _i; i++) {
			els[i].addEventListener('click', function (e) {
				e.preventDefault()
				var target = document.getElementById(this.getAttribute('href').substr(1)),
					targetClass = target.getAttribute('class') || '',
					sourceClass = this.getAttribute('class') || ''

				if (targetClass.indexOf('js-visible') !== -1) {
					target.setAttribute(
						'class',
						targetClass.replace(/(^|\s)js-visible(\s|$)/, ''),
						(document.getElementById('visiblyHidden').innerHTML = 'Select to expand')
					)
					document.getElementsByClassName('menu__icon')[0].innerHTML = '▼'
				} else {
					target.setAttribute('class', targetClass + ' js-visible')
					document.getElementById('visiblyHidden').innerHTML = 'Select to close'
					document.getElementsByClassName('menu__icon')[0].innerHTML = '▲'
				}
				if (sourceClass.indexOf('js-hidden') !== -1) {
					this.setAttribute('class', sourceClass.replace(/(^|\s)js-hidden(\s|$)/, ''))
				} else {
					this.setAttribute('class', sourceClass + ' js-hidden')
				}
			})
		}
	}
}).call(this)
