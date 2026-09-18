/* Global progressive enhancements, CSP-safe (no inline handlers).
   Any form with a data-confirm attribute asks for confirmation before submit. */
(function () {
  'use strict';
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (form && form.matches && form.matches('[data-confirm]')) {
      var message = form.getAttribute('data-confirm');
      if (message && !window.confirm(message)) {
        e.preventDefault();
      }
    }
  });
})();
