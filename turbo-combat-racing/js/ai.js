/* Enemy driver AI.
   - Driving: chase a point on the racing line a little ahead of the car.
   - Boost:   hysteresis so the bot boosts while cool and backs off before overheating.
   - Combat:  predictive aiming. The bullet needs t = distance / bulletSpeed seconds
              to arrive, so the bot aims at where the player will be at that time:
              predicted = playerPosition + playerVelocity * t
              It fires automatically once the target is inside range and a firing cone. */

const AI = {
  RANGE: 380,
  CONE: 0.5, // radians either side of the nose

  drive(bot, player) {
    // Parametric angle on the racing ellipse (not the polar angle), so the lead point is truly ahead
    const t = Math.atan2((bot.y - Track.cy) / Track.mry, (bot.x - Track.cx) / Track.mrx);
    const target = Track.mid(t + 0.32, bot.lane);
    const desired = Math.atan2(target.y - bot.y, target.x - bot.x);
    const diff = Geo.angleDiff(desired, bot.heading);

    const out = {
      throttle: Math.abs(diff) > 1.0 ? 0.4 : 1,
      brake: false,
      steer: Geo.clamp(diff * 2.2, -1, 1),
      boost: false,
      shootAngle: null
    };

    // Boost management
    if (!bot.boosting && bot.heat < 40) bot.boosting = true;
    if (bot.boosting && bot.heat > 75) bot.boosting = false;
    out.boost = bot.boosting && Math.abs(diff) < 0.3;

    // Predictive auto-combat
    if (player && !player.dead && bot.ammo > 0) {
      const dist = Math.hypot(player.x - bot.x, player.y - bot.y);
      if (dist < this.RANGE) {
        const t = dist / CONFIG.BULLET_SPEED;
        const px = player.x + player.vx * t;
        const py = player.y + player.vy * t;
        let aim = Math.atan2(py - bot.y, px - bot.x);
        aim += (Math.random() - 0.5) * (1 - bot.skill) * 0.4; // less skilled = less accurate
        if (Math.abs(Geo.angleDiff(aim, bot.heading)) < this.CONE) out.shootAngle = aim;
      }
    }
    return out;
  }
};
