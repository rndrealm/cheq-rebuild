"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const DEPTH = 2;
const FLIP_DURATION = 500;
const LIFT_Y = 0;
const LIFT_Z = 0;

function CoinFace({
  src,
  size,
  alt,
}: {
  src: string;
  size: number;
  alt: string;
}) {
  return (
    <div
      className="absolute inset-0 rounded-full bg-[#f5f5f5] shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)]"
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="rounded-full"
        unoptimized
      />
    </div>
  );
}

function CoinEdge() {
  return (
    <>
      {Array.from({ length: DEPTH * 2 + 1 }, (_, i) => {
        const z = DEPTH - i;
        return (
          <div
            key={i}
            className="absolute inset-0 rounded-full bg-[#d4d4d4] backface-hidden"
            style={{ transform: `translateZ(${z}px)` }}
          />
        );
      })}
    </>
  );
}

export function CoinImage({
  src,
  fallback,
  size,
  alt = "",
  className,
}: {
  src?: string;
  fallback: string;
  size: number;
  alt?: string;
  className?: string;
}) {
  const resolved = src ?? fallback;
  const prevSrcRef = useRef(resolved);
  const flippedRef = useRef(false);
  const [restRotation, setRestRotation] = useState(0);
  const baseRotationRef = useRef(0);
  const animRef = useRef(0);
  const innerRef = useRef<HTMLDivElement>(null);
  const [frontSrc, setFrontSrc] = useState(resolved);
  const [backSrc, setBackSrc] = useState(resolved);

  useEffect(() => {
    if (resolved === prevSrcRef.current) return;
    if (flippedRef.current) {
      setFrontSrc(resolved);
    } else {
      setBackSrc(resolved);
    }
    flippedRef.current = !flippedRef.current;
    const startRotation = baseRotationRef.current;
    const endRotation = startRotation + 180;
    const start = performance.now();

    cancelAnimationFrame(animRef.current);
    function tick(now: number) {
      const t = Math.min((now - start) / FLIP_DURATION, 1);
      const ease = 1 - (1 - t) * (1 - t);
      const rot = startRotation + ease * 180;
      const arc = Math.sin(Math.pow(t, 0.6) * Math.PI);
      const ty = LIFT_Y * arc;
      const tz = LIFT_Z * arc;
      if (innerRef.current) {
        innerRef.current.style.transform = `translateY(${ty}px) translateZ(${tz}px) rotateY(${rot}deg)`;
      }
      if (t < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        baseRotationRef.current = endRotation;
        setRestRotation(endRotation);
      }
    }
    animRef.current = requestAnimationFrame(tick);
    prevSrcRef.current = resolved;
    return () => cancelAnimationFrame(animRef.current);
  }, [resolved]);

  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size, perspective: size * 4 }}
    >
      <div
        ref={innerRef}
        className="absolute inset-0 transform-3d"
        style={{ transform: `rotateY(${restRotation}deg)` }}
      >
        <CoinEdge />
        <div
          className="absolute inset-0 backface-hidden"
          style={{ transform: `translateZ(${DEPTH}px)` }}
        >
          <CoinFace src={frontSrc} size={size} alt={alt} />
        </div>
        <div
          className="absolute inset-0 backface-hidden"
          style={{ transform: `rotateY(180deg) translateZ(${DEPTH}px)` }}
        >
          <CoinFace src={backSrc} size={size} alt={alt} />
        </div>
      </div>
    </div>
  );
}
