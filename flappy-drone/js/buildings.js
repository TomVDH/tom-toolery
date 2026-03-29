// buildings.js — far city parallax, ground, building rendering, neon signs
// All functions on window.FD namespace, using FD.ctx, FD.W, FD.H, FD.globalTick, etc.

(function () {
  const FD = window.FD;

  // windowHash is now on FD namespace (config.js) — alias for local use
  var windowHash = FD.windowHash;

  // --- Helper: compute nuke rim light parameters ---
  // holdEnd/fadeLen control when the rim fades out
  function nukeRimCalc(holdEnd, fadeLen) {
    if (!FD.nukeActive) return null;
    const ne = performance.now() - FD.nukeStart;
    let rimAlpha = 0;
    if (ne < 500) rimAlpha = Math.min(1, ne / 300);
    else if (ne < holdEnd) rimAlpha = 1;
    else rimAlpha = Math.max(0, 1 - (ne - holdEnd) / fadeLen);
    if (rimAlpha <= 0.01) return null;
    const rimWarmth = Math.min(1, ne / 1500);
    return {
      rimAlpha: rimAlpha,
      rimHue: rimWarmth * 25,
      rimSat: 60 + rimWarmth * 40,
      rimLum: 95 - rimWarmth * 45
    };
  }

  // --- Apply nuke rim light style to ctx ---
  function applyRimStyle(ctx, rim) {
    ctx.strokeStyle = `hsla(${rim.rimHue}, ${rim.rimSat}%, ${rim.rimLum}%, ${rim.rimAlpha * 0.5})`;
    ctx.shadowColor = `hsla(${rim.rimHue}, ${rim.rimSat}%, ${rim.rimLum + 5}%, ${rim.rimAlpha * 0.6})`;
    ctx.shadowBlur = 6 + rim.rimAlpha * 4;
    ctx.lineWidth = 0.75;
  }

  // --- Far city: 2-layer parallax skyline ---
  // scrollX: raw scroll value. layer: 'back', 'front', or undefined (both).
  FD.drawFarCity = function (scrollX, layer) {
    var ctx = FD.ctx, W = FD.W, H = FD.H;
    var GROUND_H = FD.GROUND_H, FAR_TILE_W = FD.FAR_TILE_W;
    var farBuildings = FD.farBuildings;

    var drawBack = !layer || layer === 'back';
    var drawFront = !layer || layer === 'front';
    var backBuildings = drawBack ? farBuildings.filter(function (b) { return b.layer === 'back'; }) : [];
    var frontBuildings = drawFront ? farBuildings.filter(function (b) { return b.layer === 'front' || !b.layer; }) : [];

    // Pre-compute nuke timing once for window EMP blackout
    var nukeOn = FD.nukeActive;
    var tMs = nukeOn ? performance.now() - FD.nukeStart : 0;

    // Window light state: EMP die per-window, relight staggered per-building
    function winLit(w, b) {
      if (!nukeOn) return w.on;
      if (tMs < w.die) return w.on;
      if (tMs < w.die + 80) return Math.random() > 0.5;          // EMP flicker off
      // Per-building staggered relight (building lightOnDelay offsets the relight)
      var bRelight = w.relight + (b.lightOnTick || 0) * 12;      // ~0-2s extra delay per building
      if (tMs < bRelight) return false;                            // dark period
      if (tMs < bRelight + 120) return Math.random() > 0.4;      // relight flicker
      return w.on;                                                 // fully restored
    }

    // Back layer — darker, slower parallax (0.6x)
    // Modulo applied per-layer from raw scroll to prevent snap at wrap boundary
    var frontScrollX = ((scrollX % FAR_TILE_W) + FAR_TILE_W) % FAR_TILE_W;
    var backScrollX = ((scrollX * 0.6) % FAR_TILE_W + FAR_TILE_W) % FAR_TILE_W;
    for (var tileOff = -FAR_TILE_W; tileOff < W + FAR_TILE_W; tileOff += FAR_TILE_W) {
      backBuildings.forEach(function (b, bi) {
        var bx = b.x + tileOff - backScrollX;
        if (bx + b.w > -10 && bx < W + 10) {
          var bTop = H - GROUND_H - b.h;

          if (b.zTower) {
            // === Z-TOWER: Evil tapered skyscraper ===
            // Tapered body — wider at base, narrower at top
            var topW = b.w;
            var botW = b.w + 10; // flares outward toward base
            var cx = bx + b.w / 2;
            ctx.fillStyle = '#0a0a1e';
            ctx.beginPath();
            ctx.moveTo(cx - topW / 2, bTop);
            ctx.lineTo(cx + topW / 2, bTop);
            ctx.lineTo(cx + botW / 2, H - GROUND_H);
            ctx.lineTo(cx - botW / 2, H - GROUND_H);
            ctx.closePath();
            ctx.fill();

            // Edge highlights (subtle purple)
            ctx.strokeStyle = 'rgba(120,60,180,0.25)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - topW / 2, bTop);
            ctx.lineTo(cx - botW / 2, H - GROUND_H);
            ctx.moveTo(cx + topW / 2, bTop);
            ctx.lineTo(cx + botW / 2, H - GROUND_H);
            ctx.stroke();

            // Purple windows — adapt to tapered width
            if (b.wins) b.wins.forEach(function (w) {
              // Interpolate x position along taper
              var rowT = w.dy / b.h; // 0=top, 1=bottom
              var rowW = topW + (botW - topW) * rowT;
              var rowLeft = cx - rowW / 2;
              var wxScaled = rowLeft + (w.dx / b.w) * rowW;
              var lit = winLit(w, b);
              ctx.fillStyle = lit ? 'rgba(160,80,255,0.45)' : 'rgba(100,50,160,0.04)';
              ctx.fillRect(wxScaled, bTop + w.dy, w.w, w.h);
            });

            // Antenna mast
            var antX = cx;
            var antH = 22;
            ctx.fillStyle = '#1a1a30';
            ctx.fillRect(antX - 1, bTop - antH, 2, antH);
            // Pulsing red LED at tip
            var pulse = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(FD.globalTick * 0.06));
            ctx.fillStyle = 'rgba(255,30,20,' + pulse + ')';
            ctx.beginPath(); ctx.arc(antX, bTop - antH, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,30,20,' + (pulse * 0.12) + ')';
            ctx.beginPath(); ctx.arc(antX, bTop - antH, 9, 0, Math.PI * 2); ctx.fill();

            // Large "Z" — white, flickering
            var zScale = 2; // 2x pixel scale
            var zW = 5 * zScale; // 10px wide
            var zH = 7 * zScale; // 14px tall
            var zx = cx - zW / 2;
            var zy = bTop + 4;
            var zFlicker = Math.sin(FD.globalTick * 0.08 + 1.7) > -0.8 ? 1 : 0.2;
            var zBright = 0.8 * zFlicker;
            ctx.fillStyle = 'rgba(255,255,255,' + zBright + ')';
            // Top bar
            ctx.fillRect(zx, zy, zW, zScale);
            // Diagonal (3 steps)
            ctx.fillRect(zx + 3 * zScale, zy + 1 * zScale, 2 * zScale, zScale);
            ctx.fillRect(zx + 1.5 * zScale, zy + 2 * zScale, 2 * zScale, zScale);
            ctx.fillRect(zx, zy + 3 * zScale, 2 * zScale, zScale);
            // Bottom bar
            ctx.fillRect(zx, zy + 4 * zScale, zW, zScale);
            // White glow behind Z
            ctx.fillStyle = 'rgba(255,255,255,' + (zBright * 0.08) + ')';
            ctx.fillRect(zx - 3, zy - 2, zW + 6, zH + 2);
            // Purple underglow on building face below Z
            ctx.fillStyle = 'rgba(140,60,220,' + (0.12 * zFlicker) + ')';
            ctx.fillRect(cx - topW / 2 + 1, zy + zH, topW - 2, 10);

          } else {
            // === Normal back-layer building ===
            ctx.fillStyle = '#080818';
            ctx.fillRect(bx, bTop, b.w, b.h);
            if (b.wins) b.wins.forEach(function (w) {
              ctx.fillStyle = winLit(w, b) ? 'rgba(255,200,55,0.35)' : 'rgba(255,200,55,0.02)';
              ctx.fillRect(bx + w.dx, bTop + w.dy, w.w, w.h);
            });
          }
        }
      });
    }

    // Front layer — brighter, full scroll speed
    for (var tileOff2 = -FAR_TILE_W; tileOff2 < W + FAR_TILE_W; tileOff2 += FAR_TILE_W) {
      frontBuildings.forEach(function (b) {
        var bx = b.x + tileOff2 - frontScrollX;
        if (bx + b.w > -10 && bx < W + 10) {
          ctx.fillStyle = '#0e0e24';
          ctx.fillRect(bx, H - GROUND_H - b.h, b.w, b.h);
          var bTop = H - GROUND_H - b.h;
          if (b.wins) b.wins.forEach(function (w) {
            ctx.fillStyle = winLit(w, b) ? 'rgba(255,200,55,0.4)' : 'rgba(255,200,55,0.02)';
            ctx.fillRect(bx + w.dx, bTop + w.dy, w.w, w.h);
          });
        }
      });
    }

    // --- Directional rim light helper ---
    // Draws top + directional side edges based on building position relative to light source
    function drawDirectionalRim(buildings, scrollOff, lightX, alphaScale) {
      ctx.beginPath();
      for (var to = -FAR_TILE_W; to < W + FAR_TILE_W; to += FAR_TILE_W) {
        buildings.forEach(function (b) {
          var bx = b.x + to - scrollOff;
          if (bx + b.w < -10 || bx > W + 10) return;
          var ty = H - GROUND_H - b.h;
          var cx = bx + b.w / 2; // building center x
          var rel = (cx - lightX) / (W * 0.5); // -1 to +1 relative position

          // Left side edge (building is to the right of light)
          if (rel > 0.15) {
            ctx.moveTo(bx, H - GROUND_H);
            ctx.lineTo(bx, ty);
          }
          // Top edge (always)
          ctx.moveTo(bx, ty);
          ctx.lineTo(bx + b.w, ty);
          // Right side edge (building is to the left of light)
          if (rel < -0.15) {
            ctx.lineTo(bx + b.w, H - GROUND_H);
          }
        });
      }
      ctx.stroke();
    }

    // Nuke rim light — directional from nuke center
    var rim = nukeRimCalc(3500, 1500);
    if (rim) {
      ctx.save();
      var lightX = FD.nukeGx;

      // Back layer rim — full intensity
      applyRimStyle(ctx, rim);
      drawDirectionalRim(backBuildings, backScrollX, lightX, 1);

      // Front layer rim — faint
      ctx.strokeStyle = `hsla(${rim.rimHue}, ${rim.rimSat}%, ${rim.rimLum}%, ${rim.rimAlpha * 0.15})`;
      ctx.shadowColor = `hsla(${rim.rimHue}, ${rim.rimSat}%, ${rim.rimLum + 5}%, ${rim.rimAlpha * 0.12})`;
      ctx.shadowBlur = 3;
      ctx.lineWidth = 0.5;
      drawDirectionalRim(frontBuildings, frontScrollX, lightX, 0.15);

      ctx.restore();
    }

    // Aurora rim light — soft colored glow on building tops from above (score-driven only)
    var auroraAlpha = FD.auroraIntensity * 0.3 + 0.12;
    if (auroraAlpha > 0.04) {
      ctx.save();
      var now = performance.now();
      var aHue = 140 + Math.sin(now * 0.0008) * 60;

      // Back layer — stronger aurora rim
      ctx.strokeStyle = `hsla(${aHue}, 60%, 50%, ${auroraAlpha * 0.3})`;
      ctx.shadowColor = `hsla(${aHue}, 60%, 45%, ${auroraAlpha * 0.2})`;
      ctx.shadowBlur = 4;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (var to5 = -FAR_TILE_W; to5 < W + FAR_TILE_W; to5 += FAR_TILE_W) {
        backBuildings.forEach(function (b) {
          var bx = b.x + to5 - backScrollX;
          if (bx + b.w > -10 && bx < W + 10) {
            var ty = H - GROUND_H - b.h;
            ctx.moveTo(bx, ty);
            ctx.lineTo(bx + b.w, ty);
          }
        });
      }
      ctx.stroke();

      // Front layer — very subtle top edge only
      ctx.strokeStyle = `hsla(${aHue}, 55%, 45%, ${auroraAlpha * 0.12})`;
      ctx.shadowColor = `hsla(${aHue}, 55%, 40%, ${auroraAlpha * 0.08})`;
      ctx.shadowBlur = 2;
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      for (var to6 = -FAR_TILE_W; to6 < W + FAR_TILE_W; to6 += FAR_TILE_W) {
        frontBuildings.forEach(function (b) {
          var bx = b.x + to6 - frontScrollX;
          if (bx + b.w > -10 && bx < W + 10) {
            var ty = H - GROUND_H - b.h;
            ctx.moveTo(bx, ty);
            ctx.lineTo(bx + b.w, ty);
          }
        });
      }
      ctx.stroke();

      ctx.restore();
    }
  };

  // --- Ground bar with animated stripes ---
  // scrollOffset: caller passes current stripe offset (e.g. (globalTick * PIPE_SPEED) % 24)
  FD.drawGround = function (scrollOffset) {
    var ctx = FD.ctx, W = FD.W, H = FD.H, GROUND_H = FD.GROUND_H;
    var groundY = H - GROUND_H;

    // Road surface
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, groundY, W, GROUND_H);

    // Sidewalk strip — 6px lighter band at top
    ctx.fillStyle = '#121226';
    ctx.fillRect(0, groundY, W, 6);

    // Kerb line — 1px at bottom of sidewalk
    ctx.fillStyle = '#1a1a36';
    ctx.fillRect(0, groundY + 5, W, 1);

    // Top edge line
    ctx.fillStyle = '#181830';
    ctx.fillRect(0, groundY, W, 2);

    // Centre lane stripes
    ctx.fillStyle = '#1a1a35';
    var off = scrollOffset;
    for (var x = -off; x < W; x += 24) {
      ctx.fillRect(x, groundY + GROUND_H / 2, 12, 2);
    }


  };

  // --- Unified building renderer ---
  // b = { x, w, topY, height, fromTop, seed, signText, signColor, signType }
  FD.drawBuilding = function (b) {
    var ctx = FD.ctx;
    var x = b.x, w = b.w, topY = b.topY, height = b.height, fromTop = b.fromTop;
    var seed = b.seed;
    var hue = 228 + (seed % 25);
    var lit = 11 + (seed % 5);

    // Main body
    ctx.fillStyle = 'hsl(' + hue + ', 25%, ' + lit + '%)';
    ctx.fillRect(x, topY, w, height);

    // Left / right edges
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

    // Windows — adapt columns to building width
    var winW = 5, winH = 7;
    var cols = w >= 70 ? 5 : (w >= 50 ? 3 : 2);
    var margin = (w - cols * winW) / (cols + 1);
    var startY = fromTop ? topY + 10 : capY + 10;
    var endY = fromTop ? topY + height - 14 : topY + height - 6;

    // Easter egg patterns for ~1 in 30 buildings
    var heartPattern = [
      [1,0,1],
      [1,1,1],
      [0,1,0],
    ];
    var smileyPattern = [
      [1,0,1],
      [0,0,0],
      [1,0,1],
      [0,1,0],
    ];

    // Count window rows to decide if easter egg fits
    var windowRows = 0;
    for (var rr = startY; rr < endY; rr += 16) windowRows++;
    var useEaster = (seed % 30 === 0) && windowRows >= 4 && cols >= 3;
    var easterPattern = useEaster ? ((seed % 60 < 30) ? heartPattern : smileyPattern) : null;
    var easterRowIdx = 0;

    // Track lit streaks per column
    var streaks = [];
    for (var si = 0; si < cols; si++) streaks.push(0);
    for (var row = startY; row < endY; row += 16) {
      for (var c = 0; c < cols; c++) {
        var wx = x + margin + c * (winW + margin);
        var on;
        // Easter egg patterns
        if (easterPattern) {
          var pr = easterPattern[easterRowIdx % easterPattern.length];
          on = (c < pr.length) ? pr[c] : 0;
        } else {
          on = windowHash(seed, c, row) > 0.45;
        }
        // Max 3 consecutive lit windows vertically
        if (on) {
          streaks[c]++;
          if (streaks[c] > 3) on = false;
        }
        if (!on) streaks[c] = 0;
        // EMP blackout during nuke — staggered per window
        if (on && FD.nukeActive) {
          var ne2 = performance.now() - FD.nukeStart;
          var wDie = 200 + windowHash(seed + 1, c, row + 9) * 600;
          var wRelight = 8500 + windowHash(seed + 2, c, row + 17) * 2000;
          if (ne2 > wDie && ne2 < wRelight) {
            on = (ne2 < wDie + 80) ? Math.random() > 0.5 :
                 (ne2 > wRelight - 120) ? Math.random() > 0.4 : false;
          }
        }
        ctx.fillStyle = on ? 'rgba(255, 200, 60, 0.65)' : 'rgba(255, 200, 60, 0.08)';
        ctx.fillRect(wx, row, winW, winH);
      }
      if (easterPattern) easterRowIdx++;
    }

    // Nuke rim light on game buildings — 7s total (ramp 0.5s, hold to 5.5s, fade 1.5s)
    var rim = nukeRimCalc(5500, 1500);
    if (rim) {
      ctx.save();
      applyRimStyle(ctx, rim);
      ctx.beginPath();
      // Trace cap overhang then right edge
      ctx.moveTo(x - 4, capY);
      ctx.lineTo(x + w + 4, capY);       // cap top edge
      ctx.lineTo(x + w + 4, capY + 5);   // cap right side
      ctx.lineTo(x + w, capY + 5);       // step in to building body
      ctx.lineTo(x + w, topY + height);  // building right edge down
      ctx.stroke();
      ctx.restore();
    }

    // Nuke silhouette — darken building + dim windows during blast
    if (FD.nukeActive) {
      var ne = performance.now() - FD.nukeStart;
      var silAlpha = 0;
      if (ne < 500) silAlpha = 0.7; // strong silhouette during flash
      else if (ne < 3000) silAlpha = 0.7 - (ne - 500) / 2500 * 0.5; // ease back
      else if (ne < 7000) silAlpha = 0.2; // lingering dim
      else silAlpha = Math.max(0, 0.2 * (1 - (ne - 7000) / 2000));
      if (silAlpha > 0.01) {
        ctx.globalAlpha = silAlpha;
        ctx.fillStyle = '#000';
        ctx.fillRect(x, topY, w, height);
        ctx.globalAlpha = 1;
      }
    }

    // Horizontal ledge dividers
    if (b.ledges) {
      var ledgeHue = hue;
      var ledgeLit = lit + 5;
      for (var lr = startY + 28; lr < endY - 10; lr += 42) {
        ctx.fillStyle = 'hsl(' + ledgeHue + ', 10%, ' + ledgeLit + '%)';
        ctx.fillRect(x - 3, lr, w + 6, 2);
      }
    }

    // Antenna cluster on roof
    if (b.antenna && !fromTop) {
      ctx.fillStyle = '#333';
      ctx.fillRect(x + w / 2 - 1, topY - 12, 2, 12);
      ctx.fillRect(x + w / 2 - 6, topY - 8, 1.5, 8);
      ctx.fillRect(x + w / 2 + 5, topY - 10, 1.5, 10);
      ctx.fillStyle = FD.globalTick % 50 < 25 ? '#ff2244' : '#440011';
      ctx.fillRect(x + w / 2 - 1, topY - 13, 2, 2);
      ctx.fillStyle = FD.globalTick % 70 < 35 ? '#00ff66' : '#003311';
      ctx.fillRect(x + w / 2 - 6, topY - 9, 2, 2);
    }

    // Neon signs — multiple attachment styles
    if (b.signText) {
      var flicker = Math.sin(FD.globalTick * 0.06 + seed * 3.7) > -0.85 ? 1 : 0.25;

      if (b.signType === 'roof' && !fromTop) {
        // Rooftop pixel sign (existing)
        var sy = topY - 10;
        FD.drawNeonText(b.signText, x, sy, w, b.signColor, seed);

      } else if (b.signType === 'side') {
        // Vertical sign running down the right wall
        ctx.save();
        ctx.translate(x + w + 5, topY + 10);
        ctx.rotate(Math.PI / 2);
        var scale = 1.2;
        var charW = 5, gap = 1;
        var totalW = b.signText.length * (charW + gap) * scale - gap * scale;
        // Glow backdrop
        ctx.globalAlpha = 0.1 * flicker;
        ctx.fillStyle = b.signColor;
        ctx.fillRect(-2, -8, totalW + 4, 12);
        // Text
        ctx.globalAlpha = 0.8 * flicker;
        ctx.fillStyle = b.signColor;
        var PX = FD.PX;
        for (var ci = 0; ci < b.signText.length; ci++) {
          var rows = PX[b.signText[ci]]; if (!rows) continue;
          var cx = ci * (charW + gap) * scale;
          for (var r = 0; r < 5; r++)
            for (var c = 0; c < charW; c++)
              if ((rows[r] >> (charW - 1 - c)) & 1)
                ctx.fillRect(cx + c * scale, -6 + r * scale, scale, scale);
        }
        ctx.restore();
        ctx.globalAlpha = 1;

      } else if (b.signType === 'stacked' && !fromTop) {
        // Individual letters stacked vertically down the building face
        var sScale = 1.3;
        var charH = 5;
        for (var si = 0; si < b.signText.length; si++) {
          var ly = topY + 10 + si * 15;
          if (ly > topY + height - 20) break;
          var charPxW = 6 * sScale;
          var ssx = x + (w - charPxW) / 2;
          // Glow bar
          ctx.globalAlpha = 0.07 * flicker;
          ctx.fillStyle = b.signColor;
          ctx.fillRect(x + 3, ly - 1, w - 6, 11);
          // Letter
          ctx.globalAlpha = 0.8 * flicker;
          var rows2 = FD.PX[b.signText[si]];
          if (rows2) {
            ctx.fillStyle = b.signColor;
            for (var r2 = 0; r2 < 5; r2++)
              for (var c2 = 0; c2 < 5; c2++)
                if ((rows2[r2] >> (4 - c2)) & 1)
                  ctx.fillRect(ssx + c2 * sScale, ly + r2 * sScale, sScale, sScale);
          }
        }
        ctx.globalAlpha = 1;

      } else {
        // Fallback: rooftop
        FD.drawNeonText(b.signText, x, topY - 10, w, b.signColor, seed);
      }
    }
  };

  // --- Neon pixel-font signs with flicker + glow backdrop ---
  // Uses FD.PX for the 5x5 pixel font bitmaps
  FD.drawNeonText = function (text, bx, sy, bw, color, seed) {
    var ctx = FD.ctx;
    var PX = FD.PX;
    var charW = 5, charH = 5, gap = 1, scale = 1.5;
    var totalW = text.length * (charW + gap) * scale - gap * scale;
    var sx = bx + (bw - totalW) / 2;

    // Glow backdrop
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = color;
    ctx.fillRect(sx - 3, sy - 2, totalW + 6, charH * scale + 4);

    // Flicker (each sign has its own rhythm)
    var flicker = Math.sin(FD.globalTick * 0.06 + seed * 3.7) > -0.85 ? 1 : 0.25;
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
