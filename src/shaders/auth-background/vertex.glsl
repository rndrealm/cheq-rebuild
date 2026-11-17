varying vec2 vUv;

// Full-screen quad: the 2x2 plane is already in clip space.
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
