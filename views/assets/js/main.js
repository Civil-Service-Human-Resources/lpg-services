let $ = require('jquery')
window.$ = $
window.jQuery = $

require('./govuk_frontend_toolkit/govuk/show-hide-content')
require('./govuk_frontend_toolkit/govuk/modules')
require('./govuk_frontend_toolkit/govuk/govuk-template')
require('./accordion')
require('./cookies')
require('./typeahead')
require('./prevent-double-click')

$(document).ready(function () {
	GOVUK.modules.start()
})
