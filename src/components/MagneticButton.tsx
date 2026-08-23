import React, { useRef, useState, useEffect, type CSSProperties, type ReactNode, type MouseEvent } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

const RANGE_PER_POINT = 18;
const MAX_PULL = 0.5;

export interface BorderOptions {
  color: string;
  width: number;
}

export interface MagneticButtonProps {
  label?: string;
  link?: string;
  newTab?: boolean;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  children?: ReactNode;
  icon?: ReactNode;
  font?: CSSProperties;
  fill?: string;
  textColor?: string;
  sweepColor?: string;
  sweepTextColor?: string;
  radius?: number;
  magnet?: number;
  paddingX?: number;
  paddingY?: number;
  transition?: any;
  border?: boolean;
  borderOptions?: BorderOptions;
  style?: CSSProperties;
  className?: string;
}

export default function MagneticButton({
  label = 'Magnetic Hover',
  link = '',
  newTab = false,
  onClick,
  children,
  icon,
  font = {
    fontFamily: 'inherit',
    fontWeight: 700,
    fontSize: 14,
    lineHeight: '1em',
    letterSpacing: '-0.01em',
    textAlign: 'center',
  },
  fill = '#FFFFFF',
  textColor = '#000000',
  sweepColor = '#27272A',
  sweepTextColor = '#FFFFFF',
  paddingX = 36,
  paddingY = 18,
  radius = 100,
  magnet = 10,
  transition = {
    type: 'tween',
    stiffness: 800,
    damping: 60,
    mass: 1,
    ease: 'easeInOut',
    duration: 0.3,
  },
  border = true,
  borderOptions = { color: '#FFFFFF', width: 1 },
  style,
  className = '',
}: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement & HTMLButtonElement>(null);
  const [hover, setHover] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0, d: 0 });
  const hoverRef = useRef(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.4 });

  const borderColor = borderOptions?.color ?? '#FFFFFF';
  const borderWidth = border ? borderOptions?.width ?? 0 : 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const node = el;

    const pull = (magnet / 20) * MAX_PULL;
    const reach = magnet * RANGE_PER_POINT;

    function onMove(event: PointerEvent) {
      const rect = node.getBoundingClientRect();
      const cx = rect.left + rect.width / 2 - sx.get();
      const cy = rect.top + rect.height / 2 - sy.get();

      const dx = event.clientX - cx;
      const dy = event.clientY - cy;

      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      const edgeX = Math.max(0, Math.abs(dx) - rect.width / 2);
      const edgeY = Math.max(0, Math.abs(dy) - rect.height / 2);
      const gap = Math.hypot(edgeX, edgeY);

      if (inside !== hoverRef.current) {
        const lx = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
        const ly = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
        const d = 2 * Math.hypot(rect.width, rect.height);
        setOrigin({ x: lx, y: ly, d });
        hoverRef.current = inside;
        setHover(inside);
      }

      if (gap > reach) {
        x.set(0);
        y.set(0);
        return;
      }
      const falloff = reach === 0 ? 0 : 1 - gap / reach;
      x.set(dx * pull * falloff);
      y.set(dy * pull * falloff);
    }

    function onLeave() {
      x.set(0);
      y.set(0);
      hoverRef.current = false;
      setHover(false);
    }

    window.addEventListener('pointermove', onMove);
    document.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, [magnet, x, y, sx, sy]);

  const handleClick = (e: MouseEvent<HTMLElement>) => {
    if (onClick) {
      onClick(e);
    }
  };

  const combinedStyles: CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxSizing: 'border-box',
    padding: `${paddingY}px ${paddingX}px`,
    borderRadius: radius,
    background: fill,
    border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : 'none',
    cursor: 'pointer',
    overflow: 'hidden',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    boxShadow: hover
      ? '0 16px 40px rgba(0,0,0,0.5), 0 0 25px rgba(255,255,255,0.15)'
      : '0 8px 22px rgba(0,0,0,0.3)',
    ...font,
    ...style,
  };

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={handleClick}
      style={{
        ...combinedStyles,
        x: sx,
        y: sy,
      }}
      className={`select-none ${className}`}
    >
      <motion.span
        aria-hidden
        initial={false}
        animate={{ scale: hover ? 1 : 0 }}
        transition={transition}
        style={{
          position: 'absolute',
          top: origin.y,
          left: origin.x,
          width: origin.d,
          height: origin.d,
          marginLeft: -origin.d / 2,
          marginTop: -origin.d / 2,
          borderRadius: '50%',
          background: sweepColor,
          transformOrigin: 'center',
          pointerEvents: 'none',
        }}
      />
      <motion.span
        initial={false}
        animate={{ color: hover ? sweepTextColor : textColor }}
        transition={transition}
        style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
      >
        {children || label}
        {icon}
      </motion.span>
    </motion.button>
  );
}
