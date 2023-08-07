uniform float time;
varying vec2 vUv;
varying vec3 vPosition;
uniform vec2 pixels;
float PI = 3.141592653589793238;
void main() {
  vUv = uv;
  vPosition = position;
      vec4 rotatedPosition = mat4(
        cos(90.0), -sin(90.0), 1.0, 0.0,
        sin(90.0), cos(90.0), 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
    ) * modelViewMatrix * vec4(position, 1.0);

    gl_Position = projectionMatrix * rotatedPosition;
}