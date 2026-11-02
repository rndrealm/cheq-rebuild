export type Vec2 = [number, number];

export type ShapePoint = { p: Vec2; hi: Vec2; ho: Vec2 };

const O: Vec2 = [0, 0];

const S = 5 / 7;

export const LCX = 15.6;
export const RCX = 24.7;
export const ECY = 18.4;
export const MCX = 20.15;
export const MCY = 24.2;

export function buildPath(shape: ShapePoint[], cx: number, cy: number): string {
  const f = (v: number) => +v.toFixed(3);
  const n = shape.length;
  let d = `M${f(cx + shape[0].p[0])} ${f(cy + shape[0].p[1])}`;
  for (let i = 0; i < n; i++) {
    const c = shape[i];
    const nx = shape[(i + 1) % n];
    d += ` C${f(cx + c.p[0] + c.ho[0])} ${f(cy + c.p[1] + c.ho[1])} ${f(cx + nx.p[0] + nx.hi[0])} ${f(cy + nx.p[1] + nx.hi[1])} ${f(cx + nx.p[0])} ${f(cy + nx.p[1])}`;
  }
  return d + 'Z';
}

export function makeCircle(r: number): ShapePoint[] {
  const k = r * (4 / 3) * Math.tan(Math.PI / 16);
  const a = r * Math.SQRT1_2;
  const ak = k * Math.SQRT1_2;
  return [
    { p: [r, 0], hi: [0, -k], ho: [0, k] },
    { p: [a, a], hi: [ak, -ak], ho: [-ak, ak] },
    { p: [0, r], hi: [k, 0], ho: [-k, 0] },
    { p: [-a, a], hi: [ak, ak], ho: [-ak, -ak] },
    { p: [-r, 0], hi: [0, k], ho: [0, -k] },
    { p: [-a, -a], hi: [-ak, ak], ho: [ak, -ak] },
    { p: [0, -r], hi: [-k, 0], ho: [k, 0] },
    { p: [a, -a], hi: [-ak, -ak], ho: [ak, ak] },
  ];
}

export function makeRect(w: number, h: number): ShapePoint[] {
  const hw = w / 2,
    hh = h / 2;
  return [
    { p: [hw, 0], hi: O, ho: O },
    { p: [hw, hh], hi: O, ho: O },
    { p: [0, hh], hi: O, ho: O },
    { p: [-hw, hh], hi: O, ho: O },
    { p: [-hw, 0], hi: O, ho: O },
    { p: [-hw, -hh], hi: O, ho: O },
    { p: [0, -hh], hi: O, ho: O },
    { p: [hw, -hh], hi: O, ho: O },
  ];
}

export function rotShape(shape: ShapePoint[], angle: number): ShapePoint[] {
  const cs = Math.cos(angle),
    sn = Math.sin(angle);
  const r = (v: Vec2): Vec2 => [v[0] * cs - v[1] * sn, v[0] * sn + v[1] * cs];
  return shape.map(({ p, hi, ho }) => ({ p: r(p), hi: r(hi), ho: r(ho) }));
}

function shiftShape(shape: ShapePoint[], dx: number, dy: number): ShapePoint[] {
  return shape.map(({ p, hi, ho }) => ({
    p: [p[0] + dx, p[1] + dy] as Vec2,
    hi,
    ho,
  }));
}

function scaleShape(shape: ShapePoint[], s: number): ShapePoint[] {
  return shape.map(({ p, hi, ho }) => ({
    p: [p[0] * s, p[1] * s] as Vec2,
    hi: [hi[0] * s, hi[1] * s] as Vec2,
    ho: [ho[0] * s, ho[1] * s] as Vec2,
  }));
}

// Eye shapes
export const eyeCircle = makeCircle(1.6 * S);
export const eyeHBar = makeRect(5 * S, 1.5 * S);
export const eyeVBar = makeRect(1.5 * S, 5 * S);
export const eyeDiagLeft = rotShape(makeRect(4.5 * S, 1.5 * S), Math.PI / 4);
export const eyeDiagRight = rotShape(makeRect(4.5 * S, 1.5 * S), -Math.PI / 4);

export const eyeCurved: ShapePoint[] = scaleShape(
  [
    { p: [2.0, 0.3], hi: [0, -0.6], ho: [0, 0.6] },
    { p: [1.3, 1.2], hi: [0.5, -0.15], ho: [-0.5, 0.15] },
    { p: [0, 1.5], hi: [0.7, 0], ho: [-0.7, 0] },
    { p: [-1.3, 1.2], hi: [0.5, 0.15], ho: [-0.5, -0.15] },
    { p: [-2.0, 0.3], hi: [0, 0.6], ho: [0, -0.6] },
    { p: [-1.3, -0.3], hi: [-0.4, 0], ho: [0.4, 0] },
    { p: [0, 0], hi: [-0.7, 0], ho: [0.7, 0] },
    { p: [1.3, -0.3], hi: [-0.4, 0], ho: [0.4, 0] },
  ],
  S
);

export const eyeChevronRight: ShapePoint[] = scaleShape(
  [
    { p: [2.0, 0], hi: O, ho: O },
    { p: [0.3, 0.9], hi: O, ho: O },
    { p: [-1.5, 2.0], hi: O, ho: O },
    { p: [-1.5, 0.8], hi: O, ho: O },
    { p: [0, 0], hi: O, ho: O },
    { p: [-1.5, -0.8], hi: O, ho: O },
    { p: [-1.5, -2.0], hi: O, ho: O },
    { p: [0.3, -0.9], hi: O, ho: O },
  ],
  S
);

export const eyeChevronLeft: ShapePoint[] = scaleShape(
  [
    { p: [1.5, 0.8], hi: O, ho: O },
    { p: [1.5, 2.0], hi: O, ho: O },
    { p: [-0.3, 0.9], hi: O, ho: O },
    { p: [-2.0, 0], hi: O, ho: O },
    { p: [-0.3, -0.9], hi: O, ho: O },
    { p: [1.5, -2.0], hi: O, ho: O },
    { p: [1.5, -0.8], hi: O, ho: O },
    { p: [0, 0], hi: O, ho: O },
  ],
  S
);

// Mouth shapes
export const mouthNeutral = makeRect(2.5 * S, 1.0 * S);
export const mouthAnnoyed = makeRect(3.5 * S, 0.5 * S);
export const mouthSurprised = makeCircle(1.2 * S);
export const mouthSkeptical = rotShape(makeRect(2.5 * S, 0.6 * S), Math.PI / 8);

export const mouthSmile: ShapePoint[] = scaleShape(
  [
    { p: [1.8, -0.1], hi: [0, -0.3], ho: [0, 0.3] },
    { p: [1.2, 0.7], hi: [0.4, -0.1], ho: [-0.4, 0.1] },
    { p: [0, 1.1], hi: [0.6, 0], ho: [-0.6, 0] },
    { p: [-1.2, 0.7], hi: [0.4, 0.1], ho: [-0.4, -0.1] },
    { p: [-1.8, -0.1], hi: [0, 0.3], ho: [0, -0.3] },
    { p: [-1.2, -0.4], hi: [-0.3, 0], ho: [0.3, 0] },
    { p: [0, -0.2], hi: [-0.6, 0], ho: [0.6, 0] },
    { p: [1.2, -0.4], hi: [-0.3, 0], ho: [0.3, 0] },
  ],
  S
);

export const mouthFrown: ShapePoint[] = scaleShape(
  [
    { p: [1.8, 0.1], hi: [0, 0.3], ho: [0, -0.3] },
    { p: [1.2, -0.7], hi: [0.4, 0.1], ho: [-0.4, -0.1] },
    { p: [0, -1.1], hi: [0.6, 0], ho: [-0.6, 0] },
    { p: [-1.2, -0.7], hi: [0.4, -0.1], ho: [-0.4, 0.1] },
    { p: [-1.8, 0.1], hi: [0, -0.3], ho: [0, 0.3] },
    { p: [-1.2, 0.4], hi: [-0.3, 0], ho: [0.3, 0] },
    { p: [0, 0.2], hi: [-0.6, 0], ho: [0.6, 0] },
    { p: [1.2, 0.4], hi: [-0.3, 0], ho: [0.3, 0] },
  ],
  S
);

// Expressions
export interface Expression {
  key: string;
  label: string;
  left: ShapePoint[];
  right: ShapePoint[];
  mouth: ShapePoint[];
}

export const EXPRESSIONS: Expression[] = [
  { key: 'circles', label: 'Circles', left: eyeCircle, right: eyeCircle, mouth: mouthNeutral },
  {
    key: 'vertical',
    label: 'Vertical',
    left: eyeVBar,
    right: eyeVBar,
    mouth: mouthSurprised,
  },
  {
    key: 'diagonal',
    label: 'Diagonal',
    left: eyeDiagLeft,
    right: eyeDiagRight,
    mouth: mouthSkeptical,
  },
  { key: 'curved', label: 'Curved', left: eyeCurved, right: eyeCurved, mouth: mouthSmile },
  {
    key: 'chevron',
    label: 'Chevron',
    left: eyeChevronRight,
    right: eyeChevronLeft,
    mouth: mouthFrown,
  },
];

export const PATHS = EXPRESSIONS.map((expr) => ({
  left: buildPath(expr.left, LCX, ECY),
  right: buildPath(expr.right, RCX, ECY),
  mouth: buildPath(expr.mouth, MCX, MCY),
}));

// Idle animations
export interface IdleAnimation {
  left: string[];
  right: string[];
  duration: number;
  times: number[];
}

const blinkClosed = makeRect(3 * S, 0.3 * S);
const vBarTall = makeRect(1.5 * S, 6 * S);
const diagLeftRockA = rotShape(makeRect(4.5 * S, 1.5 * S), Math.PI / 4 + 0.12);
const diagLeftRockB = rotShape(makeRect(4.5 * S, 1.5 * S), Math.PI / 4 - 0.12);
const diagRightRockA = rotShape(makeRect(4.5 * S, 1.5 * S), -Math.PI / 4 + 0.12);
const diagRightRockB = rotShape(makeRect(4.5 * S, 1.5 * S), -Math.PI / 4 - 0.12);
const curvedUp = shiftShape(eyeCurved, 0, -0.5 * S);
const chevronRightJitterA = shiftShape(eyeChevronRight, 0.3 * S, 0);
const chevronRightJitterB = shiftShape(eyeChevronRight, -0.3 * S, 0);
const chevronLeftJitterA = shiftShape(eyeChevronLeft, 0.3 * S, 0);
const chevronLeftJitterB = shiftShape(eyeChevronLeft, -0.3 * S, 0);

const ep = (shape: ShapePoint[], cx: number) => buildPath(shape, cx, ECY);

export const IDLE_ANIMATIONS: IdleAnimation[] = [
  {
    left: [
      ep(eyeCircle, LCX),
      ep(eyeCircle, LCX),
      ep(blinkClosed, LCX),
      ep(eyeCircle, LCX),
      ep(eyeCircle, LCX),
    ],
    right: [
      ep(eyeCircle, RCX),
      ep(eyeCircle, RCX),
      ep(blinkClosed, RCX),
      ep(eyeCircle, RCX),
      ep(eyeCircle, RCX),
    ],
    duration: 3,
    times: [0, 0.4, 0.45, 0.5, 1],
  },
  {
    left: [ep(eyeVBar, LCX), ep(vBarTall, LCX), ep(eyeVBar, LCX)],
    right: [ep(eyeVBar, RCX), ep(vBarTall, RCX), ep(eyeVBar, RCX)],
    duration: 1.5,
    times: [0, 0.5, 1],
  },
  {
    left: [
      ep(eyeDiagLeft, LCX),
      ep(diagLeftRockA, LCX),
      ep(eyeDiagLeft, LCX),
      ep(diagLeftRockB, LCX),
      ep(eyeDiagLeft, LCX),
    ],
    right: [
      ep(eyeDiagRight, RCX),
      ep(diagRightRockA, RCX),
      ep(eyeDiagRight, RCX),
      ep(diagRightRockB, RCX),
      ep(eyeDiagRight, RCX),
    ],
    duration: 2,
    times: [0, 0.25, 0.5, 0.75, 1],
  },
  {
    left: [ep(eyeCurved, LCX), ep(curvedUp, LCX), ep(eyeCurved, LCX)],
    right: [ep(eyeCurved, RCX), ep(curvedUp, RCX), ep(eyeCurved, RCX)],
    duration: 1.5,
    times: [0, 0.5, 1],
  },
  {
    left: [
      ep(eyeChevronRight, LCX),
      ep(eyeChevronRight, LCX),
      ep(chevronRightJitterA, LCX),
      ep(chevronRightJitterB, LCX),
      ep(chevronRightJitterA, LCX),
      ep(chevronRightJitterB, LCX),
      ep(eyeChevronRight, LCX),
      ep(eyeChevronRight, LCX),
    ],
    right: [
      ep(eyeChevronLeft, RCX),
      ep(eyeChevronLeft, RCX),
      ep(chevronLeftJitterA, RCX),
      ep(chevronLeftJitterB, RCX),
      ep(chevronLeftJitterA, RCX),
      ep(chevronLeftJitterB, RCX),
      ep(eyeChevronLeft, RCX),
      ep(eyeChevronLeft, RCX),
    ],
    duration: 2,
    times: [0, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 1],
  },
];

// Colors
export interface ColorScheme {
  key: string;
  bg: string;
  gradientFrom: string;
  gradientTo: string;
  borderFrom: string;
  borderTo: string;
}

export const COLORS: ColorScheme[] = [
  {
    key: 'gray',
    bg: '#333333',
    gradientFrom: '#B7B6B7',
    gradientTo: '#515151',
    borderFrom: '#C1BEC1',
    borderTo: '#3D3C3D',
  },
  {
    key: 'blue',
    bg: '#1A2544',
    gradientFrom: '#7BA3E8',
    gradientTo: '#2E4B82',
    borderFrom: '#8FB5F0',
    borderTo: '#2A3D66',
  },
  {
    key: 'green',
    bg: '#1A3326',
    gradientFrom: '#6ADB8A',
    gradientTo: '#2B6B45',
    borderFrom: '#7AEB9A',
    borderTo: '#1F4D33',
  },
  {
    key: 'orange',
    bg: '#33251A',
    gradientFrom: '#E8B070',
    gradientTo: '#8B5530',
    borderFrom: '#F0C080',
    borderTo: '#6B4020',
  },
  {
    key: 'purple',
    bg: '#261A33',
    gradientFrom: '#B07AE8',
    gradientTo: '#5B3088',
    borderFrom: '#C08AF0',
    borderTo: '#3D2066',
  },
];

// Static paths (40x40 viewBox)
export const FRAME_D =
  'M12.742 4c.69 0 1.25.56 1.25 1.25V6a.5.5 0 1 0 1 0v-.75c0-.69.56-1.25 1.25-1.25h7.648c.608 0 1.102.494 1.102 1.103V6a.5.5 0 1 0 1 0v-.897c0-.61.494-1.103 1.103-1.103h4.73a4.167 4.167 0 0 1 4.167 4.167v4.375c0 .805-.653 1.458-1.458 1.458h-.542a.5.5 0 1 0 0 1h.75c.69 0 1.25.56 1.25 1.25v7.5c0 .69-.56 1.25-1.25 1.25h-.75a.5.5 0 1 0 0 1h.75c.69 0 1.25.56 1.25 1.25V31a5 5 0 0 1-5 5h-3.75c-.69 0-1.25-.56-1.25-1.25V34a.5.5 0 0 0-1 0v.75c0 .69-.56 1.25-1.25 1.25h-7.5c-.69 0-1.25-.56-1.25-1.25V34a.5.5 0 0 0-1 0v.75c0 .69-.56 1.25-1.25 1.25h-3.75a5 5 0 0 1-5-5v-3.75c0-.69.56-1.25 1.25-1.25h.75a.5.5 0 0 0 0-1h-.75c-.69 0-1.25-.56-1.25-1.25v-7.5c0-.69.56-1.25 1.25-1.25h.75a.5.5 0 0 0 0-1h-.75c-.69 0-1.25-.56-1.25-1.25V9a5 5 0 0 1 5-5Z';

export const FACE_D =
  'M22.252 8.969A4.25 4.25 0 0 0 18.054 8.969L12.212 12.29A4.25 4.25 0 0 0 10.062 15.983V22.853A4.25 4.25 0 0 0 12.182 26.529L18.024 29.911A4.25 4.25 0 0 0 22.282 29.911L28.124 26.529A4.25 4.25 0 0 0 30.244 22.852V15.983C30.244 14.455 29.424 13.045 28.094 12.29Z';
