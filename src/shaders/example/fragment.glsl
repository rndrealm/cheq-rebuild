uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;
void main() {
  gl_FragColor = vec4(uColor * (0.5 + 0.5 * sin(vUv.x * 10.0 + uTime)), 1.0);
}
