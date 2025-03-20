const accessibleAutocomplete = require('./accessible-autocomplete.min')

var selectEl = document.querySelector('.type-ahead')
if (selectEl) {
	accessibleAutocomplete.enhanceSelectElement({
		autoselect: false,
		defaultValue: '',
		minLength: 1,
		selectElement: selectEl,
		showAllValues: true,
	})
}
