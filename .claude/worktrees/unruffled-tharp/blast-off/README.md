# Blast Off — Powerwash Drone

A side-scrolling arcade game where you control a drone with a powerwash attachment. The water jet's recoil is your ONLY movement system — spray down to fly up, spray sideways to drift. Clean grime off buildings for points while avoiding crashes.

**Status: v0.1 Proof of Concept** — Jet physics and side-scrolling work. Grime cleaning gameplay needs tuning.

## Quick Start

```bash
# Option 1: HTTP server
cd blast-off
npx serve

# Option 2: Direct file
open blast-off/index.html
```

## How to Play

1. **Click** the canvas to start
2. **Hold click + move mouse** to aim the water jet
3. The jet's recoil pushes you in the opposite direction
4. **Clean grime patches** on buildings for points
5. **Don't crash** into buildings or the ground

## Tech Stack

- Vanilla JavaScript (ES6)
- HTML5 Canvas 2D API
- Zero dependencies
- No build step
- Mirrors Flappy Drone architecture (sibling game in this repo)

## Architecture

| File | Purpose |
|------|---------|
| `config.js` | `BO` namespace, constants, shared state |
| `background.js` | Sky, stars, moon, clouds, parallax city |
| `buildings.js` | Building renderer + grime grid system |
| `drones.js` | 5 drone types with powerwash nozzle |
| `effects.js` | Water jet, splash, shimmer, explosions |
| `ui.js` | Menu, death sequence, ready countdown |
| `game.js` | Game loop, jet physics, state machine |

Scripts load in order (config first, game last) and attach to the `window.BO` namespace.

## Known Issues (v0.1)

- Grime overlay too subtle — hard to see what needs cleaning
- Water-to-grime collision detection needs tuning
- No sound effects
- Difficulty curve untested at higher scores
