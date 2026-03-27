// background.js — sky, moon, stars, clouds, far city parallax
// Ported from Flappy Drone → Blast Off (FD → BO namespace)

(function () {
  const BO = window.BO;

  // --- Sky gradient ---
  BO.drawSky = function () {
    const ctx = BO.ctx, W = BO.W, H = BO.H;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#050510');
    g.addColorStop(0.5, '#0a0a22');
    g.addColorStop(1, '#101030');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };

  // --- Crescent moon with glow ---
  BO.drawMoon = function () {
    const ctx = BO.ctx, W = BO.W;
    const mx = W - 90, my = 75, r = 28;

    // Outer scatter
    const scatter = ctx.createRadialGradient(mx, my, r, mx, my, r * 6);
    scatter.addColorStop(0, 'rgba(180, 190, 220, 0.04)');
    scatter.addColorStop(0.4, 'rgba(180, 190, 220, 0.015)');
    scatter.addColorStop(1, 'rgba(180, 190, 220, 0)');
    ctx.fillStyle = scatter;
    ctx.fillRect(mx - r * 6, my - r * 6, r * 12, r * 12);

    // Halo glow
    const glow = ctx.createRadialGradient(mx, my, r * 0.6, mx, my, r * 3);
    glow.addColorStop(0, 'rgba(220, 215, 200, 0.14)');
    glow.addColorStop(0.4, 'rgba(210, 210, 230, 0.06)');
    glow.addColorStop(1, 'rgba(200, 210, 240, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(mx - r * 3, my - r * 3, r * 6, r * 6);

    ctx.save();
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, Math.PI * 2);
    ctx.fillStyle = '#c8cde8';
    ctx.globalAlpha = 0.9;
    ctx.fill();

    // Craters
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#8088a8';
    ctx.beginPath(); ctx.ellipse(mx - 10, my - 8, 5, 4, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.09;
    ctx.beginPath(); ctx.ellipse(mx - 6, my + 5, 4, 3, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.1;
    ctx.beginPath(); ctx.ellipse(mx - 14, my + 2, 3, 2.5, 0.5, 0, Math.PI * 2); ctx.fill();

    // Crescent cutout
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(mx + 14, my - 6, r * 0.88, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  // --- Night clouds ---
  BO.drawClouds = function () {
    const ctx = BO.ctx, W = BO.W;
    const clouds = BO.clouds;
    if (!clouds) return;

    clouds.forEach(function (c) {
      c.x -= c.speed;
      if (c.x + c.w < -c.w) c.x = W + c.w;

      var cx = c.x + c.w / 2;
      var cy = c.y;
      var hw = c.w / 2;
      var hh = c.w * 0.07;

      ctx.globalAlpha = c.opacity;
      ctx.fillStyle = '#b0b8d0';
      ctx.beginPath(); ctx.ellipse(cx, cy, hw, hh, 0, 0, Math.PI * 2); ctx.fill();

      ctx.globalAlpha = c.opacity * 0.5;
      ctx.beginPath(); ctx.ellipse(cx + hw * 0.3, cy - hh * 0.3, hw * 0.5, hh * 0.7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    });
  };

  // --- Twinkling stars ---
  BO.drawStars = function () {
    const ctx = BO.ctx;
    BO.bgStars.forEach(function (s) {
      const a = (Math.sin(s.phase + BO.globalTick * 0.012) + 1) / 2 * 0.55 + 0.15;
      ctx.globalAlpha = a;
      ctx.fillStyle = '#b0b8d0';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  };

  // --- Far city parallax ---
  BO.drawFarCity = function (scrollX) {
    var ctx = BO.ctx, W = BO.W, H = BO.H;
    var GROUND_H = BO.GROUND_H, FAR_TILE_W = BO.FAR_TILE_W;
    var farBuildings = BO.farBuildings;

    var backBuildings = farBuildings.filter(function (b) { return b.layer === 'back'; });
    var frontBuildings = farBuildings.filter(function (b) { return b.layer === 'front' || !b.layer; });

    var backScrollX = (scrollX * 0.6) % FAR_TILE_W;
    ctx.fillStyle = '#080818';
    for (var tileOff = -FAR_TILE_W; tileOff < W + FAR_TILE_W; tileOff += FAR_TILE_W) {
      backBuildings.forEach(function (b) {
        var bx = b.x + tileOff - backScrollX;
        if (bx + b.w > -10 && bx < W + 10) ctx.fillRect(bx, H - GROUND_H - b.h, b.w, b.h);
      });
    }

    ctx.fillStyle = '#0c0c20';
    for (var tileOff2 = -FAR_TILE_W; tileOff2 < W + FAR_TILE_W; tileOff2 += FAR_TILE_W) {
      frontBuildings.forEach(function (b) {
        var bx = b.x + tileOff2 - scrollX;
        if (bx + b.w > -10 && bx < W + 10) ctx.fillRect(bx, H - GROUND_H - b.h, b.w, b.h);
      });
    }
  };

  // --- Ground ---
  BO.drawGround = function (scrollOffset) {
    var ctx = BO.ctx, W = BO.W, H = BO.H, GROUND_H = BO.GROUND_H;
    var groundY = H - GROUND_H;

    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, groundY, W, GROUND_H);
    ctx.fillStyle = '#121226';
    ctx.fillRect(0, groundY, W, 6);
    ctx.fillStyle = '#1a1a36';
    ctx.fillRect(0, groundY + 5, W, 1);
    ctx.fillStyle = '#181830';
    ctx.fillRect(0, groundY, W, 2);

    ctx.fillStyle = '#1a1a35';
    var off = scrollOffset;
    for (var x = -off; x < W; x += 24) {
      ctx.fillRect(x, groundY + GROUND_H / 2, 12, 2);
    }
  };
})();
