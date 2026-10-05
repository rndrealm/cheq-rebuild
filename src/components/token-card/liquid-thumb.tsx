"use client";

const THUMB_SIZE = 40;
const BAR_W = 300;
const BAR_H = 10;

type LiquidThumbProps = {
  normX: number;
  isDragging: boolean;
};

export function LiquidThumb({ normX, isDragging }: LiquidThumbProps) {
  return (
    <div
      className="absolute"
      style={{
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        transform: `translate(-50%, -50%) scale(${isDragging ? 1 : 0.5})`,
        transition: "transform 0.2s ease-out",
      }}
    >
      {/* Glass indicator */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: "white",
          position: "relative",
          boxShadow:
            "inset 1px -1px 2px #ffffff80, inset 0 -1px 2px #ffffff80, inset -1px -1px 2px #ffffff80, inset 1px 1px 2px #4d4d4d80, inset -8px 4px 10px -6px #4d4d4d40, inset -1px 1px 6px #4d4d4d40, -1px -1px 8px #99999926, 1px 1px 2px #4d4d4d26, 2px 2px 6px #4d4d4d26, inset -2px -1px 2px #ffffff40, 3px 6px 16px -6px #4d4d4d80",
        }}
      >
        {/* Wrapper — clip + blur */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            clipPath: "inset(0 0 0 0 round 100px)",
            filter: isDragging ? "blur(0px)" : "blur(4px)",
            transition: "filter 0.2s ease-out",
          }}
        >
          {/* Fill liquids (green) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              overflow: "hidden",
              filter: "url(#goo-thumb)",
              transform: "translate3d(0,0,0)",
              zIndex: 20,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                boxShadow: "inset 0 0 3px 4px #47a95e",
                opacity: Math.min(1, normX * 2),
              }}
            />
            <div
              style={{
                position: "absolute",
                height: BAR_H,
                width: BAR_W,
                top: "50%",
                left: 0,
                background: "#47a95e",
                borderRadius: 100,
                transform: `translate(${-BAR_W + normX * THUMB_SIZE}px, -50%)`,
              }}
            />
          </div>

          {/* Track liquids (grey) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              overflow: "hidden",
              filter: "url(#goo-thumb)",
              transform: "translate3d(0,0,0)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                boxShadow: "inset 0 0 3px 4px rgba(200,200,200,0.5)",
              }}
            />
            <div
              style={{
                position: "absolute",
                height: BAR_H,
                width: BAR_W,
                top: "50%",
                left: 0,
                background: "#D1D1D1",
                borderRadius: 100,
                transform: `translate(${Math.round(THUMB_SIZE * 0.08)}px, -50%)`,
              }}
            />
          </div>
        </div>

        {/* Cover — hides liquids when inactive */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "white",
            opacity: isDragging ? 0 : 1,
            transition: "opacity 0.2s ease-out",
          }}
        />

        {/* Shadow overlay — glass refraction on active */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            zIndex: 20,
            opacity: isDragging ? 1 : 0,
            transition: "opacity 0.2s ease-out",
            boxShadow:
              "inset 1px -1px 2px #ffffff80, inset 0 -1px 2px #ffffff80, inset -1px -1px 2px #ffffff80, inset 1px 1px 2px #4d4d4d59, inset -8px 4px 10px -6px #4d4d4d26, inset -1px 1px 6px #4d4d4d26, -1px -1px 8px #9999991a, 1px 1px 2px #4d4d4d1a, 2px 2px 6px #4d4d4d1a, inset -2px -1px 2px #ffffff40, 3px 6px 16px -6px #4d4d4d59",
          }}
        />
      </div>
    </div>
  );
}
