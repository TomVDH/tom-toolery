// buildings.js — Building renderer with grime system for Blast Off
// Buildings are wider than Flappy Drone's pipes. Grime patches cover inner facades.

(function () {
  const BO = window.BO;

  // --- Pseudo-random hash ---
  function windowHash(seed, c, row) {
    var h = seed * 2654435761 + c * 340573321 + Math.floor(row) * 196314165;
    h = ((h >>> 16) ^ h) * 0x45d9f3b;
    h = ((h >>> 16) ^ h);
    return (h & 0xFF) / 255;
  }

  // --- Generate grime grid for a building ---
  // Returns 2D array [col][row] where true = grimy
  BO.generateGrime = function (building) {
    var cellSize = BO.GRIME_CELL;
    var cols = Math.max(1, Math.floor(building.w / cellSize));
    var rows = Math.max(1, Math.floor(building.h / cellSize));
    var grid = [];
    var totalGrime = 0;
    for (var c = 0; c < cols; c++) {
      grid[c] = [];
      for (var r = 0; r < rows; r++) {
        var isGrimy = windowHash(building.seed, c + 100, r + 200) < (building.grimeDensity || BO.GRIME_DENSITY);
        grid[c][r] = isGrimy;
        if (isGrimy) totalGrime++;
      }
    }
    building.grimeGrid = grid;
    building.grimeCols = cols;
    building.grimeRows = rows;
    building.totalGrime = totalGrime;
    building.cleanedGrime = 0;
    return grid;
  };

  // --- Draw building body (reused from Flappy Drone) ---
  BO.drawBuilding = function (b) {
    var ctx = BO.ctx;
    var x = b.x, w = b.w, topY = b.topY, height = b.height, fromTop = b.fromTop;
    var seed = b.seed;
    var hue = 228 + (seed % 25);
    var lit = 11 + (seed % 5);

    // Main body
    ctx.fillStyle = 'hsl(' + hue + ', 25%, ' + lit + '%)';
    ctx.fillRect(x, topY, w, height);

    // Edges
    ctx.fillStyle = 'hsl(' + hue + ', 18%, ' + (lit + 4) + '%)';
    ctx.fillRect(x, topY, 2, height);
    ctx.fillStyle = 'hsl(' + hue + ', 30%, ' + (lit - 2) + '%)';
    ctx.fillRect(x + w - 2, topY, 2, height);

    // Cap
    var capY = fromTop ? topY + height - 5 : topY;
    ctx.fillStyle = 'hsl(' + hue + ', 12%, ' + (lit + 7) + '%)';
    ctx.fillRect(x - 4, capY, w + 8, 5);
    ctx.fillStyle = 'hsl(' + hue + ', 12%, ' + (lit + 10) + '%)';
    ctx.fillRect(x - 4, capY, w + 8, 1);

    // Windows
    var winW = 5, winH = 7;
    var cols = w >= 70 ? 5 : (w >= 50 ? 3 : 2);
    var margin = (w - cols * winW) / (cols + 1);
    var startY = fromTop ? topY + 10 : capY + 10;
    var endY = fromTop ? topY + height - 14 : topY + height - 6;

    var streaks = [];
    for (var si = 0; si < cols; si++) streaks.push(0);
    for (var row = startY; row < endY; row += 16) {
      for (var c = 0; c < cols; c++) {
        var wx = x + margin + c * (winW + margin);
        var on = windowHash(seed, c, row) > 0.45;
        if (on) { streaks[c]++; if (streaks[c] > 3) on = false; }
        if (!on) streaks[c] = 0;
        ctx.fillStyle = on ? 'rgba(255, 200, 60, 0.65)' : 'rgba(255, 200, 60, 0.08)';
        ctx.fillRect(wx, row, winW, winH);
      }
    }

    // Ledges
    if (b.ledges) {
      var ledgeLit = lit + 5;
      for (var lr = startY + 28; lr < endY - 10; lr += 42) {
        ctx.fillStyle = 'hsl(' + hue + ', 10%, ' + ledgeLit + '%)';
        ctx.fillRect(x - 3, lr, w + 6, 2);
      }
    }

    // Antenna
    if (b.antenna && !fromTop) {
      ctx.fillStyle = '#333';
      ctx.fillRect(x + w / 2 - 1, topY - 12, 2, 12);
      ctx.fillRect(x + w / 2 - 6, topY - 8, 1.5, 8);
      ctx.fillRect(x + w / 2 + 5, topY - 10, 1.5, 10);
      ctx.fillStyle = BO.globalTick % 50 < 25 ? '#ff2244' : '#440011';
      ctx.fillRect(x + w / 2 - 1, topY - 13, 2, 2);
      ctx.fillStyle = BO.globalTick % 70 < 35 ? '#00ff66' : '#003311';
      ctx.fillRect(x + w / 2 - 6, topY - 9, 2, 2);
    }

    // Neon signs
    if (b.signText) {
      BO.drawNeonText(b.signText, x, topY - 10, w, b.signColor, seed);
    }
  };

  // --- Draw grime overlay on a building ---
  // Only draws on the facade side (the side facing open sky)
  BO.drawGrime = function (b) {
    if (!b.grimeGrid) return;
    var ctx = BO.ctx;
    var cellSize = BO.GRIME_CELL;
    var x = b.x, topY = b.topY;

    for (var c = 0; c < b.grimeCols; c++) {
      for (var r = 0; r < b.grimeRows; r++) {
        if (!b.grimeGrid[c][r]) continue;

        var gx = x + c * cellSize;
        var gy = topY + r * cellSize;

        // Don't draw grime outside building bounds
        if (gy + cellSize < b.topY || gy > b.topY + b.height) continue;

        // Grimy overlay — greenish-brown splotch
        var grimeHue = 60 + windowHash(b.seed, c + 50, r + 50) * 40;
        var grimeLum = 12 + windowHash(b.seed, c + 70, r + 70) * 8;
        ctx.globalAlpha = 0.55 + windowHash(b.seed, c + 90, r + 90) * 0.2;
        ctx.fillStyle = 'hsl(' + grimeHue + ', 30%, ' + grimeLum + '%)';
        ctx.fillRect(gx, gy, cellSize, cellSize);

        // Texture dots
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#000';
        var dotCount = 2 + Math.floor(windowHash(b.seed, c + 30, r + 30) * 3);
        for (var d = 0; d < dotCount; d++) {
          var dx = gx + windowHash(b.seed, c * 10 + d, r) * cellSize;
          var dy = gy + windowHash(b.seed, c, r * 10 + d) * cellSize;
          ctx.fillRect(dx, dy, 2, 2);
        }
      }
    }
    ctx.globalAlpha = 1;
  };

  // --- Neon pixel-font signs ---
  BO.drawNeonText = function (text, bx, sy, bw, color, seed) {
    var ctx = BO.ctx;
    var PX = BO.PX;
    var charW = 5, charH = 5, gap = 1, scale = 1.5;
    var totalW = text.length * (charW + gap) * scale - gap * scale;
    var sx = bx + (bw - totalW) / 2;

    ctx.globalAlpha = 0.15;
    ctx.fillStyle = color;
    ctx.fillRect(sx - 3, sy - 2, totalW + 6, charH * scale + 4);

    var flicker = Math.sin(BO.globalTick * 0.06 + seed * 3.7) > -0.85 ? 1 : 0.25;
    ctx.globalAlpha = 0.85 * flicker;
    ctx.fillStyle = color;

    for (var ci = 0; ci < text.length; ci++) {
      var rows = PX[text[ci]];
      if (!rows) continue;
      var cx = sx + ci * (charW + gap) * scale;
      for (var r = 0; r < charH; r++) {
        for (var c = 0; c < charW; c++) {
          if ((rows[r] >> (charW - 1 - c)) & 1) {
            ctx.fillRect(cx + c * scale, sy + r * scale, scale, scale);
          }
        }
      }
    }
    ctx.globalAlpha = 1;
  };
})();
