// Google Fonts without blocking the first paint: the page preloads the stylesheet; this attaches it as a
// print stylesheet and switches it on the moment it arrives (text shows in the fallback font until then).
(function () {
  function attach() {
    var pre = document.querySelector('link[rel="preload"][as="style"][href^="https://fonts.googleapis.com/"]');
    if (!pre) return false;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = pre.href;
    link.media = "print";
    link.onload = function () { this.media = "all"; };
    document.head.appendChild(link);
    return true;
  }
  if (!attach()) document.addEventListener("DOMContentLoaded", attach);
})();
