/* Geometry helpers, track definition and collision tests.
   - Circle vs circle: car-to-car bumps and bullet hits
   - AABB vs AABB:     pickups (and a cheap broad-phase for bullets) */

const Geo = {
  clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); },
  // Signed difference a - b wrapped into [-PI, PI]
  angleDiff(a, b) {
    let d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }
};

/* The track is a ring between two ellipses. */
const Track = {
  cx: 480, cy: 300,
  orx: 450, ory: 260,   // outer edge radii
  irx: 230, iry: 90,    // inner edge radii
  mrx: 340, mry: 175,   // racing line (middle) radii

  onTrack(x, y) {
    const dxo = (x - this.cx) / this.orx, dyo = (y - this.cy) / this.ory;
    const dxi = (x - this.cx) / this.irx, dyi = (y - this.cy) / this.iry;
    return (dxo * dxo + dyo * dyo) < 1 && (dxi * dxi + dyi * dyi) >= 1;
  },
  // Point on the racing line at angle a, shifted sideways by "off" pixels
  mid(a, off) {
    off = off || 0;
    return {
      x: this.cx + (this.mrx + off) * Math.cos(a),
      y: this.cy + (this.mry + off) * Math.sin(a)
    };
  },
  // Direction of travel (clockwise on screen) at angle a
  headingAt(a) {
    return Math.atan2(this.mry * Math.cos(a), -this.mrx * Math.sin(a));
  }
};

const Collision = {
  // Returns {nx, ny, depth} (normal from a to b) or null when not touching
  circleOverlap(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.hypot(dx, dy);
    const r = a.r + b.r;
    if (d >= r) return null;
    if (d === 0) return { nx: 1, ny: 0, depth: r };
    return { nx: dx / d, ny: dy / d, depth: r - d };
  },
  circleHit(a, b) { return this.circleOverlap(a, b) !== null; },

  // Boxes are centred: {x, y, hw, hh} (half width / half height)
  aabbHit(a, b) {
    return Math.abs(a.x - b.x) <= a.hw + b.hw &&
           Math.abs(a.y - b.y) <= a.hh + b.hh;
  },
  boxOf(c) { return { x: c.x, y: c.y, hw: c.r, hh: c.r }; }
};
