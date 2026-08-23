import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'motion/react';

export interface SmoothCursorProps {
  cursor?: React.ReactNode;
  springConfig?: { damping: number; stiffness: number; mass: number };
}

export function SmoothCursor({
  cursor,
  springConfig = { damping: 28, stiffness: 350, mass: 0.12 },
}: SmoothCursorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Disable on touch devices
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.closest('button') ||
          target.closest('a') ||
          target.closest("[role='button']") ||
          window.getComputedStyle(target).cursor === 'pointer')
      ) {
        setIsPointer(true);
      } else {
        setIsPointer(false);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible, mouseX, mouseY]);

  if (!isVisible) return null;

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-[99999] hidden md:block"
      style={{
        x: smoothX,
        y: smoothY,
        translateX: '-50%',
        translateY: '-50%',
      }}
    >
      {cursor || (
        <div className="relative flex items-center justify-center">
          {/* Subtle luminous halo */}
          <motion.div
            animate={{
              scale: isPointer ? 1.6 : 1,
              opacity: isPointer ? 0.9 : 0.45,
            }}
            transition={{ duration: 0.15 }}
            className="h-8 w-8 rounded-full border border-white/50 bg-white/10 backdrop-blur-[1px] shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          />
          {/* Specular center target */}
          <motion.div
            animate={{
              scale: isPointer ? 0.6 : 1,
            }}
            className="absolute h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,1)]"
          />
        </div>
      )}
    </motion.div>
  );
}

export function SmoothCursorDemo() {
  return (
    <>
      <span className="hidden md:block">Move your mouse around</span>
      <span className="block md:hidden">
        SmoothCursor is disabled on touch devices
      </span>
      <SmoothCursor />
    </>
  );
}
