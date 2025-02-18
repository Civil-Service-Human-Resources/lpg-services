let filterToggleClass = 'filter-toggle'
let filterHeadingsClass = 'filter-headings'
let toggleShutClass = 'filter-toggle--shut'
let showThisSection = '. Show this section'
let hideThisSection = '. Hide this section'

let filterToggles = document.getElementsByClassName(filterToggleClass)
function close(toggle, button) {
	toggle.classList.add(toggleShutClass)
	button.setAttribute('aria-expanded', 'false')
	button.setAttribute('aria-label', button.innerText + showThisSection)
}
function open(toggle, button) {
	toggle.classList.remove(toggleShutClass)
	button.setAttribute('aria-expanded', 'true')
	button.setAttribute('aria-label', button.innerText + hideThisSection)
}
for (let i = 0; i < filterToggles.length; i++) {
	let filterToggle = filterToggles[i]
	let filterToggleBtn = filterToggle.getElementsByClassName(filterHeadingsClass)[0]
	if (filterToggleBtn) {
		let anyChecked = filterToggle.querySelectorAll('input[type="checkbox"]:checked').length > 0
		if (!anyChecked) {
			close(filterToggle, filterToggleBtn)
		}

		filterToggleBtn.addEventListener('click', function (e) {
			e.preventDefault()
			let closed =
				filterToggle.classList.contains(toggleShutClass) && filterToggleBtn.getAttribute('aria-expanded') === 'false'
			if (closed) {
				open(filterToggle, filterToggleBtn)
			} else {
				close(filterToggle, filterToggleBtn)
			}
		})
	}
}
