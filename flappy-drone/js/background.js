// background.js — sky, moon, stars, clouds
// All functions on window.FD namespace, using FD.ctx, FD.W, FD.H, FD.globalTick, etc.

(function () {
  const FD = window.FD;

  // --- Sky gradient + nuke sky brightening ---
  FD.drawSky = function () {
    const ctx = FD.ctx, W = FD.W, H = FD.H;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#050510');
    g.addColorStop(0.5, '#0a0a22');
    g.addColorStop(1, '#101030');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Nuke sky brightening — warm glow across entire sky while active
    if (FD.nukeActive) {
      const elapsed = performance.now() - FD.nukeStart;
      let skyBright = 0;
      if (elapsed < 1000) skyBright = elapsed / 1000;
      else if (elapsed < 7000) skyBright = 1;
      else skyBright = Math.max(0, 1 - (elapsed - 7000) / 4000);
      if (skyBright > 0.01) {
        const skyG = ctx.createLinearGradient(0, H, 0, 0);
        skyG.addColorStop(0, `hsla(15, 90%, 20%, ${skyBright * 0.35})`);
        skyG.addColorStop(0.4, `hsla(20, 80%, 12%, ${skyBright * 0.2})`);
        skyG.addColorStop(1, `hsla(25, 60%, 6%, ${skyBright * 0.08})`);
        ctx.fillStyle = skyG;
        ctx.fillRect(0, 0, W, H);
      }
    }
  };

  // --- Crescent moon with glow, surface detail, and light scatter ---
  FD.drawMoon = function () {
    const ctx = FD.ctx, W = FD.W;
    const mx = W - 90, my = 75, r = 28;

    // Outer light scatter — very large, extremely faint radial glow
    const scatter = ctx.createRadialGradient(mx, my, r, mx, my, r * 6);
    scatter.addColorStop(0, 'rgba(180, 190, 220, 0.04)');
    scatter.addColorStop(0.4, 'rgba(180, 190, 220, 0.015)');
    scatter.addColorStop(1, 'rgba(180, 190, 220, 0)');
    ctx.fillStyle = scatter;
    ctx.fillRect(mx - r * 6, my - r * 6, r * 12, r * 12);

    // Warm, more visible halo glow
    const glow = ctx.createRadialGradient(mx, my, r * 0.6, mx, my, r * 3);
    glow.addColorStop(0, 'rgba(220, 215, 200, 0.14)');
    glow.addColorStop(0.4, 'rgba(210, 210, 230, 0.06)');
    glow.addColorStop(1, 'rgba(200, 210, 240, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(mx - r * 3, my - r * 3, r * 6, r * 6);

    // Moon body + crescent + craters drawn into an off-screen pattern via save/restore
    ctx.save();

    // Main moon disc
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, Math.PI * 2);
    ctx.fillStyle = '#c8cde8';
    ctx.globalAlpha = 0.9;
    ctx.fill();

    // Surface craters — subtle darker spots on the visible crescent portion
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#8088a8';
    // Crater 1 — upper left area of visible part
    ctx.beginPath();
    ctx.ellipse(mx - 10, my - 8, 5, 4, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Crater 2 — middle left
    ctx.globalAlpha = 0.09;
    ctx.beginPath();
    ctx.ellipse(mx - 6, my + 5, 4, 3, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Crater 3 — lower, smaller
    ctx.globalAlpha = 0.1;
    ctx.beginPath();
    ctx.ellipse(mx - 14, my + 2, 3, 2.5, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Crescent cutout
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(mx + 14, my - 6, r * 0.88, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  // --- Subtle night clouds (wisps) ---
  FD.drawClouds = function () {
    const ctx = FD.ctx, W = FD.W;
    const clouds = FD.clouds;
    if (!clouds) return;

    clouds.forEach(function (c) {
      c.x -= c.speed;
      if (c.x + c.w < -c.w) c.x = W + c.w;

      var cx = c.x + c.w / 2;
      var cy = c.y;
      var hw = c.w / 2;
      var hh = c.w * 0.07; // very flat wisps

      // Single soft wisp — barely visible
      ctx.globalAlpha = c.opacity;
      ctx.fillStyle = '#b0b8d0';
      ctx.beginPath();
      ctx.ellipse(cx, cy, hw, hh, 0, 0, Math.PI * 2);
      ctx.fill();

      // Faint secondary puff
      ctx.globalAlpha = c.opacity * 0.5;
      ctx.beginPath();
      ctx.ellipse(cx + hw * 0.3, cy - hh * 0.3, hw * 0.5, hh * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Nuke underside glow — warm orange on cloud bottoms
      if (FD.nukeActive) {
        var ne = performance.now() - FD.nukeStart;
        var brightness = 0;
        if (ne < 1000) brightness = ne / 1000;
        else if (ne < 4000) brightness = 1;
        else brightness = Math.max(0, 1 - (ne - 4000) / 4000);
        if (brightness > 0.01) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = 'rgba(255, 180, 80, ' + (brightness * 0.08) + ')';
          ctx.beginPath();
          ctx.ellipse(cx, cy + hh * 0.5, hw * 1.1, hh * 1.2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
    });
  };

  // --- 55 twinkling stars ---
  FD.drawStars = function () {
    const ctx = FD.ctx;
    FD.bgStars.forEach(function (s) {
      const a = (Math.sin(s.phase + FD.globalTick * 0.012) + 1) / 2 * 0.55 + 0.15;
      ctx.globalAlpha = a;
      ctx.fillStyle = '#b0b8d0';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };
})();
