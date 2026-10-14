# Roadmap

## Phase 1: Sound (Web Audio API)

- Engine tone that rises with speed (oscillator pitch tied to `speed / maxSpeed`)
- Boost whoosh, shot, hit and explosion effects generated with oscillators and noise buffers (no audio files needed)
- Overheat warning beep, lap and countdown cues
- Master volume and mute toggle on the HUD

## Phase 2: Procedural tracks

- Generate closed tracks from random control points joined by a spline
- Replace the ellipse `Track.onTrack()` with a distance-to-centerline test
- Track-aware AI: the racing line becomes the spline instead of an ellipse
- Seed value shown on screen so a track can be shared and replayed

## Phase 3: Multiplayer and learned AI

- WebRTC data channels for peer-to-peer multiplayer, with a small signalling server for room codes
- Deterministic fixed-step simulation (already in place) with input exchange and rollback
- TensorFlow.js model trained on recorded laps to drive and aim, as an alternative to the hand-written bots in `js/ai.js`
- Leaderboards and ghost replays
