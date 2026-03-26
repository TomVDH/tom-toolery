# Flappy Drone -- Product Requirements Document

## Overview

Flappy Drone is a casual browser game built as a single HTML file. It reimagines the classic Flappy Bird mechanic with a pixel drone flying through a nighttime cityscape of skyscrapers.

## Purpose

A fun, shareable mini-game for ZenaTech -- suitable for internal team entertainment, event demos, or embedding on landing pages. Zero dependencies means it works anywhere a browser exists.

## Target Audience

- Internal team members
- Event attendees at ZenaTech demos
- Anyone with a browser and a few minutes to kill

## Gameplay Specifications

| Parameter        | Value   |
|------------------|---------|
| Canvas size      | 620x640 |
| Gravity          | 0.22    |
| Flap force       | -5.2    |
| Pipe speed       | 1.6 px/frame |
| Pipe interval    | 160 frames |
| Gap size         | 170 px  |
| Pipe width       | 56 px   |
| Terminal velocity| 8 px/frame |

## Controls

| Input           | Action |
|-----------------|--------|
| Space / Arrow Up| Flap   |
| Click / Tap     | Flap   |

## Visual Design

- **Theme**: Neon noir cityscape at night
- **Drone**: Pixel-art quadcopter with animated propellers, blinking red LED, landing skids
- **Obstacles**: Skyscrapers with procedural window lighting (warm yellow tones)
- **Background**: Gradient sky, twinkling stars, parallax distant city silhouette
- **Effects**: Thrust particles (cyan), explosion particles (multi-color), screen shake on death
- **UI**: Clean HTML overlays with fade transitions, monospace "-- ZENATECH --" tagline

## Screens

1. **Menu**: ZenaTech tagline, game title, idle floating drone, "Tap or press Space" prompt
2. **Gameplay**: Score HUD (top center), scrolling skyscrapers, active drone
3. **Death**: Dimmed overlay, final score, best score, "Tap to retry" prompt (500ms delay before input accepted)

## Technical Requirements

- Single `index.html` file, no external dependencies
- Runs in all modern browsers (Chrome, Firefox, Safari, Edge)
- Touch-friendly for mobile play
- 60fps target via `requestAnimationFrame`
- No cookies, no analytics, no network requests

## Future Considerations

- Difficulty ramping (speed increases over time)
- Sound effects and background music
- Leaderboard (local storage or server-backed)
- Power-ups (shield, slow-mo)
- Themed skins for the drone
