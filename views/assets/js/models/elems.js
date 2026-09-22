export class BaseElement {
	hiddenModifier = 'hidden'
	elem
	hidden = false

	constructor(elem) {
		this.elem = elem
		this.hidden = !this.elem.classList.contains(this.hiddenModifier)
	}

	show() {
		this.elem.classList.remove(this.hiddenModifier)
		this.hidden = false
	}

	expand() {
		this.show()
		this.elem.setAttribute('aria-expanded', 'true')
	}

	hide() {
		this.elem.classList.add(this.hiddenModifier)
		this.hidden = true
	}

	collapse() {
		this.hide()
		this.elem.setAttribute('aria-expanded', 'false')
	}
}

export class ActiveElem extends BaseElement {
	activeModifier = 'active'
	active = false

	constructor(elem) {
		super(elem)
		this.active = this.elem.classList.contains(this.activeModifier)
	}

	activate() {
		this.elem.classList.add(this.activeModifier)
		this.active = true
	}

	deactivate() {
		this.elem.classList.remove(this.activeModifier)
		this.active = false
	}
}
