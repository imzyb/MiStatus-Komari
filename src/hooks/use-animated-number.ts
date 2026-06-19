"use client";

import { useEffect, useRef, useState } from "react";

export function useAnimatedNumber(target: number, duration = 400, minDelta = 1): number {
  const [current, setCurrent] = useState(target);
  const prevRef = useRef(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    if (from === to) return;
    if (Math.abs(to - from) < minDelta) {
      prevRef.current = to;
      setCurrent(to);
      return;
    }

    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        prevRef.current = to;
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, minDelta]);

  return current;
}