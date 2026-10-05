"use client";

import { useCallback, useEffect, useRef } from "react";

const STIFFNESS = 180;
const DAMPING = 22;
const MAX_TILT = 25;

export function useTilt() {
  const tiltRef = useRef({ angle: 0, velocity: 0 });
  const frameRef = useRef(0);
  const runningRef = useRef(false);
  const elRef = useRef<HTMLDivElement>(null);

  const start = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;

    let lastTime = performance.now();

    function tick(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const tilt = tiltRef.current;
      tilt.velocity += (-STIFFNESS * tilt.angle - DAMPING * tilt.velocity) * dt;
      tilt.angle += tilt.velocity * dt;
      tilt.angle = Math.max(-MAX_TILT, Math.min(MAX_TILT, tilt.angle));

      if (elRef.current) {
        elRef.current.style.transform = `translate(-50%, calc(-100% - 22px)) rotate(${tilt.angle.toFixed(2)}deg)`;
      }

      if (Math.abs(tilt.angle) > 0.01 || Math.abs(tilt.velocity) > 0.1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        tilt.angle = 0;
        tilt.velocity = 0;
        runningRef.current = false;
        if (elRef.current) {
          elRef.current.style.transform =
            "translate(-50%, calc(-100% - 22px))";
        }
      }
    }

    frameRef.current = requestAnimationFrame(tick);
  }, []);

  const addVelocity = useCallback(
    (v: number) => {
      tiltRef.current.velocity += v;
      start();
    },
    [start],
  );

  useEffect(() => {
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return { elRef, addVelocity };
}
