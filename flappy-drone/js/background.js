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

  // --- Mountain range silhouettes (behind city, very slow parallax) ---
  FD.drawMountains = function (scrollX) {
    var ctx = FD.ctx, W = FD.W, H = FD.H;
    var mounts = FD.mountains;
    if (!mounts) return;

    // Nuke edge glow on mountain ridgeline
    var nukeRim = 0;
    if (FD.nukeActive) {
      var ne = performance.now() - FD.nukeStart;
      if (ne < 500) nukeRim = ne / 500;
      else if (ne < 4000) nukeRim = 1;
      else if (ne < 7000) nukeRim = 1 - (ne - 4000) / 3000;
    }

    ctx.globalAlpha = 0.25;
    mounts.forEach(function (m) {
      var offset = (scrollX || 0) * m.speedMult;
      var baseY = H * m.baseY;
      var pts = m.points;
      var tileW = W * 1.5;

      // Build ridgeline path
      var ridgePts = [];
      for (var px = -50; px <= W + 50; px += 4) {
        var rawX = (px + offset) / tileW;
        rawX = ((rawX % 1) + 1) % 1;
        var idx = rawX * (pts.length - 1);
        var i0 = Math.floor(idx);
        var frac = idx - i0;
        var i1 = (i0 + 1) % pts.length;
        var h = pts[i0] * (1 - frac) + pts[i1] * frac;
        ridgePts.push({ x: px, y: baseY + h * H });
      }

      // Fill body — barely warmed during nuke
      if (nukeRim > 0.01) {
        var r = 8 + nukeRim * 6, g = 8 + nukeRim * 3, b2 = 14 + nukeRim * 1;
        ctx.fillStyle = 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b2 | 0) + ')';
      } else {
        ctx.fillStyle = m.color;
      }
      ctx.beginPath();
      ctx.moveTo(ridgePts[0].x, ridgePts[0].y);
      for (var j = 1; j < ridgePts.length; j++) ctx.lineTo(ridgePts[j].x, ridgePts[j].y);
      ctx.lineTo(W + 50, H);
      ctx.lineTo(-50, H);
      ctx.closePath();
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };

  // --- Aurora borealis curtains (ambient sky effect) ---
  FD.drawAurora = function () {
    var ctx = FD.ctx, W = FD.W, H = FD.H;
    var curtains = FD.auroraCurtains;
    if (!curtains) return;
    var now = performance.now();

    // Smooth intensity lerp toward target
    FD.auroraIntensity += (FD.auroraTargetIntensity - FD.auroraIntensity) * 0.02;

    // Base ambient + score-driven event boost (nuke does NOT auto-invoke)
    var baseAlpha = 0.12;
    var eventAlpha = FD.auroraIntensity * 0.30;
    var totalAlpha = baseAlpha + eventAlpha;

    if (totalAlpha < 0.01) return;

    var STRIPS = 30;
    var stripW = W / STRIPS + 1;

    curtains.forEach(function (cur) {
      for (var i = 0; i < STRIPS; i++) {
        var x = (i / STRIPS) * W;
        var xn = x / W;

        // Double-wave shape
        var wave = Math.sin(xn * cur.freq * Math.PI * 2 + now * 0.001 * cur.speed + cur.phase) * cur.amplitude;
        var wave2 = Math.sin(xn * cur.freq * 1.7 * Math.PI * 2 + now * 0.0007 * cur.speed + cur.phase + 2) * cur.amplitude * 0.4;
        var y = cur.baseY + wave + wave2;
        var h = cur.thickness * (0.6 + 0.4 * Math.sin(xn * 8 + now * 0.002 + cur.phase));

        // Brightness modulation along curtain
        var bright = 0.5 + 0.5 * Math.sin(xn * 12 + now * 0.003 * cur.speed + cur.phase * 2);

        // Hue shift
        var hueShift = Math.sin(xn * 4 + now * 0.001) * 20;
        var a = totalAlpha * bright * 0.35;

        // Vertical gradient strip (transparent -> peak -> transparent)
        var sg = ctx.createLinearGradient(x, y - h, x, y + h * 2.5);
        sg.addColorStop(0, 'hsla(' + (cur.hue + hueShift) + ',70%,65%,0)');
        sg.addColorStop(0.2, 'hsla(' + (cur.hue + hueShift) + ',75%,55%,' + (a * 0.3) + ')');
        sg.addColorStop(0.4, 'hsla(' + (cur.hue + hueShift) + ',80%,45%,' + a + ')');
        sg.addColorStop(0.6, 'hsla(' + (cur.hue + hueShift + 20) + ',70%,35%,' + (a * 0.7) + ')');
        sg.addColorStop(1, 'hsla(' + (cur.hue + hueShift) + ',60%,20%,0)');

        ctx.fillStyle = sg;
        ctx.fillRect(x, y - h, stripW, h * 3.5);
      }
    });
  };
})();
