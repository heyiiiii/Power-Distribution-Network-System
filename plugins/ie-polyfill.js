if (process.client) {
  window.isIE = function() {
    return !!window.ActiveXObject || 'ActiveXObject' in window;
  };
  window.isIE11 = function() {
    return (/Trident\/7\./).test(navigator.userAgent);
  };
  window.removeElement = function (node) {
    if (window.isIE() || window.isIE11()) {
      node.removeNode();
    } else {
      node.remove();
    }
  };
}
