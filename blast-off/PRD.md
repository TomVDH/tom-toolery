# Blast Off — Powerwash Drone: Product Requirements Document

## Overview

Spinoff #1 from the Flappy Drone game. The company's drones include powerwashing capability — this game turns that into a side-scrolling arcade game where the water jet is both your weapon (cleaning buildings) AND your movement system (recoil thrust).

## Core Concept

**The jet IS your thrust.** There is no flap button. You aim a water jet with your mouse/finger and hold to fire. The recoil pushes the drone in the opposite direction (Newton's third law). Spray down = fly up. Spray left = drift right.

This creates a natural tension:
- Cleaning buildings (aiming sideways/up) destabilizes flight
- Staying aloft (aiming down) doesn't earn points
- Expert players chain spray patterns that clean AND navigate simultaneously

## Game Mechanics

### Controls
- **Mouse/touch aim**: Jet fires toward cursor position
- **Hold click/touch**: Fires the water jet
- **Release**: Jet stops, drone coasts and falls
- **Space**: Start game / retry after death

### Physics
- Gravity pulls drone down constantly (0.15 per frame)
- Jet recoil pushes drone opposite to aim direction (0.32 per frame)
- Air damping slows drone (0.985 multiplier)
- Terminal velocity capped at 6 px/frame
- Drone can move in any direction via recoil

### Scoring
- +1 per grime patch cleaned
- +10 bonus for fully cleaning a building ("SPOTLESS")
- Combo multiplier for consecutive rapid cleaning
- Best score persisted per session

### Difficulty Progression
| Score Range | Scroll Speed | Gap Between Buildings | Grime Density |
|-------------|-------------|----------------------|---------------|
| 0-20        | 1.5         | 240px                | 65%           |
| 20-40       | 2.0         | 200px                | 72%           |
| 40-60       | 2.5         | 175px                | 77%           |
| 60-80       | 3.0         | 160px                | 80%           |

### Death
- Crash into building, ground, or ceiling = death
- Dark Souls-style "YOU DIED" text with red flash
- Score screen with stats (patches cleaned, spotless buildings, best combo)

## Visual Design

### Aesthetic
Cyberpunk noir at night — identical to Flappy Drone. Dark blue sky, neon signs, lit windows, parallax city skyline.

### Buildings
- Wide buildings (90-160px) scroll from right to left
- Buildings have procedural windows, neon signs, ledge details
- Grime patches (brown-green overlays, 18x18px cells) cover building facades
- Cleaned areas show original building surface with sparkle effects

### Water Jet
- Cyan/blue streak particles from drone nozzle toward aim point
- Nozzle rotates to track aim direction
- Splash particles on surface impact
- Shimmer/sparkle when grime is removed

### Drones
5 drone types ported from Flappy Drone, each with a powerwash nozzle attachment:
- Pixel Quad (default)
- Shadow Blade (stealth)
- Iron Mule (heavy lift)
- Pink Streak (racer)
- Sky Osprey (tiltrotor)

## Technical Specs

- Canvas: 620x640px
- Engine: Vanilla JS + Canvas 2D API, zero dependencies
- Fixed 60fps timestep (refresh-rate independent)
- Static file deployment (no build step)
- Architecture mirrors Flappy Drone: modular JS files attached to global namespace

## Current Status (v0.1 — Proof of Concept)

### Working
- [x] Menu screen with drone picker and slogans
- [x] Cyberpunk city background (sky, moon, stars, clouds, parallax far-city)
- [x] Drone rendering with powerwash nozzle attachment
- [x] Water jet particle system with recoil physics
- [x] Side-scrolling with buildings
- [x] Building collision detection (crash = death)
- [x] Ground/ceiling collision
- [x] Death sequence ("YOU DIED" + score screen)
- [x] Ready countdown (Ready? Set. SPRAY!)
- [x] Crosshair aim indicator
- [x] Combo counter in HUD
- [x] Firework celebrations at milestones
- [x] Menu → fade → ready → play → die → score → retry loop

### Needs Work
- [ ] **Grime visibility** — grime overlay renders but is too subtle / not clearly visible
- [ ] **Grime cleaning** — water particle → grime collision code exists but needs tuning
- [ ] **Score feedback** — cleaning should feel satisfying (bigger splashes, screen effects)
- [ ] **Building variety** — top-attached buildings (stalactite style) for more interesting layouts
- [ ] **Difficulty tuning** — gap sizes, scroll speed, gravity balance
- [ ] **Sound effects** — jet spray, splash, clean shimmer, crash
- [ ] **Mobile optimization** — touch controls work but need UX polish
- [ ] **Analytics webhook** — hook up to same pipeline as Flappy Drone

## File Structure

```
blast-off/
├── index.html          # Entry point
├── PRD.md              # This file
├── README.md           # Quick start guide
├── css/
│   └── game.css        # Styling
└── js/
    ├── config.js       # BO namespace, constants, shared state
    ├── background.js   # Sky, stars, moon, clouds, far city parallax
    ├── buildings.js    # Building renderer + grime system
    ├── drones.js       # 5 drone renderers with powerwash nozzle
    ├── effects.js      # Water particles, splash, shimmer, explosions, fireworks
    ├── ui.js           # Menu, death sequence, ready countdown
    └── game.js         # Game loop, jet physics, grime collision, state machine
```

## Relationship to Flappy Drone

Blast Off shares ~70% of its codebase with Flappy Drone:
- **Direct port**: background.js, building renderer, particle system, death sequence, pixel font
- **Adapted**: drone renderers (added nozzle), effects (added water particles), game loop (jet physics replaces flap)
- **New**: grime system, aim/crosshair, combo scoring, recoil physics
