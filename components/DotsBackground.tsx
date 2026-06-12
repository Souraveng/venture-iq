"use client";
import React, { useEffect, useRef } from "react";

export default function DotsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      baseVx: number;
      baseVy: number;
    }> = [];

    // 150 particles covering the full viewport
    const particleCount = 150;

    for (let i = 0; i < particleCount; i++) {
      const vx = (Math.random() - 0.5) * 0.4;
      const vy = (Math.random() - 0.5) * 0.4;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx,
        vy,
        baseVx: vx,
        baseVy: vy,
        radius: Math.random() * 1.5 + 0.6,
      });
    }

    // Mouse position tracking
    const mouse = {
      x: -9999,
      y: -9999,
      isActive: false,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.isActive = true;
    };

    const handleMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
      mouse.isActive = false;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const maxConnectionDist = 100;
      const repelRadius = 130;

      // Draw particle-to-particle connections
      ctx.strokeStyle = "rgba(218, 242, 100, 0.04)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectionDist) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particle-to-mouse connections
      if (mouse.isActive) {
        particles.forEach((p) => {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.15;
            ctx.strokeStyle = `rgba(218, 242, 100, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        });
      }

      // Update and draw particles
      particles.forEach((p) => {
        // Apply mouse interaction (repulsion)
        if (mouse.isActive) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < repelRadius) {
            const force = (repelRadius - dist) / repelRadius;
            const angle = Math.atan2(dy, dx);
            
            // Push away
            p.x += Math.cos(angle) * force * 2.0;
            p.y += Math.sin(angle) * force * 2.0;
          }
        }

        // Return slowly to base velocity if deflected
        p.vx += (p.baseVx - p.vx) * 0.05;
        p.vy += (p.baseVy - p.vy) * 0.05;

        p.x += p.vx;
        p.y += p.vy;

        // Bounce on boundaries
        if (p.x < 0) {
          p.x = 0;
          p.vx *= -1;
          p.baseVx *= -1;
        } else if (p.x > width) {
          p.x = width;
          p.vx *= -1;
          p.baseVx *= -1;
        }

        if (p.y < 0) {
          p.y = 0;
          p.vy *= -1;
          p.baseVy *= -1;
        } else if (p.y > height) {
          p.y = height;
          p.vy *= -1;
          p.baseVy *= -1;
        }

        ctx.fillStyle = "rgba(218, 242, 100, 0.4)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
