/* Global tuning values and the three selectable cars.
   hp / topKmh are the real-world style numbers shown on the selection screen.
   maxSpeed / accel / handling / health / heatRate are the in-game values. */

const CONFIG = {
  LAPS: 3,
  BULLET_SPEED: 520,   // px per second
  BULLET_DAMAGE: 8
};

const CARS = [
  {
    id: 'f40',
    name: 'F40',
    tagline: 'Raw twin-turbo power',
    hp: 471, topKmh: 324,
    color: '#ff2b2b',
    maxSpeed: 230, accel: 120, handling: 3.2, health: 100, heatRate: 22
  },
  {
    id: 'aventador',
    name: 'Aventador',
    tagline: 'Fastest, runs hot',
    hp: 700, topKmh: 350,
    color: '#ffb400',
    maxSpeed: 250, accel: 150, handling: 2.9, health: 90, heatRate: 30
  },
  {
    id: 'gt3',
    name: '911 GT3',
    tagline: 'Precise and cool-running',
    hp: 502, topKmh: 318,
    color: '#00f0ff',
    maxSpeed: 225, accel: 130, handling: 3.8, health: 110, heatRate: 18
  }
];
