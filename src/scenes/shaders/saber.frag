// #version 300 es

precision mediump float;

uniform vec3 uColor;
uniform float uSwingSpeed;

// Vertexから来るデータは "in"
in vec2 vUv;
in vec3 vNormal; 

// 出力変数を自分で定義 (gl_FragColorの代わり)
out vec4 fragColor;

void main() {
  float intensity = 1.0 / (abs(vUv.x - 0.5) * 8.0);
  float speedGlow = uSwingSpeed * 0.5; 
  vec3 glow = uColor * intensity + vec3(speedGlow);
  float alpha = smoothstep(0.0, 1.0, intensity);

  // 定義した変数に出力
  fragColor = vec4(glow, alpha);
}