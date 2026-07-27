"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // Animation delay in ms
  staggerIndex?: number; // Automatic stagger index multiplier (e.g. 0, 1, 2, 3)
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = "",
  delay = 0,
  staggerIndex = 0
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -40px 0px"
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  const calculatedDelay = delay + staggerIndex * 90; // 90ms stagger per item

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${calculatedDelay}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)"
      }}
      className={`transition-all duration-700 transform ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-10 scale-95"
      } ${className}`}
    >
      {children}
    </div>
  );
};
