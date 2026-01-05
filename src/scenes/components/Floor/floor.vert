out vec3 vWorldPosition; // 世界のどこにいるか

void main() {
    // オブジェクトのローカル座標ではなく、世界の絶対座標を計算
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}