/* Main game: fixed-step update() / render() loop at 60 FPS on an HTML5 canvas. */

const Game = (function () {
  'use strict';

  const W = 960, H = 600, TWO_PI = Math.PI * 2, STEP = 1 / 60;
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const hud = {
    lap: document.getElementById('hudLap'),
    speed: document.getElementById('hudSpeed'),
    health: document.getElementById('hudHealth'),
    heat: document.getElementById('hudHeat'),
    ammo: document.getElementById('hudAmmo')
  };

  const keys = {};
  let state = null, running = false, raf = 0, lastT = 0, acc = 0;

  window.addEventListener('keydown', function (e) {
    keys[e.code] = true;
    if (running && ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) !== -1) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });

  /* ---------- setup ---------- */

  function makeCar(spec, slot, isPlayer, skill, name) {
    const angle = -0.05 - 0.07 * slot;
    const lane = (slot % 2) ? 30 : -30;
    const p = Track.mid(angle, lane);
    return {
      spec: spec, name: name, isPlayer: isPlayer, skill: skill || 1, lane: lane,
      x: p.x, y: p.y, r: 12, heading: Track.headingAt(angle), speed: 0, vx: 0, vy: 0,
      health: spec.health, heat: 0, overheated: false, boosting: false, wantBoost: false,
      ammo: 30, cooldown: 0, bumpCd: 0, progress: angle, lastAngle: angle,
      finished: false, dead: false
    };
  }

  function makePickups() {
    const defs = [
      { a: Math.PI * 0.5, off: 30, type: 'coolant' },
      { a: Math.PI * 0.95, off: -30, type: 'ammo' },
      { a: Math.PI * 1.5, off: 30, type: 'repair' },
      { a: Math.PI * 1.9, off: -30, type: 'coolant' },
      { a: Math.PI * 0.2, off: -30, type: 'ammo' }
    ];
    return defs.map(function (d) {
      const p = Track.mid(d.a, d.off);
      return { x: p.x, y: p.y, hw: 10, hh: 10, type: d.type, cd: 0 };
    });
  }

  function start(carId) {
    const spec = CARS.find(function (c) { return c.id === carId; }) || CARS[0];
    const others = CARS.filter(function (c) { return c.id !== spec.id; });
    const botSpecs = [others[0], others[1], CARS[Math.floor(Math.random() * CARS.length)]];
    const skills = [0.92, 0.82, 0.72];
    const names = ['RIVAL-1', 'RIVAL-2', 'RIVAL-3'];

    const player = makeCar(spec, 1, true, 1, 'YOU');
    const bots = [0, 2, 3].map(function (slot, i) {
      const bs = Object.assign({}, botSpecs[i], { maxSpeed: botSpecs[i].maxSpeed * skills[i] });
      return makeCar(bs, slot, false, skills[i], names[i]);
    });

    state = {
      player: player, bots: bots, cars: [player].concat(bots),
      bullets: [], sparks: [], pickups: makePickups(),
      countdown: 3.6, time: 0, finishCount: 0,
      over: false, endTimer: 1.2, result: null
    };
    running = true;
    lastT = performance.now();
    acc = 0;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  /* ---------- loop ---------- */

  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.1, (t - lastT) / 1000);
    lastT = t;
    acc += dt;
    while (acc >= STEP) { update(STEP); acc -= STEP; if (!running) return; }
    render();
    raf = requestAnimationFrame(frame);
  }

  function playerInput() {
    return {
      throttle: (keys.KeyW || keys.ArrowUp) ? 1 : 0,
      brake: !!(keys.KeyS || keys.ArrowDown),
      steer: ((keys.KeyD || keys.ArrowRight) ? 1 : 0) - ((keys.KeyA || keys.ArrowLeft) ? 1 : 0),
      boost: !!(keys.ShiftLeft || keys.ShiftRight),
      shootAngle: keys.Space ? state.player.heading : null
    };
  }

  function stepCar(c, input, dt) {
    const s = c.spec;
    c.wantBoost = input.boost && !c.overheated && input.throttle > 0;
    c.boosting = c.wantBoost;

    // Heat: Heat_final = Heat_initial + boost_time * rate - cooling
    c.heat = Heat.step(c.heat, c.wantBoost, dt, s.heatRate);
    if (c.heat >= Heat.MAX) c.overheated = true;
    else if (c.overheated && c.heat <= Heat.RESUME) c.overheated = false;
    if (c.overheated) c.health -= Heat.OVERHEAT_DAMAGE * dt;

    let max = s.maxSpeed * (c.wantBoost ? 1.4 : 1);
    if (c.overheated) max *= 0.6;
    if (!Track.onTrack(c.x, c.y)) max *= 0.45;
    const acc = s.accel * (c.wantBoost ? 1.8 : 1);

    if (input.throttle > 0) c.speed += acc * input.throttle * dt;
    else if (input.brake) c.speed -= acc * 1.6 * dt;
    else if (c.speed > 0) c.speed = Math.max(0, c.speed - 40 * dt);
    else if (c.speed < 0) c.speed = Math.min(0, c.speed + 40 * dt);

    if (c.speed > max) c.speed = Math.max(max, c.speed - 220 * dt);
    c.speed = Geo.clamp(c.speed, -60, s.maxSpeed * 1.5);

    const grip = Geo.clamp(c.speed / 60, -1, 1);
    c.heading += input.steer * s.handling * grip * dt;

    c.vx = Math.cos(c.heading) * c.speed;
    c.vy = Math.sin(c.heading) * c.speed;
    c.x = Geo.clamp(c.x + c.vx * dt, c.r, W - c.r);
    c.y = Geo.clamp(c.y + c.vy * dt, c.r, H - c.r);
    if (c.cooldown > 0) c.cooldown -= dt;
    if (c.bumpCd > 0) c.bumpCd -= dt;
  }

  function fire(c, angle) {
    if (c.cooldown > 0 || c.ammo <= 0 || c.dead) return;
    c.ammo--;
    c.cooldown = c.isPlayer ? 0.22 : 0.7;
    state.bullets.push({
      x: c.x + Math.cos(angle) * 16, y: c.y + Math.sin(angle) * 16,
      vx: Math.cos(angle) * CONFIG.BULLET_SPEED, vy: Math.sin(angle) * CONFIG.BULLET_SPEED,
      life: 1.3, r: 3, owner: c
    });
  }

  function sparkBurst(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * TWO_PI, v = 40 + Math.random() * 120;
      state.sparks.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.4, color: color });
    }
  }

  function update(dt) {
    const s = state;
    if (s.countdown > 0) { s.countdown -= dt; return; }
    s.time += dt;
    const idle = { throttle: 0, brake: false, steer: 0, boost: false, shootAngle: null };

    // Drive every car
    s.cars.forEach(function (c) {
      let input;
      if (c.dead) input = idle;
      else if (c.isPlayer) input = s.over ? idle : playerInput();
      else input = AI.drive(c, s.player);
      stepCar(c, input, dt);
      if (input.shootAngle !== null) fire(c, input.shootAngle);

      // Lap progress from the angle around the track centre
      const a = Math.atan2(c.y - Track.cy, c.x - Track.cx);
      c.progress += Geo.angleDiff(a, c.lastAngle);
      c.lastAngle = a;

      if (!c.finished && !c.dead && c.progress >= TWO_PI * CONFIG.LAPS) {
        c.finished = true;
        s.finishCount++;
        c.place = s.finishCount;
        if (c.isPlayer) finish(c.place === 1 ? 'win' : 'finish', c.place);
      }
      if (!c.dead && c.health <= 0) {
        c.dead = true; c.health = 0;
        sparkBurst(c.x, c.y, '#ffb400');
        if (c.isPlayer) finish('wrecked', 0);
      }
    });

    // Bullets (AABB broad-phase, then circle test)
    s.bullets = s.bullets.filter(function (b) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.life <= 0 || b.x < 0 || b.x > W || b.y < 0 || b.y > H) return false;
      const targets = b.owner.isPlayer ? s.bots : [s.player];
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        if (t.dead) continue;
        const bb = { x: b.x, y: b.y, hw: b.r, hh: b.r };
        if (Collision.aabbHit(bb, Collision.boxOf(t)) && Collision.circleHit(b, t)) {
          t.health -= CONFIG.BULLET_DAMAGE;
          sparkBurst(b.x, b.y, '#ff2bd6');
          return false;
        }
      }
      return true;
    });

    // Car vs car (circle-to-circle)
    for (let i = 0; i < s.cars.length; i++) {
      for (let j = i + 1; j < s.cars.length; j++) {
        const a = s.cars[i], b = s.cars[j];
        if (a.dead || b.dead) continue; // wrecks don't block the track
        const o = Collision.circleOverlap(a, b);
        if (!o) continue;
        a.x -= o.nx * o.depth / 2; a.y -= o.ny * o.depth / 2;
        b.x += o.nx * o.depth / 2; b.y += o.ny * o.depth / 2;
        // Damage once per real impact (not every frame while touching)
        const rel = Math.abs(a.speed - b.speed);
        if (rel > 25) {
          [a, b].forEach(function (c) {
            if (!c.dead && c.bumpCd <= 0) { c.health -= 1 + rel * 0.04; c.bumpCd = 0.4; }
          });
        }
        const avg = (a.speed + b.speed) / 2;
        a.speed = avg * 0.95; b.speed = avg * 0.95;
        sparkBurst((a.x + b.x) / 2, (a.y + b.y) / 2, '#ffffff');
      }
    }

    // Pickups (AABB)
    s.pickups.forEach(function (p) {
      if (p.cd > 0) { p.cd -= dt; return; }
      for (let i = 0; i < s.cars.length; i++) {
        const c = s.cars[i];
        if (c.dead || !Collision.aabbHit(Collision.boxOf(c), p)) continue;
        if (p.type === 'ammo') c.ammo = Math.min(60, c.ammo + 15);
        else if (p.type === 'repair') c.health = Math.min(c.spec.health, c.health + 25);
        else c.heat = Math.max(0, c.heat - 40);
        p.cd = 8;
        break;
      }
    });

    s.sparks = s.sparks.filter(function (k) {
      k.x += k.vx * dt; k.y += k.vy * dt; k.life -= dt; return k.life > 0;
    });

    if (s.over) {
      s.endTimer -= dt;
      if (s.endTimer <= 0) {
        const result = s.result;
        stop();
        if (api.onEnd) api.onEnd(result);
      }
    }
  }

  function finish(outcome, place) {
    if (state.over) return;
    state.over = true;
    state.result = { outcome: outcome, place: place, time: state.time, total: state.cars.length };
  }

  /* ---------- drawing ---------- */

  function ellipsePath(rx, ry) {
    ctx.beginPath();
    ctx.ellipse(Track.cx, Track.cy, rx, ry, 0, 0, TWO_PI);
  }

  function drawTrack() {
    ctx.fillStyle = '#06060d';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(0,240,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    ctx.beginPath();
    ctx.ellipse(Track.cx, Track.cy, Track.orx, Track.ory, 0, 0, TWO_PI);
    ctx.moveTo(Track.cx + Track.irx, Track.cy);
    ctx.ellipse(Track.cx, Track.cy, Track.irx, Track.iry, 0, 0, TWO_PI);
    ctx.fillStyle = '#1b1b2b';
    ctx.fill('evenodd');

    ctx.save();
    ctx.lineWidth = 3;
    ctx.shadowBlur = 16;
    ctx.shadowColor = '#00f0ff'; ctx.strokeStyle = '#00f0ff';
    ellipsePath(Track.orx, Track.ory); ctx.stroke();
    ctx.shadowColor = '#ff2bd6'; ctx.strokeStyle = '#ff2bd6';
    ellipsePath(Track.irx, Track.iry); ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.setLineDash([14, 14]);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ellipsePath(Track.mrx, Track.mry); ctx.stroke();
    ctx.restore();

    // Start / finish line
    const x0 = Track.cx + Track.irx, x1 = Track.cx + Track.orx, sq = 10;
    for (let r = 0; r < 2; r++) {
      for (let x = x0, i = 0; x < x1; x += sq, i++) {
        ctx.fillStyle = ((i + r) % 2) ? '#ffffff' : '#000000';
        ctx.fillRect(x, Track.cy - sq + r * sq, Math.min(sq, x1 - x), sq);
      }
    }
  }

  function drawPickups() {
    const colors = { ammo: '#ffb400', repair: '#00ff88', coolant: '#00aaff' };
    const labels = { ammo: 'A', repair: '+', coolant: 'C' };
    state.pickups.forEach(function (p) {
      if (p.cd > 0) return;
      ctx.save();
      ctx.shadowBlur = 12; ctx.shadowColor = colors[p.type];
      ctx.fillStyle = colors[p.type];
      ctx.fillRect(p.x - p.hw, p.y - p.hh, p.hw * 2, p.hh * 2);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#000';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(labels[p.type], p.x, p.y + 1);
      ctx.restore();
    });
  }

  function drawCar(c) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.heading);
    const body = c.dead ? '#555' : c.spec.color;
    ctx.shadowBlur = c.dead ? 0 : 14;
    ctx.shadowColor = body;
    ctx.fillStyle = body;
    ctx.fillRect(-15, -8, 30, 16);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0b0b16';
    ctx.fillRect(-2, -6, 9, 12);       // cabin
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(12, -6, 3, 3);        // headlights
    ctx.fillRect(12, 3, 3, 3);
    if (c.boosting && !c.dead) {
      ctx.fillStyle = c.heat > 75 ? '#ff2b2b' : '#00f0ff';
      ctx.shadowBlur = 12; ctx.shadowColor = ctx.fillStyle;
      ctx.beginPath();
      ctx.moveTo(-15, -5); ctx.lineTo(-15 - 12 - Math.random() * 8, 0); ctx.lineTo(-15, 5);
      ctx.fill();
    }
    ctx.restore();
    if (c.isPlayer) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace'; ctx.textAlign = 'center';
      ctx.fillText('YOU', c.x, c.y - 18);
    }
  }

  function drawOverlay() {
    const s = state, p = s.player;
    let rank = 1;
    s.cars.forEach(function (c) { if (c !== p && c.progress > p.progress) rank++; });
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 16px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('POS ' + rank + '/' + s.cars.length, 14, 12);
    ctx.fillText('TIME ' + s.time.toFixed(1) + 's', 14, 32);

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (p.overheated && !s.over) {
      ctx.fillStyle = (Math.floor(s.time * 4) % 2) ? '#ff2b2b' : '#ffb400';
      ctx.font = 'bold 28px monospace';
      ctx.fillText('ENGINE OVERHEAT', W / 2, 40);
    }
    if (s.countdown > 0) {
      ctx.fillStyle = '#ffffff'; ctx.shadowColor = '#ff2bd6'; ctx.shadowBlur = 24;
      ctx.font = 'bold 120px monospace';
      ctx.fillText(String(Math.max(1, Math.ceil(s.countdown - 0.6))), W / 2, H / 2);
      ctx.shadowBlur = 0;
    } else if (s.time < 0.7) {
      ctx.fillStyle = '#00ff88'; ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 24;
      ctx.font = 'bold 100px monospace';
      ctx.fillText('GO!', W / 2, H / 2);
      ctx.shadowBlur = 0;
    }
    if (s.over) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, H);
    }
  }

  function updateHud() {
    const p = state.player;
    hud.lap.textContent = Math.min(CONFIG.LAPS, Math.floor(Math.max(0, p.progress) / TWO_PI) + 1) + '/' + CONFIG.LAPS;
    hud.speed.textContent = Math.round(Math.abs(p.speed) / p.spec.maxSpeed * p.spec.topKmh);
    hud.health.style.backgroundSize = Math.max(0, p.health / p.spec.health * 100) + '% 100%';
    hud.heat.style.backgroundSize = Math.min(100, p.heat) + '% 100%';
    hud.ammo.textContent = p.ammo;
  }

  function render() {
    drawTrack();
    drawPickups();
    state.sparks.forEach(function (k) {
      ctx.globalAlpha = Math.max(0, k.life / 0.4);
      ctx.fillStyle = k.color;
      ctx.fillRect(k.x, k.y, 2, 2);
    });
    ctx.globalAlpha = 1;
    state.bullets.forEach(function (b) {
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = b.owner.isPlayer ? '#00f0ff' : '#ff2bd6';
      ctx.fillStyle = ctx.shadowColor;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TWO_PI); ctx.fill();
      ctx.restore();
    });
    state.cars.forEach(drawCar);
    drawOverlay();
    updateHud();
  }

  const api = { start: start, stop: stop, onEnd: null };
  return api;
})();
