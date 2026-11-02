"use client";

import { Avatar } from "@/components/avatar";
import { AvatarEditor } from "@/components/home/avatar-editor";
import { useScrollInkProgress } from "@/components/home/scroll-ink";
import { AnimatePresence, useAnimate, useMotionValueEvent } from "motion/react";
import { useEffect, useRef, useState } from "react";

// Fires as the ink completes; re-arms once scrolled back below REARM
const TRIGGER = 0.999;
const REARM = 0.9;

// Crouch, jump, drop back into the line and squash on landing
const JUMP_DURATION = 0.95;
const JUMP_TIMES = [0, 0.14, 0.5, 0.82, 0.9, 1];
const BODY_KEYFRAMES = {
  y: [0, 4, -56, 0, 0, 0],
  scaleX: [1, 1.12, 0.94, 1, 1.14, 1],
  scaleY: [1, 0.86, 1.08, 1, 0.84, 1],
};
// Moments in the jump (s), for flips timed to it
const LIFT_OFF = JUMP_DURATION * JUMP_TIMES[1];
const APEX = JUMP_DURATION * JUMP_TIMES[2];
const LANDING = JUMP_DURATION * JUMP_TIMES[3];

// Scroll: a backflip over the jump
const BACKFLIP_KEYFRAMES = { rotate: [0, 0, -180, -360, -360, -360] };
// Colour change: a coin flip, three-quarters of a turn up to the apex (ending edge-on,
// where the colour swaps unseen) and the last quarter on the way down
const COIN_PERSPECTIVE = 300;
// Expression change: a quick bump so the face morph registers at this size
const POP_KEYFRAMES = { scale: [1, 1.12, 1] };

/**
 * The avatar inline in the ScrollInk text. Jumps, flips and drops back into place
 * when the scroll finishes inking the text. Click it to change its expression and
 * colour.
 */
export const InkAvatar = ({
  expressionIndex: initialExpression = 2,
  colorIndex: initialColor = 2,
  size = 64,
}: {
  expressionIndex?: number;
  colorIndex?: number;
  size?: number;
}) => {
  const progress = useScrollInkProgress();
  const [scope, animate] = useAnimate<HTMLButtonElement>();
  const flipRef = useRef<HTMLSpanElement>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const armed = useRef(true);
  // A jump is playing; others wait their turn rather than stacking
  const busy = useRef(false);

  const [open, setOpen] = useState(false);
  const [expression, setExpression] = useState(initialExpression);
  const [color, setColor] = useState(initialColor);
  // The colour picked in the editor, ahead of the avatar's, which swaps mid-flip
  const [pickedColor, setPickedColor] = useState(initialColor);

  // Plays the jump alongside a flip of the inner element
  const jump = async (flip: (el: HTMLSpanElement) => Promise<void>) => {
    const el = flipRef.current;
    if (busy.current || !el) return;
    busy.current = true;
    await Promise.all([
      animate(scope.current, BODY_KEYFRAMES, {
        duration: JUMP_DURATION,
        times: JUMP_TIMES,
      }),
      flip(el),
    ]);
    busy.current = false;
  };

  useMotionValueEvent(progress, "change", (v) => {
    if (v < REARM) armed.current = true;
    if (v < TRIGGER || !armed.current || busy.current) return;
    armed.current = false;
    void jump(async (el) => {
      await animate(el, BACKFLIP_KEYFRAMES, {
        duration: JUMP_DURATION,
        times: JUMP_TIMES,
      });
    });
  });

  const changeColor = (index: number) => {
    if (index === pickedColor || busy.current) return;
    setPickedColor(index);
    void jump(async (el) => {
      await animate(
        el,
        { rotateY: [0, 270], transformPerspective: COIN_PERSPECTIVE },
        { duration: APEX - LIFT_OFF, delay: LIFT_OFF, ease: "easeIn" },
      );
      setColor(index);
      await animate(
        el,
        { rotateY: [-90, 0] },
        { duration: LANDING - APEX, ease: "easeOut" },
      );
    });
  };

  const changeExpression = (index: number) => {
    if (index === expression) return;
    setExpression(index);
    const el = flipRef.current;
    if (el && !busy.current) animate(el, POP_KEYFRAMES, { duration: 0.3 });
  };

  // Close on a click outside, or Escape (handing focus back to the avatar)
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      scope.current?.focus();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, scope]);

  return (
    // `top` (not a transform) drops it a little below the line, clear of the jump's y.
    // Also anchors the editor, which stays put while the avatar jumps.
    <span ref={rootRef} className="relative top-3 inline-block align-baseline">
      {/* Outer: jump and squash from the feet. Inner: flips about the centre. */}
      <button
        ref={scope}
        type="button"
        aria-label="Customise avatar"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="block origin-bottom cursor-pointer rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-black/40"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span ref={flipRef} className="block">
          <Avatar
            expressionIndex={expression}
            colorIndex={color}
            size={size}
            className="block"
          />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <AvatarEditor
            expressionIndex={expression}
            colorIndex={pickedColor}
            onExpressionChange={changeExpression}
            onColorChange={changeColor}
          />
        )}
      </AnimatePresence>
    </span>
  );
};
