import React, { useEffect, useRef } from 'react';

/**
 * CosmicDotsCanvas creates the exact celestial particle & gravitational dot-matrix
 * field inspired by Google Antigravity & futuristic DeepMind aesthetics.
 */
export default function CosmicDotsCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse tracking for subtle interactive gravitational pull
    let mouse = { x: width * 0.7, y: height * 0.5, active: false };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 1. Ambient Background Stars
    const starCount = 140;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.4,
      alpha: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.005 + 0.002,
      phase: Math.random() * Math.PI * 2
    }));

    // 2. Gravitational Cosmic Dot Matrix (Elliptical / Spiral Petals)
    // As seen in Google Antigravity: layers of curved dots expanding outward
    const ringCount = 28;
    const dotsPerRing = 48;
    const totalDots = ringCount * dotsPerRing;
    const orbitDots = [];

    for (let r = 0; r < ringCount; r++) {
      const radiusBase = 60 + r * 15;
      for (let d = 0; d < dotsPerRing; d++) {
        const angleBase = (d / dotsPerRing) * Math.PI * 2;
        orbitDots.push({
          ringIndex: r,
          dotIndex: d,
          angle: angleBase,
          baseRadius: radiusBase,
          size: 1.2 + (r / ringCount) * 1.8,
          // Colors ranging from electric cyan to vibrant Google blue and soft indigo
          color: r % 3 === 0 ? '#60a5fa' : r % 3 === 1 ? '#38bdf8' : '#818cf8',
          alpha: 0.25 + (r / ringCount) * 0.65,
          offsetPhase: r * 0.15 + d * 0.05
        });
      }
    }

    let time = 0;

    const render = () => {
      time += 0.012;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // --- Draw Ambient Stars ---
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        const flicker = Math.sin(time * 2 + star.phase) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * flicker})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- Draw Celestial Gravitational Dot Mesh ---
      // Origin centered slightly to the right (like the reference image)
      const centerX = width > 768 ? width * 0.68 : width * 0.5;
      const centerY = height > 768 ? height * 0.48 : height * 0.45;

      for (let i = 0; i < orbitDots.length; i++) {
        const dot = orbitDots[i];

        // Harmonic breathing wave + petal modulation
        const angle = dot.angle + time * 0.08 + Math.sin(time * 0.5 + dot.ringIndex * 0.2) * 0.05;
        
        // Flower / Elliptical deformation matching Google Antigravity screenshot
        const deformation = 1 + 0.28 * Math.cos(2 * angle + dot.offsetPhase * 0.5);
        const currentRadius = dot.baseRadius * deformation;

        // Position on tilted ellipse
        let x = centerX + Math.cos(angle) * currentRadius * 1.35;
        let y = centerY + Math.sin(angle) * currentRadius * 0.95;

        // Subtle interactive mouse repulsion/attraction
        if (mouse.active) {
          const dx = mouse.x - x;
          const dy = mouse.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const force = (1 - dist / 180) * 18;
            x -= (dx / dist) * force;
            y -= (dy / dist) * force;
          }
        }

        // Dot glow & rendering
        const pulse = Math.sin(time * 1.5 + dot.offsetPhase) * 0.25 + 0.75;
        ctx.fillStyle = dot.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(1, dot.alpha * pulse));

        // Soft outer glow for outer larger dots
        if (dot.size > 2) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = dot.color;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.arc(x, y, dot.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: '#000000' }}
    />
  );
}
