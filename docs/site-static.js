/* Shared footer year for the static subpages. No tracking, no dependencies. */
(function () {
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
