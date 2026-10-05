"use client";

import { useEffect, useRef } from "react";
import "./slider.css";

export default function LiquidSliderPage() {
  const sliderRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = "light";
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, []);

  // Polyfill scroll-driven animation for the slider
  useEffect(() => {
    const slider = sliderRef.current;
    const input = inputRef.current;
    if (!slider || !input) return;

    const supportsScrollTimeline =
      CSS.supports("(animation-timeline: view()) and (animation-range: 0 100%)");

    if (!supportsScrollTimeline) {
      const sync = () => {
        const val =
          (Number(input.value) - Number(input.min)) /
          (Number(input.max) - Number(input.min));
        const percentComplete = val * 100;

        let liquidValue: number;
        if (percentComplete <= 10) {
          liquidValue = (percentComplete / 10) * 60;
        } else if (percentComplete <= 90) {
          liquidValue = 60;
        } else {
          liquidValue = 60 + ((percentComplete - 90) / 10) * 40;
        }

        slider.style.setProperty(
          "--slider-complete",
          String(Math.round(percentComplete)),
        );
        slider.style.setProperty(
          "--slider-liquid",
          String(Math.round(liquidValue)),
        );
      };

      const handlePointerDown = (e: PointerEvent) => {
        const { left, width } = input.getBoundingClientRect();
        const range = Number(input.max) - Number(input.min);
        const ratio = (e.clientX - left) / width;
        input.value = String(
          Number(input.min) + Math.floor(range * ratio),
        );
        sync();
      };

      input.addEventListener("input", sync);
      input.addEventListener("pointerdown", handlePointerDown);
      input.value = String(Math.floor(Math.random() * 100));
      sync();

      return () => {
        input.removeEventListener("input", sync);
        input.removeEventListener("pointerdown", handlePointerDown);
      };
    }
  }, []);

  // Delta tracking for squish on drag
  useEffect(() => {
    const input = inputRef.current;
    const slider = sliderRef.current;
    if (!input || !slider) return;

    const DELTA_CAP = 5;

    const syncDelta = (e: PointerEvent) => {
      slider.dataset.sliding = "true";
      slider.style.setProperty(
        "--delta",
        String(Math.min(Math.abs(e.movementX), DELTA_CAP)),
      );
    };

    const deSyncDelta = () => {
      slider.style.setProperty("--delta", "0");
      slider.dataset.sliding = "false";
      slider.dataset.active = "false";
      document.body.removeEventListener("pointermove", syncDelta);
      document.body.removeEventListener("pointerup", deSyncDelta);
      document.body.removeEventListener("pointercancel", deSyncDelta);
    };

    const handleDown = () => {
      slider.dataset.active = "true";
      document.body.addEventListener("pointermove", syncDelta);
      document.body.addEventListener("pointerup", deSyncDelta);
      document.body.addEventListener("pointercancel", deSyncDelta);
    };

    const handleBounce = async () => {
      const existingBounce = slider
        .getAnimations({ subtree: true })
        .find((a) => (a as CSSAnimation).animationName === "bounce");

      if (input.value === input.max && !existingBounce) {
        slider.dataset.bounce = "top";
        const anim = slider
          .getAnimations({ subtree: true })
          .find((a) => (a as CSSAnimation).animationName === "bounce");
        if (anim) await anim.finished;
        delete slider.dataset.bounce;
      } else if (input.value === input.min && !existingBounce) {
        slider.dataset.bounce = "bottom";
        const anim = slider
          .getAnimations({ subtree: true })
          .find((a) => (a as CSSAnimation).animationName === "bounce");
        if (anim) await anim.finished;
        delete slider.dataset.bounce;
      }
    };

    input.addEventListener("pointerdown", handleDown);
    input.addEventListener("input", handleBounce);

    return () => {
      input.removeEventListener("pointerdown", handleDown);
      input.removeEventListener("input", handleBounce);
    };
  }, []);

  return (
    <div
      className="liquid-page"
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        background: "light-dark(#fff, #000)",
      }}
    >
      <main style={{ display: "grid", gap: "2rem" }}>
        <div className="slider" ref={sliderRef}>
          {/* Sun icons */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="slider-icon slider-icon--small"
          >
            <path d="M8 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 1ZM10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM12.95 4.11a.75.75 0 1 0-1.06-1.06l-1.062 1.06a.75.75 0 0 0 1.061 1.062l1.06-1.061ZM15 8a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 15 8ZM11.89 12.95a.75.75 0 0 0 1.06-1.06l-1.06-1.062a.75.75 0 0 0-1.062 1.061l1.061 1.06ZM8 12a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 12ZM5.172 11.89a.75.75 0 0 0-1.061-1.062L3.05 11.89a.75.75 0 1 0 1.06 1.06l1.06-1.06ZM4 8a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 4 8ZM4.11 5.172A.75.75 0 0 0 5.173 4.11L4.11 3.05a.75.75 0 1 0-1.06 1.06l1.06 1.06Z" />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="slider-icon slider-icon--large"
          >
            <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" />
          </svg>

          {/* Knockout layer */}
          <div className="knockout">
            <div className="slider__fill" />
            <div className="indicator indicator--masked">
              <div className="mask" />
            </div>
          </div>

          {/* Slider track + liquid indicator */}
          <div className="slider__track">
            <label htmlFor="liquid-slider" className="sr-only">
              Slider
            </label>
            <input
              ref={inputRef}
              tabIndex={0}
              type="range"
              id="liquid-slider"
              min="0"
              max="100"
              step="1"
            />
            <div className="indicator__liquid">
              <div className="shadow" />
              <div className="wrapper">
                <div className="liquids liquids--track">
                  <div className="liquid__shadow" />
                  <div className="liquid__track" />
                </div>
                <div className="liquids liquids--fill">
                  <div className="liquid__shadow" />
                  <div className="liquid__track" />
                </div>
              </div>
              <div className="cover" />
            </div>
          </div>
        </div>
      </main>

      {/* SVG filters */}
      <svg
        className="sr-only"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", width: 0, height: 0 }}
      >
        <defs>
          <filter id="goo">
            <feGaussianBlur
              result="blur"
              in="SourceGraphic"
              stdDeviation="2"
            />
            <feColorMatrix
              in="blur"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 16 -10
              "
              type="matrix"
            />
          </filter>
          <filter id="remove-black" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      -255 -255 -255 0 1"
              result="black-pixels"
            />
            <feMorphology
              in="black-pixels"
              operator="dilate"
              radius="0.5"
              result="smoothed"
            />
            <feComposite in="SourceGraphic" in2="smoothed" operator="out" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
