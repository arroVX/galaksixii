"use client";

import React, { useEffect, useRef } from "react";

export const DotMatrixBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = { x: -1000, y: -1000 };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const spacing = 32; // Distance between dots
    const baseRadius = 1.2; // Size of each dot
    const hoverRadius = 2.5; // Size of dot when hovered
    const hoverDistance = 180; // Distance of mouse effect

    let step = 0;

    const render = () => {
      step += 0.015;
      ctx.clearRect(0, 0, width, height);

      const cols = Math.ceil(width / spacing);
      const rows = Math.ceil(height / spacing);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing + 16;
          const y = j * spacing + 16;

          // Wave equation for organic dot matrix pulse
          const distanceFactor = Math.sin(step + i * 0.15 + j * 0.15);
          
          // Calculate distance to mouse
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const distToMouse = Math.sqrt(dx * dx + dy * dy);
          
          let alpha = 0.06 + (distanceFactor + 1) * 0.05; // Range between 0.06 and 0.16
          let radius = baseRadius;

          // Mouse hover effect
          if (distToMouse < hoverDistance) {
            const intensity = 1 - Math.pow(distToMouse / hoverDistance, 1.5);
            alpha += intensity * 0.4; // Max add 0.4 alpha
            radius += intensity * (hoverRadius - baseRadius);
          }

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-background/40 to-background opacity-90" />
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[-2] opacity-100"
      />
    </>
  );
};
