"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseX: number;
  baseY: number;
}

export default function DotMatrixCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkTheme = !mounted || theme !== "light";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initDots();
    };

    window.addEventListener("resize", handleResize);

    const dots: Dot[] = [];
    const dotSpacing = 42;
    const maxConnectDistance = 95;

    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    function initDots() {
      dots.length = 0;
      const cols = Math.ceil(width / dotSpacing) + 1;
      const rows = Math.ceil(height / dotSpacing) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * dotSpacing;
          const y = j * dotSpacing;
          dots.push({
            x,
            y,
            baseX: x,
            baseY: y,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            radius: Math.random() * 1.2 + 0.8,
          });
        }
      }
    }

    initDots();

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Read theme from document element class list
      const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

      // VentureIQ Lime in dark mode, slate-900/black in light mode
      const dotColor = isDark ? "rgba(176, 212, 73, " : "rgba(15, 23, 42, ";
      const lineColor = isDark ? "rgba(176, 212, 73, " : "rgba(15, 23, 42, ";
      const dotAlphaMult = isDark ? 1 : 0.6; // Subtle slate-900 is very visible, so we use lower multiplier
      const lineAlphaMult = isDark ? 1 : 0.5;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        dot.x += dot.vx;
        dot.y += dot.vy;

        if (Math.abs(dot.x - dot.baseX) > 12) dot.vx *= -1;
        if (Math.abs(dot.y - dot.baseY) > 12) dot.vy *= -1;

        const dx = mouseX - dot.x;
        const dy = mouseY - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mouseRadius = 130;

        if (dist < mouseRadius) {
          const angle = Math.atan2(dy, dx);
          const force = (mouseRadius - dist) / mouseRadius;
          dot.x -= Math.cos(angle) * force * 12;
          dot.y -= Math.sin(angle) * force * 12;
        } else {
          dot.x += (dot.baseX - dot.x) * 0.04;
          dot.y += (dot.baseY - dot.y) * 0.04;
        }

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, isDark ? dot.radius : dot.radius * 1.3, 0, Math.PI * 2);
        ctx.fillStyle = `${dotColor}${0.25 * dotAlphaMult})`;
        ctx.fill();
      }

      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const d1 = dots[i];
          const d2 = dots[j];
          const dx = d1.x - d2.x;
          const dy = d1.y - d2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectDistance) {
            const alpha = (1 - dist / maxConnectDistance) * 0.12 * lineAlphaMult;
            ctx.beginPath();
            ctx.moveTo(d1.x, d1.y);
            ctx.lineTo(d2.x, d2.y);
            ctx.strokeStyle = `${lineColor}${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const dx = mouseX - dot.x;
        const dy = mouseY - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 140) {
          const alpha = (1 - dist / 140) * 0.35 * lineAlphaMult;
          ctx.beginPath();
          ctx.moveTo(dot.x, dot.y);
          ctx.lineTo(mouseX, mouseY);
          ctx.strokeStyle = `${lineColor}${alpha})`;
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-300 ${
        isDarkTheme ? "opacity-70" : "opacity-100"
      }`}
    />
  );
}
