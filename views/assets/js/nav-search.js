require('./models/elems')
const {BaseElement, ActiveElem} = require('./models/elems')

/*
Constants
 */
const navSearchToggleId = 'nav-search-toggle'
const navSearchToggleOpenId = 'nav-search-toggle-open'
const navSearchToggleCloseId = 'nav-search-toggle-close'
const navSearchPanelId = 'nav-search-panel'
const searchBoxId = 'q'

const navSearchToggle = document.getElementById(navSearchToggleId)
const navSearchToggleOpen = document.getElementById(navSearchToggleOpenId)
const navSearchToggleClose = document.getElementById(navSearchToggleCloseId)
const navSearchPanel = document.getElementById(navSearchPanelId)
const searchBox = document.getElementById(searchBoxId)

const requiredElems = [navSearchToggle, navSearchToggleOpen, navSearchToggleClose, navSearchPanel, searchBox]
if (!requiredElems.includes(null)) {
	/*
	Setup
	 */
	const navSearchToggleElem = new ActiveElem(navSearchToggle)
	const navSearchToggleOpenElem = new BaseElement(navSearchToggleOpen)
	const navSearchToggleCloseElem = new BaseElement(navSearchToggleClose)
	const navSearchPanelElem = new BaseElement(navSearchPanel)

	const activate = () => {
		navSearchToggleElem.activate()
		navSearchToggleElem.elem.setAttribute('aria-label', 'Hide search menu')
		navSearchToggleOpenElem.hide()
		navSearchToggleCloseElem.show()
		navSearchPanelElem.expand()
	}

	const deactivate = () => {
		navSearchToggleElem.deactivate()
		navSearchToggleElem.elem.setAttribute('aria-label', 'Show search menu')
		navSearchToggleOpenElem.show()
		navSearchToggleCloseElem.hide()
		navSearchPanelElem.collapse()
	}

	navSearchToggleElem.show()
	navSearchPanelElem.collapse()

	if (searchBox.value) {
		activate()
	} else {
		deactivate()
	}

	navSearchToggle.addEventListener('click', () => {
		if (navSearchPanelElem.hidden) {
			activate()
		} else {
			deactivate()
		}
	})
}
