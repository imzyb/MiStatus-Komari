"use client";

import React, { useEffect, useRef, useState } from "react";

interface LazyRenderProps {
  children: React.ReactNode;
  /** IO rootMargin，如 "200px 0px" 用于提前/延后挂载 */
  rootMargin?: string;
  /** 离开可视区域时是否卸载，默认 true */
  unmountOnExit?: boolean;
  /** 首次渲染是否立即挂载，默认 false */
  initiallyMounted?: boolean;
}

export const LazyRender: React.FC<LazyRenderProps> = ({
  children,
  rootMargin = "400px 0px",
  unmountOnExit = true,
  initiallyMounted = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState<boolean>(initiallyMounted);

  useEffect(() => {
    if (initiallyMounted) return;
    const element = containerRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setMounted(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          setMounted(true);
        } else if (unmountOnExit) {
          setMounted(false);
        }
      },
      { root: null, rootMargin, threshold: [0, 0.01, 0.1] }
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [rootMargin, unmountOnExit, initiallyMounted]);

  return <div ref={containerRef}>{mounted ? children : null}</div>;
};

LazyRender.displayName = "LazyRender";
