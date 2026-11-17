// Auth background: three heavily blurred blobs on white (Figma
// "Group 1780"), recoloured from orange/purple/green to black.
//
// All geometry is in CSS pixels measured from the top-centre of the viewport,
// so it lines up with the Figma frame (and the static SVG fallback) at any
// width, exactly like the SVG does.

precision highp float;

uniform vec2 uResolution; // viewport size in CSS px
// 0 = colour blobs (email), 1 = colour blobs lowered (password),
// 2 = black blobs, a grey wash (code), 3 = flat #0B0B0B (done).
// Linear in time; eased here.
uniform float uProgress;

varying vec2 vUv;

// --- Blob geometry --------------------------------------------------------
// Each blurred circle (Figma: R = 348, blur 382) is drawn as a Gaussian with
// this peak strength and spread. Fitted to Figma's own render of the colour
// and grey frames (330 sample points each, RMS error 1.6 levels): Figma's
// circles come out stronger and tighter than the blur maths alone gives
// (peak 0.34, sigma 420, which looked washed out in the browser).
const float PEAK = 0.43;
const float SIGMA = 380.0;

const vec2 BLOB_ORANGE = vec2(-488.0, 526.5);
const vec2 BLOB_PURPLE = vec2(451.5, 510.5);
const vec2 BLOB_GREEN = vec2(-25.0, 162.5);

// Where the group sits, relative to the email frame: the password frame lowers
// it 106px; the grey frame has it 84px down and 2px left.
const vec2 PASSWORD_OFFSET = vec2(0.0, 106.0);
const vec2 DARK_OFFSET = vec2(-2.0, 84.0);

const vec3 ORANGE = vec3(1.0, 0.357, 0.0);  // #FF5B00
const vec3 PURPLE = vec3(0.357, 0.0, 1.0);  // #5B00FF
const vec3 GREEN = vec3(0.0, 1.0, 0.357);   // #00FF5B
const vec3 DARK = vec3(0.0);
const vec3 PAGE_BLACK = vec3(11.0 / 255.0); // #0B0B0B

// --- Transition shape ------------------------------------------------------
// The change starts at the logo and spreads outward along a noisy front.
const vec2 ORIGIN = vec2(0.0, 210.0);
const float FRONT_WIDTH = 0.55;   // softness of the front (0..1 of the sweep)
const float NOISE_SCALE = 320.0;  // px per noise cell; smaller = more granular
const float NOISE_AMOUNT = 0.5;   // how much the noise bends the front
const float FLOW = 140.0;         // px of mid-transition swirl

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// How far a stage's front has reached point `p` (0 = not yet, 1 = done), for a
// stage `progress` of 0..1. Starts at the logo and spreads along noise.
float front(vec2 p, float progress, float seed) {
  float reach = length(p - ORIGIN) / max(length(uResolution), 1.0);
  float field = reach + fbm(p / NOISE_SCALE + seed) * NOISE_AMOUNT; // ~0 .. 1.5
  float sweep = progress * (1.5 + FRONT_WIDTH);
  return smoothstep(0.0, 1.0, clamp((sweep - field) / FRONT_WIDTH, 0.0, 1.0));
}

float blob(vec2 p, vec2 centre) {
  vec2 d = p - centre;
  return PEAK * exp(-dot(d, d) / (2.0 * SIGMA * SIGMA));
}

void main() {
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uResolution;
  p.x -= uResolution.x * 0.5;

  float toLowered = clamp(uProgress, 0.0, 1.0);
  float toGrey = clamp(uProgress - 1.0, 0.0, 1.0);
  float toBlack = clamp(uProgress - 2.0, 0.0, 1.0);

  // Swirl the field while either stage is in flight; zero when settled.
  float swirl = (sin(3.14159265 * toGrey) + sin(3.14159265 * toBlack)) * FLOW;
  vec2 q = p + (vec2(fbm(p / 420.0 + 3.1), fbm(p / 420.0 - 7.3)) - 0.5) * swirl;

  // Per-pixel progress of each stage. The second front uses a different patch
  // of noise so it doesn't retrace the first.
  float greyLocal = front(p, toGrey, 0.0);
  float blackLocal = front(p, toBlack, 11.7);

  // The group glides down for the password step, then on to the grey position
  vec2 offset = mix(
    PASSWORD_OFFSET * smoothstep(0.0, 1.0, toLowered),
    DARK_OFFSET,
    smoothstep(0.0, 1.0, toGrey)
  );

  // Same stacking order as Figma: orange, purple, then green on top.
  vec3 colour = vec3(1.0);
  colour = mix(colour, mix(ORANGE, DARK, greyLocal), blob(q, BLOB_ORANGE + offset));
  colour = mix(colour, mix(PURPLE, DARK, greyLocal), blob(q, BLOB_PURPLE + offset));
  colour = mix(colour, mix(GREEN, DARK, greyLocal), blob(q, BLOB_GREEN + offset));

  // Stage two: everything sinks to the flat page black of the last frame.
  colour = mix(colour, PAGE_BLACK, blackLocal);

  // One step of dither so the huge, soft gradients don't band.
  colour += (hash(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(colour, 1.0);
}
