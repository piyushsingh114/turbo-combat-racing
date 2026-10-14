# 🏎️ Turbo Combat Racing

A neon arcade combat racing game that runs in your browser. Built with HTML5 Canvas and plain JavaScript, with no libraries and no build step.

![Turbo Combat Racing cover](assets/cover.png)

**▶ Live demo:** https://piyushsingh114.github.io/turbo-combat-racing/

## About

Three systems feed each other:

- **Speed:** boost to pull ahead of the rivals.
- **Combat:** shoot rivals and dodge their predictive fire.
- **Resource management:** boosting builds engine heat. Overheat and you slow down and take damage.

## Features

- 3 selectable cars: F40, Aventador and 911 GT3, each with its own power, handling, armor and heat rate
- 3-lap race against 3 AI rivals
- Predictive enemy aiming and automatic combat
- Heat system with overheating, plus ammo, repair and coolant pickups
- 60 FPS fixed-step game loop with circle and AABB collision detection
- Neon-glow HUD (lap, speed, health, heat, ammo)
- Landing page, car selection and result screens

## How to play

Open `index.html` in any modern browser, or run a local server:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000.

| Key | Action |
| --- | --- |
| W / Up | Accelerate |
| S / Down | Brake / reverse |
| A, D / Left, Right | Steer |
| Shift | Boost (builds heat) |
| Space | Shoot |

Pickups: **A** ammo, **+** repair, **C** coolant.

## Heat model

```
Heat_final = Heat_initial + (Boost_time x Rate) - (Cooling_constant)
```

At 100 heat the engine overheats: boost locks and you take damage until heat drops to 40.

## Project structure

```
turbo-combat-racing/
├── index.html
├── css/style.css
├── js/
│   ├── cars.js        car stats and config
│   ├── collision.js   track, circle and AABB collision
│   ├── heat.js        heat formula
│   ├── ai.js          rival driving and predictive aiming
│   ├── game.js        game loop, update(), render()
│   └── ui.js          menus and navigation
├── assets/            cover art
└── docs/              design PDF, roadmap, deployment
```

## Deployment

Static site. Works on GitHub Pages, Netlify and itch.io. See [docs/deployment.md](docs/deployment.md).

## Roadmap

1. **Phase 1:** Web Audio API sound (engine, boost, weapons)
2. **Phase 2:** Procedural track generation
3. **Phase 3:** WebRTC multiplayer and a TensorFlow.js trained AI

Full details are in [docs/roadmap.md](docs/roadmap.md).

## Author

Made by [Piyush Singh](https://github.com/piyushsingh114).
