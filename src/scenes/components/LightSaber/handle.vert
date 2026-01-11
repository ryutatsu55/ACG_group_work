// Handle Vertex Shader - Metallic PBR Surface
// GLSL 3.0 ES (Three.js GLSL3 mode)

out vec3 vWorldPosition;
out vec3 vWorldNormal;
out vec3 vViewDirection;
out vec2 vUv;
out vec3 vLocalPosition;

uniform vec3 uBladeTipLocal;

void main() {
    vUv = uv;
    vLocalPosition = position;

    // World space calculations for PBR lighting
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;

    // Transform normal to world space
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);

    // View direction (from surface to camera)
    vViewDirection = normalize(cameraPosition - worldPos.xyz);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
