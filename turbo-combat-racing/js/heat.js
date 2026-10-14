/* Heat management.

   Heat_final = Heat_initial + (Boost_time x Rate) - (Cooling_constant)

   Applied every frame with dt seconds:
     Boost_time = dt while boost is held, otherwise 0
     Rate       = the car's heatRate (heat per second of boosting)
     Cooling    = COOLING * dt
   At MAX the engine overheats: boost is locked and the car is slowed and damaged
   until heat drops back to RESUME. */

const Heat = {
  MAX: 100,
  RESUME: 40,
  COOLING: 12,        // heat removed per second
  OVERHEAT_DAMAGE: 2, // health lost per second while overheated

  step(heatInitial, boosting, dt, rate) {
    const boostTime = boosting ? dt : 0;
    const heatFinal = heatInitial + boostTime * rate - this.COOLING * dt;
    return Geo.clamp(heatFinal, 0, this.MAX);
  }
};
