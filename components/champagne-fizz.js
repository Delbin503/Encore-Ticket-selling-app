"use client";

import { useEffect, useRef } from "react";

// "Champagne Fizz" bubbles, adapted as a decorative background layer.
// The canvas is transparent (the page's cream colour shows through), sits behind
// all content, ignores clicks, and stays still for users who prefer reduced motion.
export default function ChampagneFizz() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const BUBBLE_RATE = 1.2; // bubbles per frame at 60fps
    const RISE_SPEED = 1.5;
    const MAX_BUBBLES = 450;
    const MAX_SPARKLES = 160;
    const NUM_SITES = 12;

    let width = 0;
    let height = 0;
    let bubbles = [];
    let sparkles = [];
    let sites = [];
    let mouseX = 0;
    let mouseY = 0;
    let mouseActive = false;
    let lastTime = 0;
    let spawnAccumulator = 0;
    let frame = 0;
    let hero = null;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sites = [];
      for (let i = 0; i < NUM_SITES; i++) {
        sites.push({
          x: width * 0.1 + width * 0.8 * (i / (NUM_SITES - 1)) + (Math.random() - 0.5) * 40,
          jitter: Math.random() * 20,
        });
      }
    }

    function spawnBubble() {
      if (bubbles.length >= MAX_BUBBLES) return;
      let x;
      if (Math.random() < 0.7) {
        const site = sites[Math.floor(Math.random() * sites.length)];
        x = site.x + (Math.random() - 0.5) * site.jitter;
      } else {
        x = Math.random() * width;
      }
      const roll = Math.random();
      let radius;
      if (roll < 0.55) radius = 1 + Math.random() * 2;
      else if (roll < 0.85) radius = 2.5 + Math.random() * 3;
      else if (roll < 0.96) radius = 5 + Math.random() * 4;
      else radius = 8 + Math.random() * 5;
      bubbles.push({
        x,
        y: height + radius,
        radius,
        baseRadius: radius,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleFreq: 1.5 + Math.random() * 1.5,
        wobbleAmp: (0.3 + Math.random() * 0.7) * radius,
        speedMult: 0.7 + Math.random() * 0.6,
        opacity: 0.45 + Math.random() * 0.4,
        age: 0,
        pulseRate: 2 + Math.random() * 2,
      });
    }

    function spawnSparkle(x, y, bubbleRadius) {
      const count = Math.min(8, Math.floor(3 + bubbleRadius * 0.8));
      for (let i = 0; i < count; i++) {
        if (sparkles.length >= MAX_SPARKLES) return;
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = 0.5 + Math.random() * 2 + bubbleRadius * 0.15;
        sparkles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.5,
          life: 1,
          decay: 0.02 + Math.random() * 0.03,
          size: 0.5 + Math.random() * 1.5 + bubbleRadius * 0.1,
        });
      }
    }

    const surfaceY = () => height * 0.04;

    function update(dt) {
      const top = surfaceY();
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.age += dt;
        const sizeFactor = 0.6 + 0.4 * Math.min(b.baseRadius / 10, 1);
        b.y -= RISE_SPEED * b.speedMult * sizeFactor * dt * 60;
        b.wobblePhase += b.wobbleFreq * dt;
        b.x += Math.sin(b.wobblePhase) * b.wobbleAmp * dt * 2;
        if (mouseActive) {
          const dx = b.x - mouseX;
          const dy = b.y - mouseY;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > 1 && d < 180) {
            let push = 1 - d / 180;
            push *= push * 8 * dt * 60;
            b.x += (dx / d) * push;
            b.y += (dy / d) * push * 0.5;
          }
        }
        b.radius = b.baseRadius * (1 + 0.05 * Math.sin(b.age * b.pulseRate));
        b.radius *= 1 + (1 - b.y / height) * 0.15;
        if (b.y - b.radius <= top) {
          spawnSparkle(b.x, top, b.baseRadius);
          bubbles.splice(i, 1);
        } else if (b.x < -50 || b.x > width + 50) {
          bubbles.splice(i, 1);
        }
      }
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.x += s.vx * dt * 60;
        s.y += s.vy * dt * 60;
        s.vy += 0.02 * dt * 60;
        s.life -= s.decay * dt * 60;
        if (s.life <= 0) sparkles.splice(i, 1);
      }
    }

    // On the cream page bubbles are champagne gold; over the yellow hero they
    // blend to white with cobalt rims so they stay visible on yellow.
    const mix = (from, to, t) => from.map((v, i) => Math.round(v + (to[i] - v) * t)).join(",");
    const BLEND = 48; // px over which the colour changes at the hero's edges
    function heroAmount(y) {
      if (!hero) return 0;
      const inside = Math.min(y - hero.top, hero.bottom - y);
      return Math.max(0, Math.min(1, inside / BLEND + 0.5));
    }

    function drawBubble(b) {
      const r = b.radius;
      if (r < 0.5) return;
      const fade = Math.min(b.age * 3, 1);
      const a = b.opacity * fade;
      const t = heroAmount(b.y);
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${mix([214, 170, 92], [255, 255, 255], t)}, ${a * (0.22 + 0.33 * t)})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${mix([176, 128, 52], [25, 41, 213], t)}, ${a * (0.55 - 0.15 * t)})`;
      ctx.lineWidth = Math.max(0.6, r * 0.09);
      ctx.stroke();
      if (r > 1.5) {
        const hx = b.x - r * 0.25;
        const hy = b.y - r * 0.25;
        const hr = r * 0.65;
        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, b.y, r * 0.92, 0, Math.PI * 2);
        ctx.clip();
        const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
        g.addColorStop(0, `rgba(255, 250, 232, ${a * 0.85})`);
        g.addColorStop(0.35, `rgba(236, 200, 140, ${a * 0.35})`);
        g.addColorStop(1, "rgba(220, 180, 120, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(hx, hy, hr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (r > 3) {
          ctx.beginPath();
          ctx.arc(b.x - r * 0.3, b.y - r * 0.35, Math.max(0.8, r * 0.12), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 250, ${a * 0.9})`;
          ctx.fill();
        }
      }
    }

    function drawSparkles() {
      for (const s of sparkles) {
        const size = s.size * s.life;
        const glowR = size * 3;
        ctx.save();
        ctx.globalAlpha = s.life * 0.9;
        ctx.translate(s.x, s.y);
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR);
        glow.addColorStop(0, "rgba(255, 236, 190, 0.9)");
        glow.addColorStop(0.35, "rgba(214, 166, 90, 0.35)");
        glow.addColorStop(1, "rgba(200, 149, 108, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, glowR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function drawStreams(time) {
      for (let i = 0; i < 5; i++) {
        const sx = width * (0.15 + 0.7 * (i / 4)) + Math.sin(time * 0.3 + i * 2.1) * 30;
        const g = ctx.createLinearGradient(sx, height, sx, 0);
        g.addColorStop(0, "rgba(214, 170, 92, 0.05)");
        g.addColorStop(0.5, "rgba(214, 170, 92, 0.025)");
        g.addColorStop(1, "rgba(214, 170, 92, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(sx - 30, 0, 60, height);
      }
    }

    // The hero's yellow is painted here (full width, like its CSS backdrop) so
    // bubbles can rise through it. Once painted, the CSS backdrop is switched off.
    const butter =
      getComputedStyle(document.documentElement).getPropertyValue("--butter").trim() || "#fff2a9";
    function measureHero() {
      const el = document.querySelector(".hero");
      if (!el) {
        hero = null;
        return;
      }
      const rect = el.getBoundingClientRect();
      hero = { top: rect.top, bottom: rect.bottom };
    }

    function render(timestamp) {
      if (!lastTime) lastTime = timestamp;
      let dt = Math.min((timestamp - lastTime) / 1000, 0.05);
      lastTime = timestamp;
      if (reduceMotion.matches) dt = 0;
      ctx.clearRect(0, 0, width, height);
      measureHero();
      if (hero && hero.bottom > 0 && hero.top < height) {
        ctx.fillStyle = butter;
        ctx.fillRect(0, hero.top, width, hero.bottom - hero.top);
      }
      document.documentElement.classList.toggle("fizz-hero", !!hero);
      // Fewer bubbles on narrow screens so text stays easy to read on phones.
      const rate = BUBBLE_RATE * Math.max(0.35, Math.min(1, width / 1280));
      spawnAccumulator += rate * dt * 60;
      while (spawnAccumulator >= 1) {
        spawnBubble();
        spawnAccumulator -= 1;
      }
      update(dt);
      drawStreams(timestamp / 1000);
      bubbles.sort((a, b) => b.radius - a.radius);
      for (const b of bubbles) drawBubble(b);
      drawSparkles();
      frame = requestAnimationFrame(render);
    }

    // The canvas never receives pointer events, so track the pointer on the window:
    // bubbles drift away from the cursor without blocking clicks on the page.
    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      mouseActive = true;
    };
    const onLeave = () => {
      mouseActive = false;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      document.documentElement.classList.remove("fizz-hero");
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="champagne-fizz" aria-hidden="true" />;
}
