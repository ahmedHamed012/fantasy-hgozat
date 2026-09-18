/* Fantasy plan builder: live budget/squad meter, selection limit, captain
   handling. The server re-validates everything on submit. */
(function () {
  'use strict';
  var form = document.getElementById('fantasy-form');
  if (!form) return;

  var budget = parseInt(form.getAttribute('data-budget'), 10) || 0;
  var squad = parseInt(form.getAttribute('data-squad'), 10) || 5;
  var picks = Array.prototype.slice.call(form.querySelectorAll('[data-pick]'));
  var caps = Array.prototype.slice.call(form.querySelectorAll('[data-cap]'));
  var countEl = document.getElementById('count');
  var spentEl = document.getElementById('spent');
  var remainingEl = document.getElementById('remaining');
  var saveBtn = document.getElementById('save-plan');

  function playerEl(input) {
    return input.closest('.fantasy-player');
  }
  function priceOf(input) {
    return parseInt(playerEl(input).getAttribute('data-price'), 10) || 0;
  }
  function selectedPicks() {
    return picks.filter(function (p) { return p.checked; });
  }
  function captain() {
    for (var i = 0; i < caps.length; i++) if (caps[i].checked) return caps[i];
    return null;
  }

  function refresh() {
    var chosen = selectedPicks();
    var count = chosen.length;
    var spent = chosen.reduce(function (s, p) { return s + priceOf(p); }, 0);

    if (countEl) countEl.textContent = String(count);
    if (spentEl) spentEl.textContent = String(spent);
    if (remainingEl) {
      remainingEl.textContent = (budget - spent) + 'M';
      remainingEl.classList.toggle('is-over', spent > budget);
    }

    // Reflect selection state + cap the squad size.
    picks.forEach(function (p) {
      playerEl(p).classList.toggle('is-selected', p.checked);
      if (!p.checked) p.disabled = count >= squad; // can't add beyond the limit
    });

    // A captain must be one of the chosen players.
    var cap = captain();
    if (cap && !cap.checked) {
      // captain radio corresponds to a player; ensure that player is checked
      var pid = cap.value;
      var pick = picks.filter(function (p) { return p.value === pid; })[0];
      if (pick && !pick.checked) { cap.checked = false; }
    }

    var valid = count === squad && spent <= budget && !!captain();
    if (saveBtn) saveBtn.disabled = !valid;
  }

  form.addEventListener('change', function (e) {
    var t = e.target;
    if (t && t.hasAttribute('data-cap') && t.checked) {
      // Selecting a captain auto-selects that player.
      var pick = picks.filter(function (p) { return p.value === t.value; })[0];
      if (pick && !pick.checked && selectedPicks().length < squad) pick.checked = true;
    }
    if (t && t.hasAttribute('data-pick') && !t.checked) {
      // Deselecting the captain's player clears the captain.
      var cap = captain();
      if (cap && cap.value === t.value) cap.checked = false;
    }
    refresh();
  });

  refresh();
})();
