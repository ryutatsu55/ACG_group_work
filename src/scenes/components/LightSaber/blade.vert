// #version 300 es

// in vec3 position;
// in vec2 uv;

// 自分で渡す varying だけ "out" で定義
out vec3 vLocalPosition; // ローカル座標
out vec2 vUv;

void main() {
  vUv = uv;
  vLocalPosition = position;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
