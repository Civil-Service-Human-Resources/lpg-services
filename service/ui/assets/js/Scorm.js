
// var BOOKMARK_COOKIE = "CIV-3221_BOOKMARK";
// var STATUS_COOKIE = "CIV-3221_STATUS";
// var SCORE_COOKIE = "CIV-3221_SCORE";
// var SUSPEND_DATA_COOKIE = "CIV-3221_SUSPEND_DATA";
//
// // Tracking functions
// function setBookmark(sBookmark) { setCookie(BOOKMARK_COOKIE, sBookmark); }
// function getBookmark() { return getCookie(BOOKMARK_COOKIE);	}
// function setStatus(sStatus) { setCookie(STATUS_COOKIE, sStatus); }
// function getStatus() { return getCookie(STATUS_COOKIE); }
// function setScore(nScore) { setCookie(SCORE_COOKIE, nScore); }
// function getScore() { var sScore = getCookie(SCORE_COOKIE); if (sScore == null || sScore.length == 0) sScore = "0"; return parseInt(sScore, 10); }
// function setSuspendData(sSuspendData) { setCookie(SUSPEND_DATA_COOKIE, sSuspendData); }
// function getSuspendData() { return getCookie(SUSPEND_DATA_COOKIE); }
// function getStudentName() { return ""; }

window.API = window.API_1484_11 = {
    LMSFinish() {
        // clear cookies?
        console.log('LMSFinish');
    },

    LMSGetValue(name) {
        console.log('LMSGetValue');
        return getCookie(name);
    },

    LMSSetValue(name, value) {
        console.log('LMSSetValue');
        setCookie(name, value);
        return 'true'
    },

    LMSInitialize() {
        console.log('LMSInitialize');
        return 'true';
    },

    LMSCommit() {
        console.log('LMSCommit');
        return 'true';
    },

    LMSGetLastError() {
        console.log('LMSGetLastError');
        return 0;
    },

    LMSGetErrorString(errorCode) {
        console.log('LMSGetErrorString');
        return 'No error';
    },

    LMSGetDiagnostic(errorCode) {
        console.log('LMSGetDiagnostic');
        return 'No error';
    }
}