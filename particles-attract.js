/* ===== Particles that gather around your mouse (background canvas) =====
 * Drop this file in your project and include: <script src="particles-attract.js"></script>
 * Works on every page. No other setup needed.
 */

(function () {
  // ---- Config ----
  const CONFIG = {
    particleColor: "#000408ff",
    particleMinSize: 1.2,
    particleMaxSize: 2.4,
    particleOpacity: 0.9,

    // Particles scale with screen area; max caps performance.
    maxParticles: 240,                // upper limit
    areaPerParticle: 10000,           // bigger -> fewer particles

    attractRadius: 140,               // px radius where attraction engages
    attractStrength: 0.16,            // 0.05–0.3 is nice
    springHome: 0.015,                // pull back toward "home" position
    maxSpeed: 1.6,                    // clamp particle speed
    drift: 0.08,                      // subtle random drift

    // Optional connection lines (set to 0 to disable)
    linkRadius: 65,
    linkColor: "rgba(0, 0, 0, 0.25)",
  };

  // ---- Canvas bootstrap ----
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.id = "particle-field";
  document.body.prepend(canvas);

  // Make sure it sits behind your content & doesn’t block clicks
  const style = document.createElement("style");
  style.textContent = `
    #particle-field {
      position: fixed; inset: 0;
      width: 100vw; height: 100vh;
      z-index: 0; pointer-events: none;
    }

    /* Keep everything above the particles — except the header */
    body > *:not(#particle-field):not(header) {
      position: relative;
      z-index: 1;
    }
  `;
  document.head.appendChild(style);


  let w = (canvas.width = window.innerWidth);
  let h = (canvas.height = window.innerHeight);

  // ---- Particles ----
  const particles = [];
  const mouse = { x: -9999, y: -9999, active: false };

  function targetParticleCount() {
    return Math.min(
      CONFIG.maxParticles,
      Math.max(40, Math.floor((w * h) / CONFIG.areaPerParticle))
    );
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  function createParticle() {
    const x = Math.random() * w;
    const y = Math.random() * h;
    return {
      x,
      y,
      vx: rand(-0.2, 0.2),
      vy: rand(-0.2, 0.2),
      size: rand(CONFIG.particleMinSize, CONFIG.particleMaxSize),
      homeX: x,
      homeY: y,
    };
  }

  function initParticles() {
    particles.length = 0;
    const n = targetParticleCount();
    for (let i = 0; i < n; i++) particles.push(createParticle());
  }

  // ---- Events ----
  window.addEventListener("resize", () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    // Rebalance count on resize
    const desired = targetParticleCount();
    if (desired > particles.length) {
      for (let i = particles.length; i < desired; i++) particles.push(createParticle());
    } else if (desired < particles.length) {
      particles.length = desired;
    }
  });

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });

  window.addEventListener("mouseleave", () => {
    mouse.active = false;
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // ---- Update & Draw ----
  function step() {
    ctx.clearRect(0, 0, w, h);

    // Optional: draw link lines first (so particles appear above them)
    if (CONFIG.linkRadius > 0) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = CONFIG.linkColor;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          const r = CONFIG.linkRadius;
          if (d2 < r * r) {
            const alpha = 1 - Math.sqrt(d2) / r; // fade with distance
            ctx.globalAlpha = alpha * 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    // Update each particle
    for (let p of particles) {
      // Gentle spring back to home
      p.vx += (p.homeX - p.x) * CONFIG.springHome;
      p.vy += (p.homeY - p.y) * CONFIG.springHome;

      // Random drift so it doesn't feel static
      p.vx += rand(-CONFIG.drift, CONFIG.drift);
      p.vy += rand(-CONFIG.drift, CONFIG.drift);

      // Mouse attraction
      if (mouse.active) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < CONFIG.attractRadius) {
          const force = (1 - dist / CONFIG.attractRadius) * CONFIG.attractStrength;
          p.vx += (dx / (dist || 1)) * force;
          p.vy += (dy / (dist || 1)) * force;
        }
      }

      // Clamp speed
      const speed = Math.hypot(p.vx, p.vy);
      if (speed > CONFIG.maxSpeed) {
        p.vx = (p.vx / speed) * CONFIG.maxSpeed;
        p.vy = (p.vy / speed) * CONFIG.maxSpeed;
      }

      // Integrate
      p.x += p.vx;
      p.y += p.vy;

      // Soft wrap around edges
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;

      // Draw
      ctx.beginPath();
      ctx.fillStyle = CONFIG.particleColor;
      ctx.globalAlpha = CONFIG.particleOpacity;
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    requestAnimationFrame(step);
  }

  // Kickoff
  initParticles();
  requestAnimationFrame(step);
})();
