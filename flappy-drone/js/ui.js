// ui.js — UI overlays: screen show/hide, death sequence, ready countdown
(function () {
  const FD = window.FD;

  // --- Screen show/hide ---
  FD.showScreen = function (el) {
    el.classList.add('show');
  };

  FD.hideScreen = function (el) {
    el.classList.remove('show');
  };

  // --- Dark Souls "YOU DIED" (canvas-rendered) ---
  FD.drawDeathSequence = function (state, deathTimer) {
    if (state !== 'dying') return;

    const ctx = FD.ctx;
    const W = FD.W;
    const H = FD.H;
    const t = deathTimer;

    // Phase 1: Red flash (first few frames)
    if (t < FD.DEATH_FLASH_DUR) {
      const flashT = 1 - (t / FD.DEATH_FLASH_DUR);
      ctx.globalAlpha = flashT * 0.4;
      ctx.fillStyle = '#cc1100';
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    // Phase 2+3+4: "YOU DIED" text with horizontal shadow band
    const textStart = FD.DEATH_FLASH_DUR;
    const textT = t - textStart;

    if (textT >= 0) {
      // Calculate text opacity: fade in -> hold -> fade out
      let textAlpha = 0;
      if (textT < FD.DIED_FADE_IN) {
        // Slow fade in
        textAlpha = textT / FD.DIED_FADE_IN;
        textAlpha = textAlpha * textAlpha; // ease-in curve
      } else if (textT < FD.DIED_FADE_IN + FD.DIED_HOLD) {
        textAlpha = 1;
      } else if (textT < FD.DIED_FADE_IN + FD.DIED_HOLD + FD.DIED_FADE_OUT) {
        const fadeT = (textT - FD.DIED_FADE_IN - FD.DIED_HOLD) / FD.DIED_FADE_OUT;
        textAlpha = 1 - fadeT;
      }

      if (textAlpha > 0.01) {
        // Horizontal shadow band (blurred dark bar across screen center)
        const bandH = 80;
        const bandY = H / 2 - bandH / 2;
        const bandGrad = ctx.createLinearGradient(0, bandY - 20, 0, bandY + bandH + 20);
        bandGrad.addColorStop(0, 'rgba(0,0,0,0)');
        bandGrad.addColorStop(0.15, `rgba(0,0,0,${textAlpha * 0.6})`);
        bandGrad.addColorStop(0.5, `rgba(0,0,0,${textAlpha * 0.75})`);
        bandGrad.addColorStop(0.85, `rgba(0,0,0,${textAlpha * 0.6})`);
        bandGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bandGrad;
        ctx.fillRect(0, bandY - 20, W, bandH + 40);

        // Death text (dynamic — "YOU DIED" or "YOU ENDED THE WORLD" etc)
        const deathMsg = FD.deathText || 'YOU DIED';
        const fontSize = deathMsg.length > 12 ? 32 : 48;
        ctx.globalAlpha = textAlpha;
        ctx.font = `700 ${fontSize}px "Segoe UI", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Red glow layers
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

  // --- Shared milestone text renderer ---
  // Used by countdown DRONE!, in-game score milestones, and tester.
  // phase: 0→1 over the effect lifetime
  // Phases: appear (0–0.15), hold (0.15–0.7), revert-out (0.7–1.0)
  FD.drawMilestoneText = function (text, color, phase, cx, cy) {
    const ctx = FD.ctx;
    var scale, alpha;

    if (phase < 0.15) {
      // Slam in: scale 2.0→1.0 with overshoot
      var p = phase / 0.15;
      var ease = p < 0.7 ? p / 0.7 : 1 + (1 - (p - 0.7) / 0.3) * 0.15;
      scale = 2.0 - ease * 1.0;
      alpha = Math.min(1, p * 2);
    } else if (phase < 0.7) {
      // Hold with gentle breathe
      scale = 1.0 + Math.sin((phase - 0.15) * 12) * 0.02;
      alpha = 1;
    } else {
      // Revert out: scale back up, fade
      var rt = (phase - 0.7) / 0.3;
      var eo = rt * rt;
      scale = 1.0 + eo * 1.2;
      alpha = Math.max(0, 1 - eo * 1.5);
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    ctx.font = '700 42px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 30;
    ctx.fillText(text, 0, 0);
    ctx.shadowBlur = 12;
    ctx.fillText(text, 0, 0);
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.globalAlpha = 1;
    ctx.restore();

    return { phase: phase, alpha: alpha }; // for caller to check if burst needed
  };

  // Spawn milestone particle burst (call once at phase start)
  FD.spawnMilestoneParticles = function (cx, cy, color) {
    var hue = 190;
    if (color === '#ffcc00') hue = 45;
    else if (color === '#ff4466') hue = 345;
    else if (color === '#cc44ff') hue = 280;
    for (var i = 0; i < 16; i++) {
      var a = (i / 16) * Math.PI * 2 + Math.random() * 0.3;
      var spd = 1.5 + Math.random() * 2.5;
      FD.particles.push({
        x: cx + Math.cos(a) * 25,
        y: cy + Math.sin(a) * 18,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 0.5,
        life: 25 + Math.random() * 20, maxLife: 45,
        r: 1.5 + Math.random() * 2,
        hue: hue + Math.random() * 20 - 10, sat: 100, lum: 70,
        glow: true
      });
    }
  };

  // --- DRONE! animation variants (randomly selected each countdown) ---
  const DRONE_STYLES = ['slam', 'typewriter', 'shockwave', 'radar', 'assemble'];
  FD._droneAnimStyle = null;     // picked when DRONE! phase begins
  FD._droneAnimTriggered = false; // prevents re-picking mid-animation

  // Pre-generate particle data for G (assemble) style
  const assembleParticles = [];
  for (let c = 0; c < 6; c++) {
    const set = [];
    for (let p = 0; p < 12; p++) {
      set.push({
        sx: (Math.random() - 0.5) * 800, sy: (Math.random() - 0.5) * 600,
        ex: (Math.random() - 0.5) * 14, ey: (Math.random() - 0.5) * 14,
        sz: 1 + Math.random() * 2.5, spd: 0.7 + Math.random() * 0.5,
        ea: Math.random() * Math.PI * 2, es: 2 + Math.random() * 4
      });
    }
    assembleParticles.push(set);
  }

  // --- Ready countdown overlay ---
  FD.drawReadySequence = function (readyT, state) {
    if (state !== 'ready') { FD._droneAnimTriggered = false; return; }

    const ctx = FD.ctx;
    const W = FD.W;
    const H = FD.H;
    const t = readyT; // 0 -> 1 over exactly 4 seconds
    const elapsed = performance.now() - FD.readyStartTime;

    // Draw drone (uses active type)
    const droneType = FD.activeDroneType || 'quad';
    FD.drawDrone(FD.drone.x, FD.drone.y, FD.drone.angle, FD.drone.propPhase, droneType);

    // Blinking glow pulse around drone
    // Blink frequency: starts fast (~15Hz), tapers to slow (~2Hz), then fades out
    const blinkHz = 15 - t * t * 13;
    const blinkPhase = Math.sin(elapsed * blinkHz * 0.00628);
    const blinkOn = blinkPhase > 0;

    if (blinkOn || t > 0.9) {
      ctx.save();
      ctx.translate(FD.drone.x, FD.drone.y);
      ctx.rotate(FD.drone.angle);
      ctx.scale(1.15, 1.15); // match drone scale

      const outlineAlpha = t > 0.9 ? Math.max(0, 1 - (t - 0.9) / 0.1) : 0.85;

      // Glow halo — works for any drone shape
      const glowGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, 28);
      glowGrad.addColorStop(0, `rgba(0, 212, 255, ${outlineAlpha * 0.15})`);
      glowGrad.addColorStop(0.6, `rgba(0, 212, 255, ${outlineAlpha * 0.05})`);
      glowGrad.addColorStop(1, 'rgba(0, 212, 255, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.fill();

      // Draw a cyan wireframe outline around the drone (path-based so stroke works)
      // Uses a generic drone silhouette shape that works for all types.
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 1;
      ctx.globalAlpha = outlineAlpha;
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(-15, -5); ctx.lineTo(-4, -5); ctx.lineTo(-4, -8);
      ctx.lineTo(4, -8); ctx.lineTo(4, -5); ctx.lineTo(15, -5);
      ctx.lineTo(19, -2); ctx.lineTo(19, 3); ctx.lineTo(15, 3);
      ctx.lineTo(10, 5); ctx.lineTo(10, 9); ctx.lineTo(-10, 9);
      ctx.lineTo(-10, 5); ctx.lineTo(-15, 3); ctx.lineTo(-19, 3);
      ctx.lineTo(-19, -2); ctx.closePath();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Text: Ready? (0-38%) -> Set. (38-75%) -> DRONE! (75-100%)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textY = H / 2 - 70;

    if (t < 0.38) {
      // "Ready?" -- swoosh in from left, hold, swoosh out right
      const phase = t / 0.38;
      let alpha, offsetX;
      if (phase < 0.15) {
        const p = phase / 0.15;
        alpha = p * 0.8; offsetX = (1 - p) * -40;
      } else if (phase > 0.85) {
        const p = (phase - 0.85) / 0.15;
        alpha = (1 - p) * 0.8; offsetX = p * 40;
      } else {
        alpha = 0.8; offsetX = 0;
      }
      ctx.globalAlpha = alpha;
      ctx.font = '700 22px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#667';
      ctx.fillText('Ready?', W / 2 + offsetX, textY);

    } else if (t < 0.75) {
      // "Set." -- swoosh in, hold, swoosh out
      const phase = (t - 0.38) / 0.37;
      let alpha, offsetX;
      if (phase < 0.12) {
        const p = phase / 0.12;
        alpha = p * 0.85; offsetX = (1 - p) * -35;
      } else if (phase > 0.88) {
        const p = (phase - 0.88) / 0.12;
        alpha = (1 - p) * 0.85; offsetX = p * 35;
      } else {
        alpha = 0.85; offsetX = 0;
      }
      ctx.globalAlpha = alpha;
      ctx.font = '700 22px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#778';
      ctx.fillText('Set.', W / 2 + offsetX, textY);

    } else {
      // "DRONE!" — randomly selected animation style
      const phase = (t - 0.75) / 0.25;

      // Pick style once at start of DRONE! phase
      if (!FD._droneAnimTriggered) {
        FD._droneAnimTriggered = true;
        FD._droneAnimStyle = DRONE_STYLES[Math.floor(Math.random() * DRONE_STYLES.length)];
      }

      const style = FD._droneAnimStyle;
      const dtext = 'DRONE!';

      if (style === 'slam') {
        // A — Milestone Slam
        if (phase < 0.02) FD.spawnMilestoneParticles(W / 2, textY, '#00d4ff');
        FD.drawMilestoneText(dtext, '#00d4ff', phase, W / 2, textY);

      } else if (style === 'typewriter') {
        // B — Typewriter Burn-In
        const charTime = 0.08;  // faster since we have less total time
        const totalType = 6 * charTime;
        const holdEnd = 0.75, fadeStart = holdEnd;
        ctx.font = '700 36px "Courier New", monospace';
        const charW = ctx.measureText('D').width;
        const totalW = ctx.measureText(dtext).width;
        const startX = W / 2 - totalW / 2;
        const localT = phase; // 0→1

        if (localT < totalType) {
          const charsVis = Math.floor(localT / charTime);
          const cp = (localT % charTime) / charTime;
          for (let i = 0; i <= charsVis && i < 6; i++) {
            const isNew = (i === charsVis);
            const cX = startX + ctx.measureText(dtext.substring(0, i)).width + charW / 2;
            ctx.save();
            if (isNew) {
              ctx.globalAlpha = 0.3 + cp * 0.7; ctx.fillStyle = '#00d4ff';
              ctx.shadowColor = '#fff'; ctx.shadowBlur = 20 + (1 - cp) * 30;
              ctx.fillText(dtext[i], cX, textY);
              if (1 - cp > 0.5) { ctx.globalAlpha = (1 - cp) * 0.5; ctx.fillStyle = '#fff'; ctx.shadowBlur = 40; ctx.fillText(dtext[i], cX, textY); }
            } else {
              ctx.globalAlpha = 1; ctx.fillStyle = '#00d4ff'; ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 8; ctx.fillText(dtext[i], cX, textY);
            }
            ctx.restore();
          }
          // Cursor
          const curX = startX + ctx.measureText(dtext.substring(0, Math.min(charsVis + 1, 6))).width + 4;
          if (Math.sin(localT * 120) > 0) { ctx.fillStyle = '#00d4ff'; ctx.globalAlpha = 0.6; ctx.fillRect(curX, textY - 16, 2, 32); ctx.globalAlpha = 1; }
        } else if (localT < fadeStart) {
          const pulse = 1 + Math.sin((localT - totalType) / (fadeStart - totalType) * Math.PI * 4) * 0.03;
          ctx.save(); ctx.translate(W / 2, textY); ctx.scale(pulse, pulse);
          ctx.fillStyle = '#00d4ff'; ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 15; ctx.fillText(dtext, 0, 0);
          ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; ctx.restore();
        } else {
          const f = (localT - fadeStart) / (1 - fadeStart);
          ctx.save(); ctx.globalAlpha = Math.max(0, 1 - f); ctx.translate(W / 2, textY);
          ctx.scale(1 + f * 0.3, 1 + f * 0.3);
          ctx.fillStyle = '#00d4ff'; ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 10 + f * 20; ctx.fillText(dtext, 0, 0); ctx.restore();
        }

      } else if (style === 'shockwave') {
        // D — Shockwave Slam
        ctx.font = '700 36px "Segoe UI", system-ui, sans-serif';
        if (phase < 0.15) {
          const dropT = phase / 0.15; const easeIn = dropT * dropT * dropT;
          const y = -40 + (textY + 40) * easeIn;
          ctx.save(); ctx.globalAlpha = Math.min(1, dropT * 2); ctx.fillStyle = '#00d4ff';
          ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 20; ctx.fillText(dtext, W / 2, y); ctx.restore();
        } else if (phase < 0.2) {
          const impT = (phase - 0.15) / 0.05;
          ctx.save(); ctx.globalAlpha = (1 - impT) * 0.4; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore();
          const shake = (1 - impT) * 4;
          ctx.save(); ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
          ctx.fillStyle = '#00d4ff'; ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 25;
          ctx.fillText(dtext, W / 2, textY); ctx.shadowBlur = 10; ctx.fillText(dtext, W / 2, textY); ctx.restore();
        } else if (phase < 0.7) {
          const hp = (phase - 0.2) / 0.5;
          const rr = 20 + hp * 200; const ra = Math.max(0, 0.4 - hp * 0.5);
          ctx.save(); ctx.strokeStyle = 'rgba(0,212,255,' + ra + ')'; ctx.lineWidth = 2 - hp * 1.5;
          ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.arc(W / 2, textY, rr, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
          if (hp > 0.15) { const r2p = (hp - 0.15) / 0.85; const r2r = 15 + r2p * 160; const r2a = Math.max(0, 0.25 - r2p * 0.35);
            ctx.save(); ctx.strokeStyle = 'rgba(0,212,255,' + r2a + ')'; ctx.lineWidth = 1.5 - r2p;
            ctx.beginPath(); ctx.arc(W / 2, textY, r2r, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
          const breathe = 1 + Math.sin(hp * Math.PI * 6) * 0.015;
          ctx.save(); ctx.translate(W / 2, textY); ctx.scale(breathe, breathe);
          ctx.fillStyle = '#00d4ff'; ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 12;
          ctx.fillText(dtext, 0, 0); ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; ctx.restore();
        } else {
          const ft = (phase - 0.7) / 0.3;
          ctx.save(); ctx.translate(W / 2, textY); ctx.scale(1 + ft * 0.4, 1 + ft * 0.4);
          ctx.globalAlpha = Math.max(0, 1 - ft * 1.3); ctx.fillStyle = '#00d4ff';
          ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = ft * 25; ctx.fillText(dtext, 0, 0); ctx.restore();
        }

      } else if (style === 'radar') {
        // F — Radar Sweep
        ctx.font = '700 36px "Courier New", monospace';
        const localT = phase; // 0→1
        const sweepAngle = (localT / 0.4) * Math.PI * 2;
        const sweepAlpha = localT < 0.6 ? Math.min(0.4, localT * 1.2) : Math.max(0, 0.4 - (localT - 0.6) * 1.0);
        if (sweepAlpha > 0.01) {
          ctx.save();
          ctx.strokeStyle = 'rgba(0,212,255,' + sweepAlpha + ')'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(W / 2, textY);
          ctx.lineTo(W / 2 + Math.cos(sweepAngle) * 200, textY + Math.sin(sweepAngle) * 200); ctx.stroke();
          for (let i = 1; i < 6; i++) {
            ctx.strokeStyle = 'rgba(0,212,255,' + (sweepAlpha * (1 - i / 6) * 0.3) + ')';
            ctx.beginPath(); ctx.moveTo(W / 2, textY);
            ctx.lineTo(W / 2 + Math.cos(sweepAngle - i * 0.12) * 180, textY + Math.sin(sweepAngle - i * 0.12) * 180); ctx.stroke();
          }
          ctx.strokeStyle = 'rgba(0,212,255,' + (sweepAlpha * 0.3) + ')';
          ctx.beginPath(); ctx.arc(W / 2, textY, 100, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
        }
        const totalW = ctx.measureText(dtext).width;
        const startX = W / 2 - totalW / 2;
        const charW = ctx.measureText('D').width;
        for (let i = 0; i < 6; i++) {
          const cX = startX + ctx.measureText(dtext.substring(0, i)).width + charW / 2;
          const revealT = 0.1 + i * 0.1;
          if (localT < revealT) continue;
          const charAge = localT - revealT;
          let charAlpha = charAge < 0.1 ? charAge / 0.1 : (localT < 0.8 ? 1 : Math.max(0, 1 - (localT - 0.8) / 0.2));
          ctx.save(); ctx.globalAlpha = charAlpha; ctx.fillStyle = '#00d4ff';
          ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = charAge < 0.2 ? 20 : 8;
          ctx.fillText(dtext[i], cX, textY);
          if (charAge < 0.2) {
            const pr = charAge / 0.2 * 18; const pa = (1 - charAge / 0.2) * 0.4;
            ctx.strokeStyle = 'rgba(0,212,255,' + pa + ')'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(cX, textY, pr, 0, Math.PI * 2); ctx.stroke();
          }
          ctx.restore();
        }

      } else if (style === 'assemble') {
        // G — Particle Assemble
        ctx.font = '700 36px "Courier New", monospace';
        const localT = phase;
        const totalW = ctx.measureText(dtext).width;
        const startX = W / 2 - totalW / 2;
        const charW = ctx.measureText('D').width;
        for (let c = 0; c < 6; c++) {
          const cX = startX + ctx.measureText(dtext.substring(0, c)).width + charW / 2;
          const cd = c * 0.03;
          const lt = localT - cd;
          if (lt < 0) continue;
          if (lt < 0.3) {
            // Converge
            const ct = lt / 0.3; const ease = 1 - Math.pow(1 - ct, 3);
            assembleParticles[c].forEach(function (p) {
              const px = p.sx + (cX + p.ex - p.sx) * ease * p.spd;
              const py = p.sy + (textY + p.ey - p.sy) * ease * p.spd;
              ctx.save(); ctx.globalAlpha = Math.min(1, ct * 2); ctx.fillStyle = '#00d4ff';
              ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 4;
              ctx.beginPath(); ctx.arc(px, py, p.sz * (1 - ease * 0.5), 0, Math.PI * 2); ctx.fill(); ctx.restore();
            });
          } else if (lt < 0.4) {
            // Crystallise
            const ct = (lt - 0.3) / 0.1;
            ctx.save(); ctx.globalAlpha = ct; ctx.fillStyle = '#00d4ff';
            ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = (1 - ct) * 20 + 8;
            ctx.fillText(dtext[c], cX, textY); ctx.restore();
          } else if (lt < 0.75) {
            // Hold
            ctx.fillStyle = '#00d4ff'; ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 8;
            ctx.fillText(dtext[c], cX, textY); ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
          } else {
            // Shatter
            const st = (lt - 0.75) / 0.25;
            if (st < 0.1) { ctx.save(); ctx.globalAlpha = 1 - st * 10; ctx.fillStyle = '#00d4ff'; ctx.fillText(dtext[c], cX, textY); ctx.restore(); }
            assembleParticles[c].forEach(function (p) {
              const ease = st * st;
              const px = cX + p.ex + Math.cos(p.ea) * p.es * ease * 100;
              const py = textY + p.ey + Math.sin(p.ea) * p.es * ease * 100;
              ctx.save(); ctx.globalAlpha = Math.max(0, 1 - ease * 1.3); ctx.fillStyle = '#00d4ff';
              ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 3;
              ctx.beginPath(); ctx.arc(px, py, p.sz * (1 - ease * 0.5), 0, Math.PI * 2); ctx.fill(); ctx.restore();
            });
          }
        }
      }
    }
    ctx.globalAlpha = 1;
  };
})();
