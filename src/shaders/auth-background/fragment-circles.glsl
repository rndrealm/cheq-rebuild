// Auth background, "circles" variant. Same three blurred blobs as
// fragment.glsl, but every change is carried by the circles themselves, each
// on its own staggered timing:
//   email -> password: each circle glides down to its lowered spot
//   colour -> grey:  each circle recolours to black and glides to its new spot
//                    along a slight arc
//   grey -> black:   each circle swells, firms up and drifts inward until the
//                    three merge into the flat #0B0B0B page
//
// All geometry is in CSS pixels measured from the top-centre of the viewport.

precision highp float;

uniform vec2 uResolution; // viewport size in CSS px
// 0 = colour blobs (email), 1 = colour blobs lowered (password),
// 2 = black blobs, a grey wash (code), 3 = flat #0B0B0B (done).
// Linear in time; eased here.
uniform float uProgress;
// Page-load entrance, 0..1 once. Linear in time; eased here.
uniform float uIntro;
// Error context, 0 = none, 1 = full (Figma "Context aware Gradients"): over
// whatever stage the page is at, orange and purple shrink away and green
// swells into one red circle. Linear in time; eased here.
uniform float uError;
// Merge to white, 0..1 (Figma "Welcome to Cheq": "these 3 colours combine to
// make white"): the circles drift together, swell and dissolve into the white
// page. Linear in time; eased here.
uniform float uWhite;

varying vec2 vUv;

// --- Blob geometry (see fragment.glsl: fitted to Figma's render) -----------
const float PEAK = 0.43;
const float SIGMA = 380.0;

const vec2 BLOB_ORANGE = vec2(-488.0, 526.5);
const vec2 BLOB_PURPLE = vec2(451.5, 510.5);
const vec2 BLOB_GREEN = vec2(-25.0, 162.5);

// Where each circle sits in the password frame, relative to the email frame
// (Figma lowers the group 106px). Per circle, so any one can be moved on its own.
const vec2 LOWER_ORANGE = vec2(0.0, 106.0);
const vec2 LOWER_PURPLE = vec2(0.0, 106.0);
const vec2 LOWER_GREEN = vec2(0.0, 106.0);

// Where each circle ends up in the grey frame, relative to the email frame
// (Figma: the group 84px down and 2px left).
const vec2 MOVE_ORANGE = vec2(-2.0, 84.0);
const vec2 MOVE_PURPLE = vec2(-2.0, 84.0);
const vec2 MOVE_GREEN = vec2(-2.0, 84.0);

const vec3 ORANGE = vec3(1.0, 0.357, 0.0);  // #FF5B00
const vec3 PURPLE = vec3(0.357, 0.0, 1.0);  // #5B00FF
const vec3 GREEN = vec3(0.0, 1.0, 0.357);   // #00FF5B
const vec3 DARK = vec3(0.0);
const vec3 PAGE_BLACK = vec3(11.0 / 255.0); // #0B0B0B

// --- Per-circle timing (both stages) ---------------------------------------
// Fractions of a stage. Each circle starts at its delay and takes DURATION;
// the last one (delay 0.3 + 0.7) finishes exactly at the end.
const float DURATION = 0.7;
const float DELAY_GREEN = 0.0;   // nearest the logo, goes first
const float DELAY_ORANGE = 0.15;
const float DELAY_PURPLE = 0.3;

// --- Stage 1: colour -> grey -----------------------------------------------
// How far (px) a circle bows out from the straight line mid-move, away from
// the page centre, so each one visibly travels on its own path
const float ARC = 60.0;
// How much a circle swells mid-move (fraction of its size)
const float SWELL = 0.12;

// --- Stage 2: grey -> black ------------------------------------------------
// Where the circles drift towards as they merge (just under the logo)
const vec2 MERGE_POINT = vec2(0.0, 420.0);
// Fraction of the way to MERGE_POINT each circle travels
const float MERGE = 0.5;
// How much each circle grows by the end (3.5 = 3.5x wider)
const float GROW = 2.5;

// --- Error context ---------------------------------------------------------
// Figma: a single ellipse r 515 at 80%, centred 37px left of the page centre
// at y 435.5, same 382 blur. Peak and spread fitted to Figma's render of the
// error frame (RMS error 1.0 levels; the blur maths gave 0.478 / 460.7, too
// light). Pure #FF0000 as in Figma: fading over white it stays a saturated
// coral. (#E04746, the error colour the field glass and text use, has grey in
// it and turned the whole page a dusty pink here.)
const vec3 ERROR_RED = vec3(1.0, 0.0, 0.0);
const vec2 ERROR_CENTRE = vec2(-37.0, 435.5);
const float ERROR_PEAK = 0.59;
const float ERROR_SIGMA = 435.0;
// Orange and purple shrink to this much of their size as they fade away
const float ERROR_SHRINK = 0.6;
// Per-circle timing, as fractions of the error change: the two that leave go
// first, green follows
const float ERROR_DURATION = 0.75;
const float ERROR_DELAY_ORANGE = 0.0;
const float ERROR_DELAY_PURPLE = 0.1;
const float ERROR_DELAY_GREEN = 0.25;

// --- Merge to white ----------------------------------------------------------
// The three circles drift this fraction of the way to WHITE_POINT (behind the
// ticket), swell, and fade to nothing, on the per-circle timing above
const vec2 WHITE_POINT = vec2(0.0, 400.0);
const float WHITE_DRIFT = 0.6;
const float WHITE_SWELL = 0.5;

// --- Entrance (page load) --------------------------------------------------
// Each circle grows from INTRO_SCALE of its size and nothing, while dropping
// INTRO_LIFT px into place with a little overshoot, on the per-circle timing
// above (uIntro runs 0..1 once).
const float INTRO_SCALE = 0.35;
const float INTRO_LIFT = 140.0;
// Overshoot of the landing (0 = none)
const float INTRO_BOUNCE = 1.2;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Ease in-out (smootherstep), so each circle starts and lands softly
float ease(float t) {
  t = clamp(t, 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

// One circle's own 0..1 progress through a stage
float circleProgress(float stage, float delay) {
  return ease((stage - delay) / DURATION);
}

// Ease out (cubic): fast start, soft finish
float easeOut(float t) {
  t = clamp(t, 0.0, 1.0);
  return 1.0 - pow(1.0 - t, 3.0);
}

// Ease out with overshoot: passes 1, then settles back onto it
float easeOutBack(float t) {
  t = clamp(t, 0.0, 1.0);
  float c = INTRO_BOUNCE + 1.0;
  return 1.0 + c * pow(t - 1.0, 3.0) + INTRO_BOUNCE * pow(t - 1.0, 2.0);
}

// One circle at `p`: its colour and strength, given its own progress through
// the entrance (`tIn`, raw 0..1), lowering (`t0`), stage 1 (`t1`), stage 2
// (`t2`), the error context (`tErr`) and the merge to white (`tWhite`). `hero`
// is 1 for the circle that becomes the red one in an error, 0 for those that
// leave.
vec4 circle(
  vec2 p,
  vec2 start,
  vec2 lower,
  vec2 move,
  vec3 tint,
  float tIn,
  float t0,
  float t1,
  float t2,
  float tErr,
  float hero,
  float tWhite
) {
  // Entrance: drop in from above and land, overshooting a touch
  vec2 centre = start - vec2(0.0, INTRO_LIFT * (1.0 - easeOutBack(tIn)));

  // Lowering: glide straight down to the password position
  centre += lower * t0;

  // Stage 1: glide on to the grey position along an outward arc, swelling a bit
  float bump = sin(3.14159265 * t1);
  vec2 outward = normalize(start - vec2(0.0, 300.0));
  centre = mix(centre, start + move, t1) + outward * ARC * bump;
  // Entrance: grow from INTRO_SCALE of its size
  float grow = easeOut(tIn);
  float sigma = SIGMA * mix(INTRO_SCALE, 1.0, grow) * (1.0 + SWELL * bump);

  // Stage 2: drift inward, grow and firm up until it covers the page
  centre = mix(centre, MERGE_POINT, MERGE * t2);
  sigma *= 1.0 + GROW * t2;
  float peak = mix(PEAK, 1.0, t2);
  vec3 colour = mix(mix(tint, DARK, t1), PAGE_BLACK, t2);

  // Error: the hero swells into the red circle at the centre; the others
  // shrink as they fade out
  float heroErr = hero * tErr;
  float leaveErr = (1.0 - hero) * tErr;
  centre = mix(centre, ERROR_CENTRE, heroErr);
  sigma = mix(sigma, ERROR_SIGMA, heroErr) * mix(1.0, ERROR_SHRINK, leaveErr);
  peak = mix(peak, ERROR_PEAK, heroErr) * (1.0 - leaveErr);
  colour = mix(colour, ERROR_RED, heroErr);

  // Merge to white: drift together, swell, dissolve
  centre = mix(centre, WHITE_POINT, WHITE_DRIFT * tWhite);
  sigma *= 1.0 + WHITE_SWELL * tWhite;
  peak *= 1.0 - tWhite;

  vec2 d = p - centre;
  float strength = grow * peak * exp(-dot(d, d) / (2.0 * sigma * sigma));
  return vec4(colour, strength);
}

void main() {
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uResolution;
  p.x -= uResolution.x * 0.5;

  float toLowered = clamp(uProgress, 0.0, 1.0);
  float toGrey = clamp(uProgress - 1.0, 0.0, 1.0);
  float toBlack = clamp(uProgress - 2.0, 0.0, 1.0);

  // Raw (uneased) entrance progress per circle; circle() eases it
  float greenIn = clamp((uIntro - DELAY_GREEN) / DURATION, 0.0, 1.0);
  float orangeIn = clamp((uIntro - DELAY_ORANGE) / DURATION, 0.0, 1.0);
  float purpleIn = clamp((uIntro - DELAY_PURPLE) / DURATION, 0.0, 1.0);

  float greenLowered = circleProgress(toLowered, DELAY_GREEN);
  float orangeLowered = circleProgress(toLowered, DELAY_ORANGE);
  float purpleLowered = circleProgress(toLowered, DELAY_PURPLE);

  float greenGrey = circleProgress(toGrey, DELAY_GREEN);
  float orangeGrey = circleProgress(toGrey, DELAY_ORANGE);
  float purpleGrey = circleProgress(toGrey, DELAY_PURPLE);

  float greenBlack = circleProgress(toBlack, DELAY_GREEN);
  float orangeBlack = circleProgress(toBlack, DELAY_ORANGE);
  float purpleBlack = circleProgress(toBlack, DELAY_PURPLE);

  // The page behind darkens as the circles take over, so all three finished
  // means a flat black page
  vec3 colour = mix(
    vec3(1.0),
    PAGE_BLACK,
    (greenBlack + orangeBlack + purpleBlack) / 3.0
  );

  float orangeErr = ease((uError - ERROR_DELAY_ORANGE) / ERROR_DURATION);
  float purpleErr = ease((uError - ERROR_DELAY_PURPLE) / ERROR_DURATION);
  float greenErr = ease((uError - ERROR_DELAY_GREEN) / ERROR_DURATION);

  float orangeWhite = circleProgress(uWhite, DELAY_ORANGE);
  float purpleWhite = circleProgress(uWhite, DELAY_PURPLE);
  float greenWhite = circleProgress(uWhite, DELAY_GREEN);

  // Same stacking order as Figma: orange, purple, then green on top. Green is
  // the one that becomes the red circle in an error.
  vec4 c;
  c = circle(p, BLOB_ORANGE, LOWER_ORANGE, MOVE_ORANGE, ORANGE, orangeIn, orangeLowered, orangeGrey, orangeBlack, orangeErr, 0.0, orangeWhite);
  colour = mix(colour, c.rgb, c.a);
  c = circle(p, BLOB_PURPLE, LOWER_PURPLE, MOVE_PURPLE, PURPLE, purpleIn, purpleLowered, purpleGrey, purpleBlack, purpleErr, 0.0, purpleWhite);
  colour = mix(colour, c.rgb, c.a);
  c = circle(p, BLOB_GREEN, LOWER_GREEN, MOVE_GREEN, GREEN, greenIn, greenLowered, greenGrey, greenBlack, greenErr, 1.0, greenWhite);
  colour = mix(colour, c.rgb, c.a);

  // One step of dither so the huge, soft gradients don't band.
  colour += (hash(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(colour, 1.0);
}
