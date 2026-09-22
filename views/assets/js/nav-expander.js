require('./models/elems')
const {BaseElement, ActiveElem} = require('./models/elems')

class Expander {
	toggleElem
	elemsToShowHide
	elemsToExpandCollapse
	expanded = false

	constructor(toggleElem, elemsToShowHide, elemsToExpandCollapse) {
		this.toggleElem = toggleElem
		this.elemsToShowHide = elemsToShowHide
		this.elemsToExpandCollapse = elemsToExpandCollapse
		toggleElem.show()
		this.collapse()
		this.toggleElem.elem.addEventListener('click', () => {
			if (this.expanded) {
				this.collapse()
				this.expanded = false
				this.toggleElem.deactivate()
			} else {
				this.expand()
				this.expanded = true
				this.toggleElem.activate()
			}
		})
	}

	expand() {
		this.elemsToShowHide.forEach(e => {
			e.show()
		})
		this.elemsToExpandCollapse.forEach(e => {
			e.expand()
		})
	}

	collapse() {
		this.elemsToShowHide.forEach(e => {
			e.hide()
		})
		this.elemsToExpandCollapse.forEach(e => {
			e.collapse()
		})
	}
}

const navBarToggleButton = document.getElementById('mobileNav')
const navBar = document.getElementById('navBar')

const requiredElems = [navBarToggleButton, navBar]
if (!requiredElems.includes(null)) {
	const navBarToggleButtonElem = new ActiveElem(navBarToggleButton)
	const navBarElem = new BaseElement(navBar)

	new Expander(navBarToggleButtonElem, [], [navBarElem])
}
