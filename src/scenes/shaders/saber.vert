// #version 300 es

// in vec3 position;
// in vec2 uv;

// 自分で渡す varying だけ "out" で定義
out vec2 vUv;
out vec3 vNormal;

void main() {
  vUv = uv; // uv は宣言なしで使える
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}