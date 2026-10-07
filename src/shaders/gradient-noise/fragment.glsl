// precision mediump float;

uniform sampler2D uTexture;
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColorB1;
uniform vec3 uColorB2;
uniform vec3 uColorB3;
uniform vec3 uColorC1;
uniform vec3 uColorC2;
uniform vec3 uColorC3;
uniform float uColorProgress;
uniform float uColorProgressC;
uniform float uLines;
uniform float uOffset1;
uniform float uOffset2;

varying vec2 vUv;
varying vec3 vPosition;
// varying vec2 relativeUv;

// vec3 mod289(vec3 x) {
//   return x - floor(x * (1.0 / 289.0)) * 289.0;
// }

// vec4 mod289(vec4 x) {
//   return x - floor(x * (1.0 / 289.0)) * 289.0;
// }

// vec4 permute(vec4 x) {
//   return mod289(((x * 34.0) + 10.0) * x);
// }

// vec4 taylorInvSqrt(vec4 r) {
//   return 1.79284291400159 - 0.85373472095314 * r;
// }

// float snoise(vec3 v) {
//   const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
//   const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

// // First corner
//   vec3 i = floor(v + dot(v, C.yyy));
//   vec3 x0 = v - i + dot(i, C.xxx);

// // Other corners
//   vec3 g = step(x0.yzx, x0.xyz);
//   vec3 l = 1.0 - g;
//   vec3 i1 = min(g.xyz, l.zxy);
//   vec3 i2 = max(g.xyz, l.zxy);

//   //   x0 = x0 - 0.0 + 0.0 * C.xxx;
//   //   x1 = x0 - i1  + 1.0 * C.xxx;
//   //   x2 = x0 - i2  + 2.0 * C.xxx;
//   //   x3 = x0 - 1.0 + 3.0 * C.xxx;
//   vec3 x1 = x0 - i1 + C.xxx;
//   vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
//   vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// // Permutations
//   i = mod289(i);
//   vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));

// // Gradients: 7x7 points over a square, mapped onto an octahedron.
// // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
//   float n_ = 0.142857142857; // 1.0/7.0
//   vec3 ns = n_ * D.wyz - D.xzx;

//   vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

//   vec4 x_ = floor(j * ns.z);
//   vec4 y_ = floor(j - 7.0 * x_);    // mod(j,N)

//   vec4 x = x_ * ns.x + ns.yyyy;
//   vec4 y = y_ * ns.x + ns.yyyy;
//   vec4 h = 1.0 - abs(x) - abs(y);

//   vec4 b0 = vec4(x.xy, y.xy);
//   vec4 b1 = vec4(x.zw, y.zw);

//   //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
//   //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
//   vec4 s0 = floor(b0) * 2.0 + 1.0;
//   vec4 s1 = floor(b1) * 2.0 + 1.0;
//   vec4 sh = -step(h, vec4(0.0));

//   vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
//   vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

//   vec3 p0 = vec3(a0.xy, h.x);
//   vec3 p1 = vec3(a0.zw, h.y);
//   vec3 p2 = vec3(a1.xy, h.z);
//   vec3 p3 = vec3(a1.zw, h.w);

// //Normalise gradients
//   vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
//   p0 *= norm.x;
//   p1 *= norm.y;
//   p2 *= norm.z;
//   p3 *= norm.w;

// // Mix final noise value
//   vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
//   m = m * m;
//   return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
// }

vec2 CoverUV(vec2 u, vec2 s, vec2 i) {
  float rs = s.x / s.y; // Aspect screen size
  float ri = i.x / i.y; // Aspect image size
  vec2 st = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x); // New st
  vec2 o = (rs < ri ? vec2((st.x - s.x) / 2.0, 0.0) : vec2(0.0, (st.y - s.y) / 2.0)) / st; // Offset
  return u * s / st + o;
}

float lines(vec2 uv, float offset, float lines) {

  return smoothstep(0.0, 0.5 + offset * 0.5, abs(0.5 * (sin(uv.x * lines) + offset * 2.0)));
}

float mod289(float x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 perm(vec4 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

float noise(vec3 p) {
  vec3 a = floor(p);
  vec3 d = p - a;
  d = d * d * (3.0 - 2.0 * d);

  vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
  vec4 k1 = perm(b.xyxy);
  vec4 k2 = perm(k1.xyxy + b.zzww);

  vec4 c = k2 + a.zzzz;
  vec4 k3 = perm(c);
  vec4 k4 = perm(c + 1.0);

  vec4 o1 = fract(k3 * (1.0 / 41.0));
  vec4 o2 = fract(k4 * (1.0 / 41.0));

  vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
  vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

  return o4.y * d.y + o4.x * (1.0 - d.y);
}

mat2 rotation2d(float angle) {
  float s = sin(angle);
  float c = cos(angle);

  return mat2(c, -s, s, c);
}

void main() {
  float n = noise(vec3(vPosition + uTime * 0.2));

  vec2 positionUv = rotation2d(n + uTime * 0.1) * vPosition.xy * 0.1;

  // float noise2 = snoise(vec3(vPosition + uTime));
  // float noise3 = snoise(vec3(vUv.x + vPosition.y + uTime * 0.3, sin(vUv.y + vPosition.z) + uTime * 0.763, vPosition.x + uTime));

  float basePattern = lines(positionUv, uOffset1, uLines);
  float secondPattern = lines(positionUv, uOffset2, uLines);

  vec3 color1 = mix(uColor1, uColorB1, uColorProgress);
  vec3 color2 = mix(uColor2, uColorB2, uColorProgress);
  vec3 color3 = mix(uColor3, uColorB3, uColorProgress);
  color1 = mix(color1, uColorC1, uColorProgressC);
  color2 = mix(color2, uColorC2, uColorProgressC);
  color3 = mix(color3, uColorC3, uColorProgressC);

  vec3 baseColor = mix(color1, color2, basePattern);
  vec3 finalColor = mix(baseColor, color3, secondPattern);
  // gl_FragColor = vec4(relativeTex, 1.0);

  gl_FragColor = vec4(finalColor, 1.0);
  #include <colorspace_fragment>

  // gl_FragColor = vec4(vec3(noiser), 1.0);
}
