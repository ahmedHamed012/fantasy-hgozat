/* Global progressive enhancements, CSP-safe (no inline handlers).
   Any form with a data-confirm attribute asks for confirmation before submit. */
(function () {
  'use strict';

  // Confirm-before-submit for forms with a data-confirm attribute.
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (form && form.matches && form.matches('[data-confirm]')) {
      var message = form.getAttribute('data-confirm');
      if (message && !window.confirm(message)) {
        e.preventDefault();
      }
    }
  });

  // Dropdown menus (e.g. the account menu). A [data-dropdown-toggle] button
  // toggles its closest .account-menu; clicking outside or Escape closes it.
  function closeAll(except) {
    document.querySelectorAll('.account-menu.is-open').forEach(function (m) {
      if (m !== except) {
        m.classList.remove('is-open');
        var t = m.querySelector('[data-dropdown-toggle]');
        if (t) t.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.addEventListener('click', function (e) {
    var toggle = e.target.closest ? e.target.closest('[data-dropdown-toggle]') : null;
    if (toggle) {
      var menu = toggle.closest('.account-menu');
      closeAll(menu);
      var open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      e.stopPropagation();
      return;
    }
    // Click outside any open menu closes them (but not clicks inside the panel).
    if (!e.target.closest || !e.target.closest('.account-menu__panel')) {
      closeAll(null);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAll(null);
  });
})();
