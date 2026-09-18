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

  // ---- Live pitch preview -------------------------------------------------
  var pitch = document.getElementById('pitch-preview');
  var SVGNS = 'http://www.w3.org/2000/svg';

  function buildKit(el, isCaptain) {
    var team = (el.getAttribute('data-team') || 'A').toLowerCase();
    var kit = document.createElement('div');
    kit.className = 'pitch-kit pitch-kit--' + team;

    var shirt = document.createElement('div');
    shirt.className = 'pitch-kit__shirt';
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS(SVGNS, 'use');
    use.setAttribute('href', '#i-kit');
    svg.appendChild(use);
    shirt.appendChild(svg);
    if (isCaptain) {
      var cap = document.createElement('span');
      cap.className = 'pitch-kit__cap';
      cap.textContent = pitch.getAttribute('data-cap-label') || 'C';
      shirt.appendChild(cap);
    }
    kit.appendChild(shirt);

    var name = document.createElement('span');
    name.className = 'pitch-kit__name';
    name.textContent = el.getAttribute('data-name') || '';
    kit.appendChild(name);

    var sub = document.createElement('span');
    sub.className = 'pitch-kit__sub';
    sub.textContent = (el.getAttribute('data-price') || '0') + 'M';
    kit.appendChild(sub);
    return kit;
  }

  function renderPitch() {
    if (!pitch) return;
    var chosen = selectedPicks();
    pitch.innerHTML = '';
    if (chosen.length === 0) {
      pitch.classList.add('pitch--empty');
      var msg = document.createElement('p');
      msg.className = 'pitch__empty';
      msg.textContent = pitch.getAttribute('data-empty') || '';
      pitch.appendChild(msg);
      return;
    }
    pitch.classList.remove('pitch--empty');
    var cap = captain();
    var capId = cap ? cap.value : '';
    var rows = { A: document.createElement('div'), B: document.createElement('div') };
    rows.A.className = 'pitch__row';
    rows.B.className = 'pitch__row';
    chosen.forEach(function (input) {
      var el = playerEl(input);
      var team = (el.getAttribute('data-team') || 'A').toUpperCase();
      (rows[team] || rows.A).appendChild(buildKit(el, input.value === capId));
    });
    pitch.appendChild(rows.A);
    pitch.appendChild(rows.B);
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

    renderPitch();
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
