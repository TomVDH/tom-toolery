// ui.js — UI overlays: screen show/hide, death sequence, ready countdown
(function () {
  const BO = window.BO;

  // --- Screen show/hide ---
  BO.showScreen = function (el) { el.classList.add('show'); };
  BO.hideScreen = function (el) { el.classList.remove('show'); };

  // --- "YOU DIED" death sequence (canvas-rendered, Dark Souls style) ---
  BO.drawDeathSequence = function (state, deathTimer) {
    if (state !== 'dying') return;

    const ctx = BO.ctx;
    const W = BO.W, H = BO.H;
    const t = deathTimer;

    // Red flash
    if (t < BO.DEATH_FLASH_DUR) {
      var flashT = 1 - (t / BO.DEATH_FLASH_DUR);
      ctx.globalAlpha = flashT * 0.4;
      ctx.fillStyle = '#cc1100';
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    // "YOU DIED" text
    var textStart = BO.DEATH_FLASH_DUR;
    var textT = t - textStart;
    if (textT >= 0) {
      var textAlpha = 0;
      if (textT < BO.DIED_FADE_IN) {
        textAlpha = textT / BO.DIED_FADE_IN;
        textAlpha = textAlpha * textAlpha;
      } else if (textT < BO.DIED_FADE_IN + BO.DIED_HOLD) {
        textAlpha = 1;
      } else if (textT < BO.DIED_FADE_IN + BO.DIED_HOLD + BO.DIED_FADE_OUT) {
        var fadeT = (textT - BO.DIED_FADE_IN - BO.DIED_HOLD) / BO.DIED_FADE_OUT;
        textAlpha = 1 - fadeT;
      }

      if (textAlpha > 0.01) {
        var bandH = 80;
        var bandY = H / 2 - bandH / 2;
        var bandGrad = ctx.createLinearGradient(0, bandY - 20, 0, bandY + bandH + 20);
        bandGrad.addColorStop(0, 'rgba(0,0,0,0)');
        bandGrad.addColorStop(0.15, 'rgba(0,0,0,' + (textAlpha * 0.6) + ')');
        bandGrad.addColorStop(0.5, 'rgba(0,0,0,' + (textAlpha * 0.75) + ')');
        bandGrad.addColorStop(0.85, 'rgba(0,0,0,' + (textAlpha * 0.6) + ')');
        bandGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bandGrad;
        ctx.fillRect(0, bandY - 20, W, bandH + 40);

        var deathMsg = BO.deathText || 'YOU DIED';
        var fontSize = deathMsg.length > 12 ? 32 : 48;
        ctx.globalAlpha = textAlpha;
        ctx.font = '700 ' + fontSize + 'px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#cc220088';
        ctx.shadowBlur = 40;
        ctx.fillStyle = '#bb2200';
        ctx.fillText(deathMsg, W / 2, H / 2);
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#cc2200';
        ctx.fillText(deathMsg, W / 2, H / 2);
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.globalAlpha = 1;
      }
    }
  };

  // --- Ready countdown ---
  BO.drawReadySequence = function (readyT, state) {
    if (state !== 'ready') return;

    const ctx = BO.ctx;
    const W = BO.W, H = BO.H;
    var t = readyT;
    var elapsed = performance.now() - BO.readyStartTime;

    // Draw drone with nozzle
    BO.drawDrone(BO.drone.x, BO.drone.y, BO.drone.angle, BO.drone.propPhase,
      BO.activeDroneType, { x: 0, y: 1 }, false);

    // Blinking glow
    var blinkHz = 15 - t * t * 13;
    var blinkPhase = Math.sin(elapsed * blinkHz * 0.00628);
    if (blinkPhase > 0 || t > 0.9) {
      ctx.save();
      ctx.translate(BO.drone.x, BO.drone.y);
      var outlineAlpha = t > 0.9 ? Math.max(0, 1 - (t - 0.9) / 0.1) : 0.85;
      var glowGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, 28);
      glowGrad.addColorStop(0, 'rgba(0, 170, 255, ' + (outlineAlpha * 0.15) + ')');
      glowGrad.addColorStop(0.6, 'rgba(0, 170, 255, ' + (outlineAlpha * 0.05) + ')');
      glowGrad.addColorStop(1, 'rgba(0, 170, 255, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Text: Ready? → Set. → SPRAY!
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var textY = H / 2 - 70;

    if (t < 0.38) {
      var phase = t / 0.38;
      var alpha, offsetX;
      if (phase < 0.15) { alpha = (phase / 0.15) * 0.8; offsetX = (1 - phase / 0.15) * -40; }
      else if (phase > 0.85) { alpha = (1 - (phase - 0.85) / 0.15) * 0.8; offsetX = ((phase - 0.85) / 0.15) * 40; }
      else { alpha = 0.8; offsetX = 0; }
      ctx.globalAlpha = alpha;
      ctx.font = '700 22px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#667';
      ctx.fillText('Ready?', W / 2 + offsetX, textY);
    } else if (t < 0.75) {
      var phase2 = (t - 0.38) / 0.37;
      var alpha2, offsetX2;
      if (phase2 < 0.12) { alpha2 = (phase2 / 0.12) * 0.85; offsetX2 = (1 - phase2 / 0.12) * -35; }
      else if (phase2 > 0.88) { alpha2 = (1 - (phase2 - 0.88) / 0.12) * 0.85; offsetX2 = ((phase2 - 0.88) / 0.12) * 35; }
      else { alpha2 = 0.85; offsetX2 = 0; }
      ctx.globalAlpha = alpha2;
      ctx.font = '700 22px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#778';
      ctx.fillText('Set.', W / 2 + offsetX2, textY);
    } else {
      var phase3 = (t - 0.75) / 0.25;
      if (phase3 < 0.5) {
        var smackT = Math.min(1, phase3 / 0.12);
        var scaleOvershoot = smackT < 1 ? 1 + (1 - smackT) * 0.2 : 1;
        ctx.save();
        ctx.translate(W / 2, textY);
        ctx.scale(scaleOvershoot, scaleOvershoot);
        ctx.globalAlpha = Math.min(1, smackT * 1.5);
        ctx.font = '700 36px "Courier New", monospace';
        ctx.fillStyle = '#00aaff';
        ctx.shadowColor = '#00aaffaa';
        ctx.shadowBlur = 30;
        ctx.fillText('SPRAY!', 0, 0);
        ctx.shadowBlur = 12;
        ctx.fillText('SPRAY!', 0, 0);
        ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
        ctx.restore();
      } else {
        var blowT = (phase3 - 0.5) / 0.5;
        var easeT = 1 - Math.pow(1 - blowT, 2);
        var scale = 1 + easeT * 18;
        var alphaB = Math.max(0, 1 - easeT * 1.2);
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alphaB;
        ctx.font = '700 36px "Courier New", monospace';
        ctx.fillStyle = '#00aaff';
        ctx.shadowColor = 'rgba(0, 170, 255, ' + (alphaB * 0.7) + ')';
        ctx.shadowBlur = 20 + easeT * 40;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('SPRAY!', 11, textY - H / 2);
        ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  };
})();
