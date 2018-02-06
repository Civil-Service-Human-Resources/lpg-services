
var CLOSE_METHODS = {

    csl: function() {
        var courseId = window.location.pathname.replace(/(\/|do|courses)/g, '');
        window.location = '/learning-record/' + courseId;
        return true;
    }
};
