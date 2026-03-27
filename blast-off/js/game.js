// game.js — Blast Off: Powerwash Drone game loop
// Core mechanic: water jet recoil IS your movement. No flap button.

(function () {
  'use strict';
  const BO = window.BO;
  const W = BO.W, H = BO.H;

  // --- DOM refs ---
  const canvas       = document.getElementById('game');
  const ctx          = canvas.getContext('2d');
  const hudEl        = document.getElementById('hud');
  const hudComboEl   = document.getElementById('hudCombo');
  const menuScreen   = document.getElementById('menuScreen');
  const scoreScreen  = document.getElementById('scoreScreen');
  const scoreValueEl = document.getElementById('scoreValue');
  const scoreStatsEl = document.getElementById('scoreStats');
  const scoreBestEl  = document.getElementById('scoreBest');

  // --- Local game state ---
  var state = 'menu';
  var deathSkippable = false;
  var score = 0, best = 0;
  var totalCleaned = 0;     // total grime patches cleaned this run
  var buildingsCleaned = 0; // buildings fully cleaned (spotless)
  var drone = { x: 120, y: H / 2, vx: 0, vy: 0, angle: 0, propPhase: 0 };
  var buildings = [];       // active buildings on screen
  var curSpeed = 0;
  var groundScroll = 0;
  var farCityScroll = 0;
  var frame = 0;
  var deathTimer = 0;
  var readyStartTime = 0;
  var readyT = 0;
  var fadeStartTime = 0;
  var buildingIdCounter = 0;
  var nextBuildingX = 0;    // x position where next building spawns

  // --- Mouse/touch aiming ---
  var mouseX = W / 2, mouseY = H / 2;
  var firing = false;
  var jetDirX = 0, jetDirY = 1; // normalized jet direction

  // --- Combo system ---
  var combo = 0;
  var comboTimer = 0;       // frames since last clean — combo breaks if too long
  var comboMax = 0;          // best combo this run
  var COMBO_TIMEOUT = 45;    // frames before combo breaks (~0.75s)

  // --- Drone selection ---
  var activeDroneType = 'quad';
  var droneIndex = 0;
  var droneTypes = ['quad', 'stealth', 'heavy', 'racer', 'osprey'];
  var droneNames = {
    quad: 'PIXEL QUAD', stealth: 'SHADOW BLADE', heavy: 'IRON MULE',
    racer: 'PINK STREAK', osprey: 'SKY OSPREY'
  };

  // --- Neon sign data ---
  var roofTexts = ['WASH CO', 'BLAST', 'CLEAN!', 'ZENATECH', 'PP-1', 'SPARKLE', 'GRIME X', 'JET PRO', 'RINSE', 'APEX'];

  // --- Timing ---
  var FRAME_MS = 1000 / 60;
  var lastFrameTime = performance.now();
  var updateAccum = 0;

  // ---------------------------------------------------------------
  // init
  // ---------------------------------------------------------------
  function init() {
    drone = { x: 120, y: H / 2, vx: 0, vy: 0, angle: 0, propPhase: 0 };
    buildings = [];
    score = 0;
    totalCleaned = 0;
    buildingsCleaned = 0;
    combo = 0;
    comboTimer = 0;
    comboMax = 0;
    frame = 0;
    groundScroll = 0;
    farCityScroll = 0;
    deathTimer = 0;
    deathSkippable = false;
    buildingIdCounter = 0;
    nextBuildingX = W + 50; // first building starts off-screen

    hudEl.textContent = '0';
    hudComboEl.style.display = 'none';

    BO.ctx = ctx;
    BO.canvas = canvas;
    BO.drone = drone;
    BO.activeDroneType = activeDroneType;
    BO.particles = [];
    BO.fireworks = [];
    BO.screenShake = 0;
    BO.deathText = 'YOU DIED';
  }

  // ---------------------------------------------------------------
  // spawnBuilding — create a new building off-screen right
  // ---------------------------------------------------------------
  function spawnBuilding() {
    var id = buildingIdCounter++;
    var seed = ((id * 2654435761) >>> 0);

    // Building dimensions — wider than Flappy Drone pipes
    var minW = BO.BUILDING_MIN_W;
    var maxW = BO.BUILDING_MAX_W;
    // Difficulty: buildings get wider over time
    var diffT = Math.min(1, score / 80);
    var bw = minW + Math.floor((seed % 100) / 100 * (maxW - minW));

    // Height: random, leaving sky for flying
    var minH = 120;
    var maxH = H - BO.GROUND_H - 80;
    var bh = minH + ((seed * 7 + 13) % (maxH - minH));
    var topY = H - BO.GROUND_H - bh;

    var building = {
      x: nextBuildingX,
      w: bw,
      topY: topY,
      height: bh,
      fromTop: false,
      seed: seed,
      id: id,
      grimeDensity: BO.GRIME_DENSITY + diffT * 0.15,
      passed: false // has drone passed this building?
    };

    // Building features
    var hash = ((id * 13 + 7) * 37) % 100;
    if (hash % 10 < 3) building.ledges = true;
    if (hash % 20 < 3) building.antenna = true;
    if (hash < 30) {
      var idx = ((id * 11 + 5) * 23) % roofTexts.length;
      building.signText = roofTexts[idx];
      building.signColor = 'hsl(' + ((id * 137 + 43) % 360) + ', 100%, 65%)';
    }

    // Generate grime
    BO.generateGrime(building);

    buildings.push(building);

    // Gap before next building
    var gapT = Math.min(1, score / 60);
    var gap = BO.GAP_MAX - gapT * (BO.GAP_MAX - BO.GAP_MIN);
    nextBuildingX = building.x + building.w + gap;
  }

  // ---------------------------------------------------------------
  // startGame
  // ---------------------------------------------------------------
  function startGame() {
    if (state === 'menu') {
      BO.hideScreen(menuScreen);
      init();
      trackEvent('game_start', { drone: activeDroneType, game: 'blast-off' });
      state = 'fading';
      fadeStartTime = performance.now();
      setTimeout(function () {
        state = 'ready';
        readyStartTime = performance.now();
        BO.readyStartTime = readyStartTime;
        readyT = 0;
      }, 650);
      return;
    }

    // Skip death
    if (state === 'dying' && deathSkippable) {
      state = 'dead';
      deathTimer = 0;
      deathSkippable = false;
      showScoreScreen();
      return;
    }

    // Retry
    if (state === 'dead' && deathTimer > 30) {
      state = 'menu';
      BO.hideScreen(scoreScreen);
      BO.showScreen(menuScreen);
      hudEl.classList.remove('show');
      init();
    }
  }

  function showScoreScreen() {
    scoreValueEl.textContent = score;
    scoreStatsEl.textContent = totalCleaned + ' patches | ' + buildingsCleaned + ' spotless | x' + comboMax + ' best combo';
    scoreBestEl.textContent = 'Best: ' + best;
    BO.showScreen(scoreScreen);
  }

  // ---------------------------------------------------------------
  // die
  // ---------------------------------------------------------------
  function die() {
    if (state !== 'play') return;
    state = 'dying';
    best = Math.max(best, score);
    deathTimer = 0;
    BO.deathText = 'YOU DIED';
    BO.screenShake = 8;
    BO.spawnExplosion(drone.x, drone.y);
    trackEvent('game_over', { score: score, cleaned: totalCleaned, drone: activeDroneType, game: 'blast-off' });
  }

  // ---------------------------------------------------------------
  // Input
  // ---------------------------------------------------------------
  // Mouse tracking (always, for aim indicator)
  function updateMouse(e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = W / rect.width;
    var scaleY = H / rect.height;
    mouseX = (e.clientX - rect.left) * scaleX;
    mouseY = (e.clientY - rect.top) * scaleY;
  }

  canvas.addEventListener('mousemove', updateMouse);
  canvas.addEventListener('mousedown', function (e) {
    updateMouse(e);
    if (state === 'menu' || state === 'dying' || state === 'dead') {
      startGame();
      return;
    }
    firing = true;
  });
  canvas.addEventListener('mouseup', function () { firing = false; });
  canvas.addEventListener('mouseleave', function () { firing = false; });

  // Touch
  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    if (state === 'menu' || state === 'dying' || state === 'dead') {
      startGame();
      return;
    }
    var touch = e.touches[0];
    var rect = canvas.getBoundingClientRect();
    mouseX = (touch.clientX - rect.left) * (W / rect.width);
    mouseY = (touch.clientY - rect.top) * (H / rect.height);
    firing = true;
  }, { passive: false });
  canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    var touch = e.touches[0];
    var rect = canvas.getBoundingClientRect();
    mouseX = (touch.clientX - rect.left) * (W / rect.width);
    mouseY = (touch.clientY - rect.top) * (H / rect.height);
  }, { passive: false });
  canvas.addEventListener('touchend', function () { firing = false; });

  // Keyboard: Space to start/retry
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space') {
      e.preventDefault();
      if (state === 'menu' || state === 'dying' || state === 'dead') startGame();
    }
  });

  // Drone picker
  function cycleDrone(dir) {
    droneIndex = (droneIndex + dir + droneTypes.length) % droneTypes.length;
    activeDroneType = droneTypes[droneIndex];
    BO.activeDroneType = activeDroneType;
    document.getElementById('droneLabel').textContent = droneNames[activeDroneType] || activeDroneType;
  }

  document.getElementById('droneLeft').addEventListener('click', function (e) { e.stopPropagation(); cycleDrone(-1); });
  document.getElementById('droneRight').addEventListener('click', function (e) { e.stopPropagation(); cycleDrone(1); });
  document.addEventListener('keydown', function (e) {
    if (state !== 'menu') return;
    if (e.code === 'ArrowLeft') cycleDrone(-1);
    if (e.code === 'ArrowRight') cycleDrone(1);
  });

  // ---------------------------------------------------------------
  // update
  // ---------------------------------------------------------------
  function update() {
    // --- dying ---
    if (state === 'dying') {
      deathTimer++;
      if (BO.screenShake > 0.3) BO.screenShake *= 0.82;
      BO.updateParticles();
      if (deathTimer > BO.DEATH_FLASH_DUR + BO.DIED_FADE_IN) deathSkippable = true;
      if (deathTimer > BO.DIED_TOTAL + BO.SCORE_DELAY) {
        state = 'dead';
        deathTimer = 0;
        deathSkippable = false;
        showScoreScreen();
      }
      return;
    }

    // --- dead ---
    if (state === 'dead') {
      deathTimer++;
      BO.updateParticles();
      return;
    }

    // --- ready ---
    if (state === 'ready') {
      readyT = Math.min(1, (performance.now() - readyStartTime) / BO.READY_MS);
      drone.propPhase += 0.5;
      drone.y = H / 2 + Math.sin(BO.globalTick * 0.025) * 8;
      drone.angle = Math.sin(BO.globalTick * 0.018) * 0.03;
      if (readyT >= 1) {
        state = 'play';
        hudEl.classList.add('show');
      }
      return;
    }

    if (state !== 'play') return;

    frame++;

    // --- Jet aim direction ---
    var dx = mouseX - drone.x;
    var dy = mouseY - drone.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 1) {
      jetDirX = dx / dist;
      jetDirY = dy / dist;
    }

    // --- Drone physics ---
    drone.vy += BO.GRAVITY;

    if (firing) {
      // Recoil: push drone opposite to jet direction
      drone.vx -= jetDirX * BO.JET_FORCE;
      drone.vy -= jetDirY * BO.JET_FORCE;

      // Spawn water particles
      BO.spawnWaterJet(drone.x, drone.y, jetDirX, jetDirY);

      // Slight screen shake while firing
      BO.screenShake = Math.max(BO.screenShake, 1.5);
    }

    // Damping
    drone.vx *= BO.DAMPING;
    drone.vy *= BO.DAMPING;

    // Clamp velocity
    var speed = Math.sqrt(drone.vx * drone.vx + drone.vy * drone.vy);
    if (speed > BO.MAX_SPEED) {
      drone.vx = (drone.vx / speed) * BO.MAX_SPEED;
      drone.vy = (drone.vy / speed) * BO.MAX_SPEED;
    }

    // Apply velocity
    drone.x += drone.vx;
    drone.y += drone.vy;

    // Boundaries
    if (drone.y < BO.CEILING_Y) { drone.y = BO.CEILING_Y; drone.vy = Math.max(drone.vy, 0); }
    // Keep drone from going too far left or right
    if (drone.x < 30) { drone.x = 30; drone.vx = Math.max(drone.vx, 0); }
    if (drone.x > W - 30) { drone.x = W - 30; drone.vx = Math.min(drone.vx, 0); }

    // Angle follows velocity
    var targetAngle = Math.max(-0.4, Math.min(0.4, drone.vx * 0.04));
    drone.angle += (targetAngle - drone.angle) * 0.1;
    drone.propPhase += 0.5;

    // --- Difficulty ramp ---
    var diffT = Math.min(1, score / 80);
    curSpeed = BO.SCROLL_SPEED + diffT * 1.5; // 1.5 → 3.0

    // --- Spawn buildings ---
    var rightEdge = 0;
    if (buildings.length > 0) {
      var lastB = buildings[buildings.length - 1];
      rightEdge = lastB.x + lastB.w;
    }
    while (rightEdge < W + 300) {
      spawnBuilding();
      var newest = buildings[buildings.length - 1];
      rightEdge = newest.x + newest.w;
      // Safety: max 6 buildings at once
      if (buildings.length >= 6) break;
    }

    // --- Move buildings ---
    buildings.forEach(function (b) { b.x -= curSpeed; });
    nextBuildingX -= curSpeed;

    // Remove off-screen buildings
    buildings = buildings.filter(function (b) { return b.x + b.w > -20; });

    // --- Water particle → grime collision ---
    BO.particles.forEach(function (p) {
      if (!p.water || p.life <= 0) return;

      buildings.forEach(function (b) {
        if (!b.grimeGrid) return;

        // Check if particle is inside building bounds
        if (p.x >= b.x && p.x <= b.x + b.w &&
            p.y >= b.topY && p.y <= b.topY + b.height) {

          var cellSize = BO.GRIME_CELL;
          var col = Math.floor((p.x - b.x) / cellSize);
          var row = Math.floor((p.y - b.topY) / cellSize);

          if (col >= 0 && col < b.grimeCols && row >= 0 && row < b.grimeRows) {
            if (b.grimeGrid[col][row]) {
              // Clean this cell!
              b.grimeGrid[col][row] = false;
              b.cleanedGrime++;
              score++;
              totalCleaned++;
              hudEl.textContent = score;

              // Combo
              combo++;
              comboTimer = 0;
              comboMax = Math.max(comboMax, combo);

              // Splash + shimmer
              BO.spawnSplash(p.x, p.y);
              BO.spawnCleanShimmer(p.x, p.y);

              // Check spotless
              if (b.cleanedGrime >= b.totalGrime && b.totalGrime > 0) {
                buildingsCleaned++;
                // Bonus: spotless building = 10 extra points
                score += 10;
                hudEl.textContent = score;
                // Celebratory firework
                BO.fireworks.push({
                  x: b.x + b.w / 2,
                  y: b.topY,
                  vy: -(2 + Math.random() * 2),
                  hue: Math.random() * 360,
                  targetY: b.topY - 60 - Math.random() * 80,
                  trail: [], exploded: false
                });
              }
            }

            // Kill particle on impact with building (even if no grime)
            p.life = 0;

            // Splash on clean surface too (smaller)
            if (!b.grimeGrid[col] || !b.grimeGrid[col][row]) {
              BO.spawnSplash(p.x, p.y);
            }
          }
        }
      });
    });

    // --- Combo decay ---
    comboTimer++;
    if (comboTimer > COMBO_TIMEOUT && combo > 0) {
      combo = 0;
    }

    // --- Collision: drone vs buildings ---
    var hb = { x: drone.x - 10, y: drone.y - 4, w: 20, h: 12 };
    for (var j = 0; j < buildings.length; j++) {
      var b = buildings[j];
      if (hb.x + hb.w > b.x && hb.x < b.x + b.w &&
          hb.y + hb.h > b.topY && hb.y < b.topY + b.height) {
        die();
        return;
      }
    }

    // --- Ground collision ---
    if (drone.y > H - BO.GROUND_H - 8) {
      drone.y = H - BO.GROUND_H - 8;
      die();
      return;
    }

    // --- Firework spawning ---
    if (score >= 20) {
      BO.fwTimer--;
      if (BO.fwTimer <= 0) {
        BO.fwTimer = 200 + Math.random() * 250;
        BO.fireworks.push({
          x: 40 + Math.random() * (W - 80),
          y: H - BO.GROUND_H,
          vy: -(2.5 + Math.random() * 2.5),
          hue: Math.random() * 360,
          targetY: 40 + Math.random() * 250,
          trail: [], exploded: false
        });
      }
    }

    // --- Scroll accumulation ---
    groundScroll += curSpeed;
    farCityScroll += curSpeed * 0.05;

    // --- Screen shake decay ---
    if (BO.screenShake > 0.1) BO.screenShake *= 0.9;

    BO.updateParticles();
    BO.updateFireworks();
  }

  // ---------------------------------------------------------------
  // render
  // ---------------------------------------------------------------
  function render() {
    // Screen shake
    var shaking = (state === 'dying' || (state === 'play' && BO.screenShake > 0.3)) && BO.screenShake > 0.3;
    var sx = shaking ? (Math.random() - 0.5) * BO.screenShake : 0;
    var sy = shaking ? (Math.random() - 0.5) * BO.screenShake : 0;

    ctx.save();
    ctx.translate(sx, sy);

    // Background
    BO.drawSky();
    BO.drawMoon();
    BO.drawStars();
    BO.drawClouds();

    // Far city parallax
    var scrollX = (state === 'play' || state === 'dying' || state === 'dead')
      ? farCityScroll % BO.FAR_TILE_W
      : (BO.globalTick * 0.12) % BO.FAR_TILE_W;
    BO.drawFarCity(scrollX);

    // Ground
    var scrollOffset = (state === 'play' || state === 'dying' || state === 'dead')
      ? groundScroll % 24
      : (BO.globalTick * 1.5) % 24;
    BO.drawGround(scrollOffset);

    // Buildings + grime
    buildings.forEach(function (b) {
      BO.drawBuilding(b);
      BO.drawGrime(b);
    });

    // Fireworks, particles
    BO.drawFireworks();
    BO.drawParticles();

    // Drone during play
    if (state === 'play') {
      BO.drawDrone(drone.x, drone.y, drone.angle, drone.propPhase,
        activeDroneType, { x: jetDirX, y: jetDirY }, firing);

      // Aim indicator — subtle line from drone to cursor
      ctx.globalAlpha = firing ? 0.25 : 0.1;
      ctx.strokeStyle = '#00aaff';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(drone.x + jetDirX * 20, drone.y + jetDirY * 20 + 9);
      ctx.lineTo(drone.x + jetDirX * 60, drone.y + jetDirY * 60 + 9);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // Crosshair at mouse position
      ctx.globalAlpha = firing ? 0.4 : 0.15;
      ctx.strokeStyle = '#00aaff';
      ctx.lineWidth = 1;
      var cr = 8;
      ctx.beginPath();
      ctx.moveTo(mouseX - cr, mouseY); ctx.lineTo(mouseX + cr, mouseY);
      ctx.moveTo(mouseX, mouseY - cr); ctx.lineTo(mouseX, mouseY + cr);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(mouseX, mouseY, cr, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;

      // Combo display
      if (combo >= 2) {
        hudComboEl.style.display = 'block';
        hudComboEl.textContent = 'x' + combo;
        hudComboEl.style.opacity = '1';
      } else {
        hudComboEl.style.opacity = '0';
      }
    }

    // Overlays
    BO.drawVignette();
    BO.drawReadySequence(readyT, state);
    BO.drawDeathSequence(state, deathTimer);

    ctx.restore();

    // Menu: large hero drone
    if (state === 'menu') {
      drone.propPhase += 0.5;
      var heroX = W / 2;
      var heroY = 420 + Math.sin(BO.globalTick * 0.02) * 8;
      var heroAngle = -0.2 + Math.sin(BO.globalTick * 0.015) * 0.05;
      ctx.save();
      ctx.translate(heroX, heroY);
      ctx.rotate(heroAngle);
      ctx.scale(2.8, 2.8);
      var heroDrawFn = BO['drawDrone' + activeDroneType.charAt(0).toUpperCase() + activeDroneType.slice(1)];
      if (heroDrawFn) heroDrawFn(drone.propPhase); else BO.drawDroneQuad(drone.propPhase);
      // Draw nozzle on hero too
      ctx.fillStyle = '#555570'; ctx.fillRect(-2, 6, 4, 5);
      ctx.fillStyle = '#3a3a50'; ctx.fillRect(-2, 9, 4, 8);
      ctx.fillStyle = '#4a4a60'; ctx.fillRect(-1, 9, 2, 8);
      ctx.fillStyle = '#666680'; ctx.fillRect(-3, 16, 6, 2);
      ctx.restore();
    }

    // Fading transition
    if (state === 'fading') {
      drone.propPhase += 0.5;
      var fadeElapsed = performance.now() - fadeStartTime;
      var fadeProgress = Math.min(1, fadeElapsed / 600);
      var ep = 1 - Math.pow(1 - fadeProgress, 3);
      var fromX = W / 2, fromY = 420, fromAngle = -0.2, fromScale = 2.8;
      var toX = 120, toY = H / 2, toAngle = 0, toScale = 1.15;
      var cx = fromX + (toX - fromX) * ep;
      var cy = fromY + (toY - fromY) * ep;
      var ca = fromAngle + (toAngle - fromAngle) * ep;
      var cs = fromScale + (toScale - fromScale) * ep;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ca);
      ctx.scale(cs, cs);
      var fadeDrawFn = BO['drawDrone' + activeDroneType.charAt(0).toUpperCase() + activeDroneType.slice(1)];
      if (fadeDrawFn) fadeDrawFn(drone.propPhase); else BO.drawDroneQuad(drone.propPhase);
      // Nozzle on fading drone
      ctx.fillStyle = '#555570'; ctx.fillRect(-2, 6, 4, 5);
      ctx.fillStyle = '#3a3a50'; ctx.fillRect(-2, 9, 4, 8);
      ctx.fillStyle = '#666680'; ctx.fillRect(-3, 16, 6, 2);
      ctx.restore();
    }

    // Fixed timestep
    var now = performance.now();
    updateAccum += now - lastFrameTime;
    lastFrameTime = now;
    if (updateAccum > FRAME_MS * 4) updateAccum = FRAME_MS * 4;
    while (updateAccum >= FRAME_MS) {
      BO.globalTick++;
      BO.updateFireworks();
      update();
      updateAccum -= FRAME_MS;
    }

    requestAnimationFrame(render);
  }

  // ---------------------------------------------------------------
  // Analytics helper
  // ---------------------------------------------------------------
  function trackEvent(name, params) {
    if (typeof window.trackEvent === 'function') window.trackEvent(name, params);
  }

  // ---------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------
  init();
  BO.showScreen(menuScreen);
  render();
})();
