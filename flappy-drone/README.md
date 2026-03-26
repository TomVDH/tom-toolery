# Flappy Drone

A Flappy Bird-inspired browser game featuring a pixel drone navigating through a neon cityscape of skyscrapers.

## How to Play

1. Open `index.html` in any modern browser
2. Click, tap, or press **Space** to fly
3. Navigate the drone through gaps between skyscrapers
4. Each gap cleared scores a point
5. Don't crash into buildings or the ground

## Features

- Pixel-art drone with animated propellers and blinking status LED
- Procedurally generated skyscrapers with lit/unlit windows
- Night cityscape background with parallax scrolling and twinkling stars
- Thrust and explosion particle effects
- Screen shake on crash
- Score tracking with personal best
- Responsive touch and keyboard controls

## Tech Stack

- Single self-contained HTML file -- no dependencies, no build step
- Vanilla JavaScript with Canvas 2D rendering
- CSS overlay UI with transitions

## Running Locally

Just open the file:

```
open flappy-drone/index.html
```

Or serve it:

```
npx serve flappy-drone
```
