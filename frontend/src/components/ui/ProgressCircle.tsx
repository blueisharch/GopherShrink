import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface ProgressCircleProps {
  pct: number;          // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function ProgressCircle({
  pct,
  size = 48,
  strokeWidth = 4,
  color = '#22c55e',
}: ProgressCircleProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;

  useEffect(() => {
    if (!circleRef.current) return;
    const offset = circumference - (pct / 100) * circumference;
    gsap.to(circleRef.current, {
      strokeDashoffset: offset,
      duration: 1.1,
      ease: 'elastic.out(1, 0.5)',
    });
  }, [pct, circumference]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        ref={circleRef}
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
      />
    </svg>
  );
}
