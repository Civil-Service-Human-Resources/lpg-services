
var CLOSE_METHODS = {

    csl: function() {
        var match = window.location.toString().match(/(https?):\/\/([^-]*)-?cdn\.learn\.civilservice\.gov\.uk\/[^/]+\/([^/]+)\/([^/]+)\/.*$/);
        if (!match) {
            throw new Error('Content being accessed on invalid domain');
        }
        var scheme = match[1];
        var env = !!match[2] ? match[2] + '-' : '';
        var host = env + 'learn.' +'civilservice.gov.uk/';
        var path = 'learning-record/' + match[3] + '/' + match[4];

        if (match[2] === 'local') {
            scheme = 'http';
            host = 'lpg.local.cshr.digital:3001/';
        }

        window.location = scheme + '://' + host + path;
        return true;
    }
};


function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}


// Native js method to run on document ready thats crossbrowser and also will not override any existing on ready code
function r(f){/in/.test(document.readyState)?setTimeout('r('+f+')',9):f()}
r(function(){
	var title = getParameterByName('title');
	document.title = title;
});
