/* Page navigation, car selection and result screen. */

(function () {
  'use strict';

  const pages = Array.prototype.slice.call(document.querySelectorAll('.page'));
  let selectedId = null;

  function show(id) {
    Game.stop();
    pages.forEach(function (p) { p.classList.toggle('active', p.id === id); });
  }

  document.querySelectorAll('[data-page]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      show(a.getAttribute('data-page'));
    });
  });

  function statRow(label, pct) {
    return '<div class="stat">' + label + '</div>' +
           '<div class="stat-bar"><i style="width:' + Math.round(pct) + '%"></i></div>';
  }

  const grid = document.getElementById('carGrid');
  const goBtn = document.getElementById('goBtn');

  CARS.forEach(function (car) {
    const el = document.createElement('div');
    el.className = 'car-card';
    el.innerHTML =
      '<div class="swatch" style="background:' + car.color + ';box-shadow:0 0 10px ' + car.color + '"></div>' +
      '<h3>' + car.name + '</h3>' +
      '<div class="stat">' + car.tagline + '</div>' +
      '<div class="stat">' + car.hp + ' HP &middot; ' + car.topKmh + ' km/h</div>' +
      statRow('Power', car.hp / 700 * 100) +
      statRow('Top speed', car.maxSpeed / 250 * 100) +
      statRow('Handling', car.handling / 3.8 * 100) +
      statRow('Armor', car.health / 110 * 100);
    el.addEventListener('click', function () {
      selectedId = car.id;
      grid.querySelectorAll('.car-card').forEach(function (c) { c.classList.remove('selected'); });
      el.classList.add('selected');
      goBtn.disabled = false;
    });
    grid.appendChild(el);
  });

  document.getElementById('startBtn').addEventListener('click', function () { show('select'); });
  document.getElementById('againBtn').addEventListener('click', function () { show('select'); });

  goBtn.addEventListener('click', function () {
    if (!selectedId) return;
    show('game');
    Game.start(selectedId);
  });

  function ordinal(n) { return n + (['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : (n % 10 < 4 ? n % 10 : 0)]); }

  Game.onEnd = function (r) {
    show('result');
    const title = document.getElementById('resultTitle');
    const text = document.getElementById('resultText');
    if (r.outcome === 'win') {
      title.textContent = 'VICTORY';
      text.textContent = 'You won in ' + r.time.toFixed(1) + ' seconds.';
    } else if (r.outcome === 'finish') {
      title.textContent = 'FINISHED ' + ordinal(r.place);
      text.textContent = 'You crossed the line in ' + r.time.toFixed(1) + ' seconds.';
    } else {
      title.textContent = 'WRECKED';
      text.textContent = 'Your car was destroyed. Watch your heat and dodge the rivals\' fire.';
    }
  };
})();
