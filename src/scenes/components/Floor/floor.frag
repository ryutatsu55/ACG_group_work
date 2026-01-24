precision mediump float;

// Blade light uniforms
uniform vec3 uBladeColor;
uniform float uBladeIntensity;
uniform vec3 uBladeTipWorld;
uniform vec3 uBladeBaseWorld;

// Floor material
uniform vec3 uFloorColor;
uniform float uRoughness;
uniform float uMetallic;
uniform float uAttenuation;
uniform float uMaxDist;

// Scene lighting
uniform vec3 uAmbientColor;
uniform float uAmbientIntensity;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vUv;

// Distance to line segment
float sdSegment(vec3 p, vec3 a, vec3 b) {
    vec3 pa = p - a;
    vec3 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

// Closest point on segment
vec3 closestPointOnSegment(vec3 p, vec3 a, vec3 b) {
    vec3 pa = p - a;
    vec3 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return a + ba * h;
}

void main() {
    vec3 normal = normalize(vNormal);
    
    // Calculate distance to blade
    float distToBlade = sdSegment(vWorldPosition, uBladeBaseWorld, uBladeTipWorld);
    
    // Get closest point on blade for lighting direction
    vec3 closestPoint = closestPointOnSegment(vWorldPosition, uBladeBaseWorld, uBladeTipWorld);
    vec3 lightDir = normalize(closestPoint - vWorldPosition);
    
    // Light attenuation (inverse square with soft falloff)
    float attenuation = 1.0 / (1.0 + distToBlade * distToBlade * uAttenuation);
    attenuation *= smoothstep(uMaxDist, 0.0, distToBlade);
    
    // Simple diffuse lighting
    float NdotL = max(dot(normal, -lightDir), 0.0);
    // Add ambient term so floor facing down still gets some light
    NdotL = mix(0.3, 1.0, NdotL);
    
    // Blade light contribution - boosted intensity
    vec3 bladeLightContrib = uBladeColor * uBladeIntensity * attenuation * NdotL * 3.0;
    
    // Subtle grid pattern (very faint, not checkerboard)
    float gridScale = 2.0;
    vec2 gridUv = vWorldPosition.xz * gridScale;
    float gridLine = smoothstep(0.02, 0.0, abs(fract(gridUv.x) - 0.5)) +
                     smoothstep(0.02, 0.0, abs(fract(gridUv.y) - 0.5));
    gridLine = min(gridLine, 1.0) * 0.1; // Very subtle
    
    // Base floor color with subtle metallic look
    vec3 baseColor = uFloorColor + vec3(gridLine);
    
    // Ambient light
    vec3 ambient = uAmbientColor * uAmbientIntensity * baseColor;
    
    // Final color
    vec3 finalColor = ambient + bladeLightContrib * baseColor;
    
    // Add subtle reflection/specular from blade
    float spec = pow(max(NdotL, 0.0), 32.0) * uMetallic;
    finalColor += uBladeColor * spec * attenuation * uBladeIntensity * 1.5;
    
    gl_FragColor = vec4(finalColor, 1.0);
}
