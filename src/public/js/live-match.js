/* Live match counters.
   Interaction model: instant optimistic update on tap, then reconcile to the
   server's authoritative value (atomic increment/decrement on the backend).
   On failure the optimistic change is reverted and a toast is shown. The server
   never trusts a client-provided value, so rapid taps are safe. */
(function () {
  'use strict';

  var grid = document.getElementById('live-grid');
  if (!grid) return;

  var matchId = grid.getAttribute('data-match');

  function csrfToken() {
    var m = document.querySelector('meta[name="csrf-token"]');
    return m ? m.getAttribute('content') : '';
  }

  // ---- Toast (transient error notice) ------------------------------------
  var toastEl = null;
  var toastTimer = null;
  function toast(message) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'live-toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-visible');
    }, 3000);
  }
  var offlineMsg = grid.getAttribute('data-offline-msg') || 'Update failed.';

  function updateScores(scores) {
    if (!scores) return;
    Object.keys(scores).forEach(function (teamId) {
      var el = document.querySelector('.scoreboard__score[data-team="' + teamId + '"]');
      if (el) el.textContent = String(scores[teamId]);
    });
  }

  grid.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.stat-btn') : null;
    if (!btn) return;

    var row = btn.closest('.stat-row');
    if (!row) return;

    var participantId = row.getAttribute('data-participant');
    var stat = row.getAttribute('data-stat');
    var valueEl = row.querySelector('.stat-value');
    var prev = parseInt(valueEl.textContent, 10) || 0;
    var inc = btn.getAttribute('data-action') === 'inc';

    // Nothing to do when trying to go below zero.
    if (!inc && prev <= 0) return;

    var optimistic = Math.max(0, prev + (inc ? 1 : -1));
    valueEl.textContent = String(optimistic);

    var verb = inc ? 'increment' : 'decrement';
    var url =
      '/admin/matches/' + matchId + '/participants/' + participantId + '/' + verb;

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken(),
        Accept: 'application/json',
      },
      body: JSON.stringify({ stat: stat }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('bad status');
        return res.json();
      })
      .then(function (data) {
        // Reconcile to the authoritative value + scores.
        valueEl.textContent = String(data.value);
        updateScores(data.scores);
      })
      .catch(function () {
        valueEl.textContent = String(prev); // revert
        toast(offlineMsg);
      });
  });
})();
