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

	navSearchToggleElem.show()
	navSearchPanelElem.collapse()

	if (searchBox.value) {
		navSearchToggleElem.activate()
		navSearchToggleOpenElem.hide()
		navSearchToggleCloseElem.show()
		navSearchPanelElem.expand()
	} else {
		navSearchToggleElem.deactivate()
		navSearchToggleOpenElem.show()
		navSearchToggleCloseElem.hide()
		navSearchPanelElem.collapse()
	}

	navSearchToggle.addEventListener('click', () => {
		if (navSearchPanelElem.hidden) {
			navSearchToggleElem.activate()
			navSearchToggleOpenElem.hide()
			navSearchToggleCloseElem.show()
			navSearchPanelElem.expand()
		} else {
			navSearchToggleElem.deactivate()
			navSearchToggleOpenElem.show()
			navSearchToggleCloseElem.hide()
			navSearchPanelElem.collapse()
		}
	})
}
