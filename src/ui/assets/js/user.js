
if (typeof XMLHttpRequest !== 'undefined') {
  window._xhr = XMLHttpRequest;
  window.XMLHttpRequest = function () {
    var x = new window._xhr();
    x.withCredentials = true;
    return x;
  }
}

if (false) {
  // Code that enables debug output from TinCan lib.
  function d() {
    if (window.TinCan && window.TinCan.enableDebug) {
      window.TinCan.enableDebug();
    } else {
      setTimeout(d, 1);
    }
  }
  d();
}
