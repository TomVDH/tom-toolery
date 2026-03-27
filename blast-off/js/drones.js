// drones.js — Blast Off drone renderers with powerwash nozzle attachment
// Starts with 5 drones (subset of Flappy Drone's 15). Each gets a water nozzle.

(function () {
  const BO = window.BO || (window.BO = {});

  // --- Powerwash nozzle attachment (drawn after drone body) ---
  // nozzleDir: {x, y} normalized direction the jet is pointing
  function drawNozzle(ctx, nozzleDir, firing) {
    // Nozzle mount under drone
    ctx.fillStyle = '#555570';
    ctx.fillRect(-2, 6, 4, 5);

    // Nozzle tip — rotates toward aim direction
    var angle = Math.atan2(nozzleDir.y, nozzleDir.x);
    ctx.save();
    ctx.translate(0, 9);
    ctx.rotate(angle - Math.PI / 2); // -PI/2 because nozzle default points down

    // Nozzle barrel
    ctx.fillStyle = '#3a3a50';
    ctx.fillRect(-2, 0, 4, 8);
    ctx.fillStyle = '#4a4a60';
    ctx.fillRect(-1, 0, 2, 8);

    // Nozzle tip ring
    ctx.fillStyle = firing ? '#00ccff' : '#666680';
    ctx.fillRect(-3, 7, 6, 2);

    // Firing glow
    if (firing) {
      ctx.globalAlpha = 0.3 + Math.sin(BO.globalTick * 0.3) * 0.1;
      var glow = ctx.createRadialGradient(0, 10, 0, 0, 10, 12);
      glow.addColorStop(0, 'rgba(0, 200, 255, 0.4)');
      glow.addColorStop(1, 'rgba(0, 200, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(0, 10, 12, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  // --- Pixel Quad (default) ---
  BO.drawDroneQuad = function (propPhase) {
    const ctx = BO.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-10, 13, 20, 3);
    ctx.fillStyle = '#3a3a4a'; ctx.fillRect(-14, -3, 28, 7);
    ctx.fillStyle = '#4a4a5a'; ctx.fillRect(-12, -2, 24, 5);
    ctx.fillStyle = '#00c8f0'; ctx.fillRect(-4, -5, 8, 11);
    ctx.fillStyle = '#009abb'; ctx.fillRect(-3, -4, 6, 9);
    ctx.fillStyle = BO.globalTick % 40 < 20 ? '#ff2255' : '#551122'; ctx.fillRect(-1, -7, 2, 2);
    ctx.fillStyle = '#505060'; ctx.fillRect(-18, -1, 7, 3); ctx.fillRect(11, -1, 7, 3);
    const spin = Math.abs(Math.sin(propPhase));
    const propW = spin * 12;
    ctx.globalAlpha = 0.7; ctx.fillStyle = '#bbc';
    ctx.fillRect(-14.5 - propW / 2, -4, propW, 2);
    ctx.fillRect(14.5 - propW / 2, -4, propW, 2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#555565';
    ctx.fillRect(-10, 5, 2, 4); ctx.fillRect(8, 5, 2, 4);
    ctx.fillRect(-12, 8, 8, 2); ctx.fillRect(4, 8, 8, 2);
  };

  // --- Stealth drone ---
  BO.drawDroneStealth = function (propPhase) {
    const ctx = BO.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(-12, 11, 24, 2);
    ctx.fillStyle = '#2a2a35';
    ctx.beginPath();
    ctx.moveTo(-16, 0); ctx.lineTo(-8, -4); ctx.lineTo(8, -4);
    ctx.lineTo(16, 0); ctx.lineTo(8, 3); ctx.lineTo(-8, 3);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#35354a';
    ctx.beginPath();
    ctx.moveTo(-7, -3); ctx.lineTo(7, -3); ctx.lineTo(12, 0); ctx.lineTo(-12, 0);
    ctx.closePath(); ctx.fill();
    const glow = 0.6 + Math.sin(BO.globalTick * 0.08) * 0.3;
    ctx.fillStyle = 'rgba(0, 255, 120, ' + glow + ')'; ctx.fillRect(-2, -2, 4, 2);
    ctx.fillStyle = '#222230'; ctx.fillRect(-20, -2, 6, 4); ctx.fillRect(14, -2, 6, 4);
    const spin = Math.abs(Math.sin(propPhase));
    const propW = spin * 10;
    ctx.globalAlpha = 0.6; ctx.fillStyle = '#aac';
    ctx.fillRect(-17 - propW / 2, -3, propW, 1);
    ctx.fillRect(17 - propW / 2, -3, propW, 1);
    ctx.globalAlpha = 1;
  };

  // --- Heavy Lift drone ---
  BO.drawDroneHeavy = function (propPhase) {
    const ctx = BO.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(-14, 14, 28, 3);
    ctx.fillStyle = '#3d3530'; ctx.fillRect(-10, -4, 20, 10);
    ctx.fillStyle = '#4a4238'; ctx.fillRect(-9, -3, 18, 8);
    ctx.fillStyle = '#cc8800'; ctx.fillRect(-9, 2, 18, 2);
    ctx.fillStyle = '#3d3530';
    for (let i = 0; i < 6; i++) ctx.fillRect(-9 + i * 6, 2, 3, 2);
    ctx.fillStyle = '#335577'; ctx.fillRect(-3, -3, 6, 4);
    ctx.fillStyle = '#4477aa'; ctx.fillRect(-2, -2, 4, 2);
    ctx.fillStyle = '#332e28'; ctx.fillRect(-20, -2, 12, 4); ctx.fillRect(8, -2, 12, 4);
    ctx.fillStyle = '#444038'; ctx.fillRect(-22, -5, 5, 10); ctx.fillRect(17, -5, 5, 10);
    const spin = Math.abs(Math.sin(propPhase));
    const propW = spin * 14;
    ctx.globalAlpha = 0.65; ctx.fillStyle = '#bbaa88';
    ctx.fillRect(-19.5 - propW / 2, -6, propW, 2);
    ctx.fillRect(19.5 - propW / 2, -6, propW, 2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#555045';
    ctx.fillRect(-12, 6, 3, 6); ctx.fillRect(9, 6, 3, 6);
    ctx.fillRect(-14, 11, 7, 2); ctx.fillRect(7, 11, 7, 2);
    ctx.fillStyle = BO.globalTick % 30 < 15 ? '#ff8800' : '#553300';
    ctx.fillRect(-9, -4, 2, 1); ctx.fillRect(7, -4, 2, 1);
  };

  // --- FPV Racer ---
  BO.drawDroneRacer = function (propPhase) {
    const ctx = BO.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(-10, 10, 20, 2);
    ctx.fillStyle = '#1a1a2a'; ctx.fillRect(-8, -2, 16, 6);
    ctx.fillStyle = '#252535'; ctx.fillRect(-7, -2, 14, 2);
    ctx.fillStyle = '#ff0066'; ctx.fillRect(-7, 0, 14, 1);
    ctx.fillStyle = '#333'; ctx.fillRect(5, -4, 4, 3);
    ctx.fillStyle = 'rgba(255, 0, 80, ' + (0.4 + Math.sin(BO.globalTick * 0.1) * 0.2) + ')';
    ctx.fillRect(6, -3, 2, 1);
    ctx.fillStyle = '#222233'; ctx.fillRect(-20, -1, 11, 2); ctx.fillRect(9, -1, 11, 2);
    ctx.fillStyle = '#2a2a3a'; ctx.fillRect(-20, -3, 4, 6); ctx.fillRect(16, -3, 4, 6);
    ctx.fillStyle = '#ff0066'; ctx.fillRect(-20, -3, 4, 1); ctx.fillRect(16, -3, 4, 1);
    const spin = Math.abs(Math.sin(propPhase));
    const propW = spin * 12;
    ctx.globalAlpha = 0.65; ctx.fillStyle = '#ccd';
    ctx.fillRect(-18 - propW / 2, -4, propW, 1);
    ctx.fillRect(18 - propW / 2, -4, propW, 1);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ff0066'; ctx.fillRect(-3, 4, 6, 2);
  };

  // --- Osprey ---
  BO.drawDroneOsprey = function (propPhase) {
    const ctx = BO.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(-12, 10, 24, 2);
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(-10, -2, 20, 5);
    ctx.fillStyle = '#4a4a54'; ctx.fillRect(-8, -1, 16, 3);
    ctx.fillStyle = '#2e2e38'; ctx.fillRect(-14, -3, 5, 6); ctx.fillRect(9, -3, 5, 6);
    const spin = Math.abs(Math.sin(propPhase));
    const propW = spin * 16;
    ctx.globalAlpha = 0.65; ctx.fillStyle = '#bbc';
    ctx.fillRect(-11.5 - propW / 2, -4, propW, 2);
    ctx.fillRect(11.5 - propW / 2, -4, propW, 2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#446688'; ctx.fillRect(6, -1, 3, 2);
    ctx.fillStyle = '#444'; ctx.fillRect(0, -5, 1, 3);
    ctx.fillStyle = BO.globalTick % 40 < 20 ? '#ff2255' : '#551122'; ctx.fillRect(0, -5, 1, 1);
    ctx.fillStyle = '#555565';
    ctx.fillRect(-9, 3, 1, 4); ctx.fillRect(8, 3, 1, 4);
    ctx.fillRect(-11, 6, 6, 1); ctx.fillRect(5, 6, 6, 1);
  };

  // --- Drone dispatcher ---
  BO.drawDrone = function (x, y, angle, propPhase, droneType, nozzleDir, firing) {
    const ctx = BO.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    var droneScale = {
      quad: 1.15, stealth: 1.15, heavy: 1.0, racer: 1.2, osprey: 1.15
    };
    var s = droneScale[droneType] || 1.15;
    ctx.scale(s, s);

    if (droneType === 'quad') BO.drawDroneQuad(propPhase);
    else if (droneType === 'stealth') BO.drawDroneStealth(propPhase);
    else if (droneType === 'heavy') BO.drawDroneHeavy(propPhase);
    else if (droneType === 'racer') BO.drawDroneRacer(propPhase);
    else if (droneType === 'osprey') BO.drawDroneOsprey(propPhase);
    else BO.drawDroneQuad(propPhase);

    // Powerwash nozzle — always visible on every drone
    if (nozzleDir) {
      drawNozzle(ctx, nozzleDir, firing);
    } else {
      // Default: nozzle pointing down
      drawNozzle(ctx, { x: 0, y: 1 }, false);
    }

    ctx.restore();
  };
})();
