// effects.js — Blast Off particles, water jet, explosions, fireworks, vignette

(function () {
  const BO = window.BO || (window.BO = {});

  // --- Water jet particles (the core mechanic) ---
  BO.spawnWaterJet = function (droneX, droneY, dirX, dirY) {
    // 4-6 water droplets per frame along jet direction
    var count = 4 + Math.floor(Math.random() * 3);
    for (var i = 0; i < count; i++) {
      var speed = 8 + Math.random() * 4;
      // Spread: ±5 degrees
      var spreadAngle = (Math.random() - 0.5) * 0.18;
      var cos = Math.cos(spreadAngle), sin = Math.sin(spreadAngle);
      var vx = (dirX * cos - dirY * sin) * speed;
      var vy = (dirX * sin + dirY * cos) * speed;

      BO.particles.push({
        x: droneX + dirX * 14 + (Math.random() - 0.5) * 4,
        y: droneY + dirY * 14 + 9 + (Math.random() - 0.5) * 4,
        vx: vx,
        vy: vy,
        life: 18 + Math.random() * 12,
        maxLife: 30,
        r: 1.5 + Math.random() * 1.5,
        hue: 195 + Math.random() * 15,
        sat: 80,
        lum: 60 + Math.random() * 20,
        damping: 0.96,
        gravity: 0.03,
        water: true,  // tag for collision detection
        streak: true
      });
    }

    // Nozzle glow
    BO.particles.push({
      x: droneX + dirX * 14,
      y: droneY + dirY * 14 + 9,
      vx: dirX * 2, vy: dirY * 2,
      life: 4, maxLife: 4,
      r: 10,
      hue: 195, sat: 90, lum: 80,
      glow: true
    });
  };

  // --- Splash particles (when water hits something) ---
  BO.spawnSplash = function (x, y) {
    for (var i = 0; i < 6; i++) {
      var a = Math.random() * Math.PI * 2;
      var spd = 1.5 + Math.random() * 2;
      BO.particles.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 4,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 1,
        life: 8 + Math.random() * 6,
        maxLife: 14,
        r: 1 + Math.random() * 1.5,
        hue: 190 + Math.random() * 20,
        sat: 70,
        lum: 75 + Math.random() * 15,
        damping: 0.95,
        gravity: 0.05
      });
    }
    // Bright splash flash
    BO.particles.push({
      x: x, y: y,
      vx: 0, vy: 0,
      life: 5, maxLife: 5,
      r: 8,
      hue: 200, sat: 60, lum: 90,
      glow: true
    });
  };

  // --- Clean shimmer (sparkle when grime is removed) ---
  BO.spawnCleanShimmer = function (x, y) {
    for (var i = 0; i < 3; i++) {
      BO.particles.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 0.8,
        life: 15 + Math.random() * 10,
        maxLife: 25,
        r: 2 + Math.random() * 2,
        hue: 50 + Math.random() * 20,
        sat: 100,
        lum: 85,
        glow: true,
        gravity: -0.01 // float up
      });
    }
  };

  // --- Explosion ---
  BO.spawnExplosion = function (x, y) {
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 7 + Math.random() * 3;
      BO.particles.push({
        x: x + (Math.random() - 0.5) * 4, y: y + (Math.random() - 0.5) * 4,
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
        life: 18 + Math.random() * 12, maxLife: 30,
        r: 1 + Math.random() * 2,
        hue: 15 + Math.random() * 30, sat: 100, lum: 55,
        damping: 0.96, streak: true
      });
    }
    BO.particles.push({
      x, y, vx: 0, vy: 0,
      life: 5, maxLife: 5,
      r: 35, hue: 30, sat: 100, lum: 97, glow: true
    });
  };

  // --- Draw particles ---
  BO.drawParticles = function () {
    const ctx = BO.ctx;
    BO.particles.forEach(function (p) {
      var t = p.life / p.maxLife;
      if (p.glow) {
        var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * t);
        grad.addColorStop(0, 'hsla(' + p.hue + ', ' + p.sat + '%, ' + p.lum + '%, ' + (t * 0.8) + ')');
        grad.addColorStop(0.25, 'hsla(' + p.hue + ', ' + p.sat + '%, ' + (p.lum - 10) + '%, ' + (t * 0.4) + ')');
        grad.addColorStop(0.6, 'hsla(' + p.hue + ', ' + p.sat + '%, ' + (p.lum - 25) + '%, ' + (t * 0.1) + ')');
        grad.addColorStop(1, 'hsla(' + p.hue + ', ' + p.sat + '%, ' + (p.lum - 30) + '%, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * t, 0, Math.PI * 2); ctx.fill();
      } else if (p.streak) {
        ctx.globalAlpha = t * 0.7;
        ctx.strokeStyle = 'hsl(' + p.hue + ', ' + (p.sat || 100) + '%, ' + ((p.lum || 55) + (1 - t) * 20) + '%)';
        ctx.lineWidth = p.r * t * 0.8;
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * 3, p.y - p.vy * 3);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.fillStyle = 'hsl(' + p.hue + ', ' + (p.sat || 100) + '%, ' + ((p.lum || 55) + (1 - t) * 25) + '%)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * t * 0.6, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.globalAlpha = t * 0.75;
        ctx.fillStyle = 'hsl(' + p.hue + ', ' + (p.sat || 90) + '%, ' + ((p.lum || 55) + (1 - t) * 20) + '%)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * t, 0, Math.PI * 2); ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
  };

  // --- Update particles ---
  BO.updateParticles = function () {
    BO.particles.forEach(function (p) {
      p.x += p.vx; p.y += p.vy;
      p.vx *= (p.damping || 0.98);
      p.vy *= (p.damping || 0.98);
      p.vy += (p.gravity || 0.02);
      p.life--;
    });
    BO.particles = BO.particles.filter(function (p) { return p.life > 0; });
  };

  // --- Fireworks ---
  BO.updateFireworks = function () {
    BO.fireworks.forEach(function (fw) {
      if (!fw.exploded) {
        fw.y += fw.vy;
        fw.trail.push({ x: fw.x + (Math.random() - 0.5) * 2, y: fw.y });
        if (fw.trail.length > 12) fw.trail.shift();
        if (fw.y <= fw.targetY) {
          fw.exploded = true;
          var burstHues = [fw.hue, (fw.hue + 30) % 360, (fw.hue + 60) % 360];
          var count = 24;
          for (var i = 0; i < count; i++) {
            var a = (Math.PI * 2 / count) * i + Math.random() * 0.35;
            var spd = Math.random() * 2.5 + 1;
            BO.particles.push({
              x: fw.x, y: fw.y,
              vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 0.3,
              life: 35 + Math.random() * 30, maxLife: 65,
              r: Math.random() * 2 + 1,
              hue: burstHues[i % burstHues.length], sat: 100, lum: 55,
              damping: 0.97, gravity: 0.04, streak: true
            });
          }
          BO.particles.push({
            x: fw.x, y: fw.y, vx: 0, vy: 0,
            life: 10, maxLife: 10, r: 40,
            hue: fw.hue, sat: 80, lum: 85, glow: true
          });
        }
      }
    });
    BO.fireworks = BO.fireworks.filter(function (fw) { return !fw.exploded; });
  };

  BO.drawFireworks = function () {
    const ctx = BO.ctx;
    BO.fireworks.forEach(function (fw) {
      if (fw.exploded) return;
      fw.trail.forEach(function (pt, i) {
        ctx.globalAlpha = (i / fw.trail.length) * 0.6;
        ctx.fillStyle = 'hsl(' + fw.hue + ', 80%, 70%)';
        ctx.fillRect(pt.x, pt.y, 2, 2);
      });
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'hsl(' + fw.hue + ', 90%, 85%)';
      ctx.fillRect(fw.x - 1, fw.y - 1, 3, 3);
      ctx.globalAlpha = 1;
    });
  };

  // --- Vignette ---
  BO.drawVignette = function () {
    const ctx = BO.ctx;
    const W = BO.W, H = BO.H;
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };
})();
