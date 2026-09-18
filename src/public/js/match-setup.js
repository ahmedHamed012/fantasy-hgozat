/* Match setup: live team counters + inline "add new player" (AJAX).
   Progressive enhancement — the page works without JS (server parses the form
   and quick-add simply requires a page that has JS; without it, admins add
   players from the Players page). */
(function () {
  'use strict';

  var form = document.getElementById('assign-form');
  if (!form) return;

  var teamA = form.getAttribute('data-team-a');
  var teamB = form.getAttribute('data-team-b');
  var shortA = form.getAttribute('data-team-a-short') || 'A';
  var shortB = form.getAttribute('data-team-b-short') || 'B';
  var noneLabel = form.getAttribute('data-none-label') || '—';
  var list = document.getElementById('player-list');
  var countAEl = document.getElementById('count-a');
  var countBEl = document.getElementById('count-b');

  function csrfToken() {
    var m = document.querySelector('meta[name="csrf-token"]');
    return m ? m.getAttribute('content') : '';
  }

  function recount() {
    var a = 0;
    var b = 0;
    form.querySelectorAll('input[type="radio"]:checked').forEach(function (r) {
      if (r.value === teamA) a++;
      else if (r.value === teamB) b++;
    });
    if (countAEl) countAEl.textContent = String(a);
    if (countBEl) countBEl.textContent = String(b);
  }

  form.addEventListener('change', function (e) {
    if (e.target && e.target.type === 'radio') recount();
  });

  // ---- Add a player row to the DOM (used after a successful quick-add) ----
  function addPlayerRow(player) {
    var empty = document.getElementById('empty-row');
    if (empty) empty.remove();

    var li = document.createElement('li');
    li.className = 'assign-row';
    li.setAttribute('data-player-id', player.id);

    var playerCell = document.createElement('div');
    playerCell.className = 'assign-row__player';
    var avatar = document.createElement('span');
    avatar.className = 'avatar avatar--sm avatar--initials';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = (player.name || '?').trim().charAt(0).toUpperCase();
    var name = document.createElement('span');
    name.className = 'assign-row__name';
    name.textContent = player.name; // textContent → no HTML injection
    playerCell.appendChild(avatar);
    playerCell.appendChild(name);

    var seg = document.createElement('div');
    seg.className = 'segmented';
    var opts = [
      { value: '', label: noneLabel, cls: '' },
      { value: teamA, label: shortA, cls: ' segmented__opt--a' },
      { value: teamB, label: shortB, cls: ' segmented__opt--b' },
    ];
    opts.forEach(function (opt, idx) {
      var label = document.createElement('label');
      label.className = 'segmented__opt' + opt.cls;
      var input = document.createElement('input');
      input.type = 'radio';
      input.name = 'assign[' + player.id + ']';
      input.value = opt.value;
      if (idx === 0) input.checked = true;
      var span = document.createElement('span');
      span.textContent = opt.label;
      label.appendChild(input);
      label.appendChild(span);
      seg.appendChild(label);
    });

    li.appendChild(playerCell);
    li.appendChild(seg);
    list.appendChild(li);
  }

  // ---- Quick-add player form --------------------------------------------
  var addForm = document.getElementById('add-player-form');
  var nameInput = document.getElementById('new-player-name');
  var errEl = document.getElementById('add-player-error');

  if (addForm) {
    addForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = (nameInput.value || '').trim();
      if (!value) return;
      if (errEl) errEl.hidden = true;

      fetch(addForm.getAttribute('data-url'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken(),
          Accept: 'application/json',
        },
        body: JSON.stringify({ name: value }),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          if (!result.ok) throw new Error(result.data && result.data.error);
          addPlayerRow(result.data);
          nameInput.value = '';
          nameInput.focus();
        })
        .catch(function (err) {
          if (errEl) {
            errEl.textContent = (err && err.message) || errEl.getAttribute('data-fallback') || 'Error';
            errEl.hidden = false;
          }
        });
    });
  }

  recount();
})();
