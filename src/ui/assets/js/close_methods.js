
var CLOSE_METHODS = {

    csl: function() {
        var match = window.location.toString().match(/(https?):\/\/([^-]*)-?cdn\.cshr\.digital\/.*\/([^/]+)\/([^/]+)\/.*$/);
        if (!match) {
            throw new Error('Content being accessed on invalid domain');
        }
        var scheme = match[1];
        var env = !!match[2] ? match[2] + '-' : '';
        var host = env + 'lpg.' +'cshr.digital/';
        var path = 'learning-record/' + match[3] + '/' + match[4];

        if (match[2] === 'local') {
            scheme = 'http';
            host = 'lpg.local.cshr.digital:3001/';
        }

        window.location = scheme + '://' + host + path;
        return true;
    }
};
