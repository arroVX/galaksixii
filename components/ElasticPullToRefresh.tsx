"use client";

import React, { useState, useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";

interface ElasticPullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
}

export const ElasticPullToRefresh: React.FC<ElasticPullToRefreshProps> = ({ children, onRefresh }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Spring physics variables
  const springPosRef = useRef(0);
  const springVelRef = useRef(0);

  const MAX_PULL = 160;
  const THRESHOLD = 100;

  // Spring Rubber-Band Snap Back Animation Physics
  const animateSnapBack = () => {
    const stiffness = 0.18;
    const damping = 0.72;

    const loop = () => {
      const force = -stiffness * springPosRef.current;
      springVelRef.current = (springVelRef.current + force) * damping;
      springPosRef.current += springVelRef.current;

      setPullDistance(Math.max(0, springPosRef.current));

      if (Math.abs(springPosRef.current) > 0.5 || Math.abs(springVelRef.current) > 0.5) {
        animationFrameRef.current = requestAnimationFrame(loop);
      } else {
        setPullDistance(0);
        springPosRef.current = 0;
        springVelRef.current = 0;
      }
    };

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(loop);
  };

  const triggerRefresh = async () => {
    setIsRefreshing(true);
    animateSnapBack();

    try {
      await onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  };

  // Touch & Mouse Event Handlers
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0) {
        startYRef.current = e.touches[0].clientY;
        currentYRef.current = e.touches[0].clientY;
        setIsDragging(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging && window.scrollY > 0) return;

      const currentY = e.touches[0].clientY;
      const dy = currentY - startYRef.current;

      if (dy > 0 && window.scrollY <= 0) {
        // Logarithmic elastic tension factor (fabric resistance)
        const resistance = 0.45;
        const dist = Math.min(MAX_PULL, dy * resistance);
        setPullDistance(dist);
        springPosRef.current = dist;
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);

      if (springPosRef.current >= THRESHOLD) {
        void triggerRefresh();
      } else {
        animateSnapBack();
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  // Render 3D Cloth Deformation Mesh on Canvas2D / WebGL Shader Context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId: number;

    const renderClothDeformation = () => {
      const width = canvas.width = window.innerWidth;
      const height = canvas.height = Math.max(180, pullDistance * 2);

      ctx.clearRect(0, 0, width, height);

      if (pullDistance > 2) {
        // Draw Deformed Fabric Tension Mesh & Shadows
        const centerX = width / 2;
        const pullY = pullDistance;

        // 1. Soft-body Depth Shadow underneath deformed lycra curve
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(centerX, pullY * 1.35, width, 0);
        ctx.fillStyle = "rgba(15, 23, 42, 0.08)";
        ctx.fill();

        // 2. Main Elastic Fabric Deformation Curve (Hyperbolic Catenary Curve)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(centerX, pullY * 1.15, width, 0);
        ctx.lineTo(width, 0);
        ctx.lineTo(0, 0);
        
        // Fabric Gradient (#F8F8F6 warm lycra texture)
        const clothGrad = ctx.createLinearGradient(0, 0, 0, pullY);
        clothGrad.addColorStop(0, "rgba(248, 248, 246, 0.98)");
        clothGrad.addColorStop(1, "rgba(238, 238, 234, 0.95)");
        ctx.fillStyle = clothGrad;
        ctx.fill();

        // Fabric Outline Curve
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "rgba(15, 23, 42, 0.15)";
        ctx.stroke();

        // 3. Render 3D Touch Finger Node Pushing Down at Center
        const touchR = 18;
        const touchY = pullY * 0.75;

        // 3D Pressing Spherical Finger Node Shadow & Glow
        ctx.beginPath();
        ctx.arc(centerX, touchY + 4, touchR + 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(15, 23, 42, 0.12)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(centerX, touchY, touchR, 0, Math.PI * 2);
        const nodeGrad = ctx.createRadialGradient(centerX - 4, touchY - 4, 2, centerX, touchY, touchR);
        nodeGrad.addColorStop(0, "#334155");
        nodeGrad.addColorStop(1, "#0F172A");
        ctx.fillStyle = nodeGrad;
        ctx.fill();

        // White Inner Ring / Touch Core
        ctx.beginPath();
        ctx.arc(centerX, touchY, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
      }

      frameId = requestAnimationFrame(renderClothDeformation);
    };

    renderClothDeformation();

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [pullDistance]);

  return (
    <div className="relative w-full min-h-screen">
      
      {/* Top 3D Canvas Cloth Mesh Overlay */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed top-0 left-0 right-0 z-50 w-full"
        style={{ height: `${Math.max(0, pullDistance * 1.4)}px` }}
      />

      {/* Refresh Loading Badge */}
      {isRefreshing && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top-5">
          <RefreshCw size={15} className="animate-spin text-amber-400" />
          <span>Memperbarui Katalog Merchandise...</span>
        </div>
      )}

      {/* Main Layout Container with Rubber-Band Y Shift */}
      <div
        style={{
          transform: `translate3d(0, ${pullDistance}px, 0)`,
          transition: isDragging ? "none" : "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {children}
      </div>

    </div>
  );
};
