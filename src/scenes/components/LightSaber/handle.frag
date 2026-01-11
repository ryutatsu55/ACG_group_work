// Handle Fragment Shader - Metallic PBR with Blade Light Reflection
// GLSL 3.0 ES (Three.js GLSL3 mode)

precision highp float;

#define PI 3.14159265359

// Material properties
uniform vec3 uBaseColor;
uniform float uMetalness;
uniform float uRoughness;

// Blade light properties
uniform vec3 uBladeColor;
uniform float uBladeIntensity;
uniform vec3 uBladeTipWorld;
uniform vec3 uBladeBaseWorld;

// Scene lighting
uniform vec3 uAmbientColor;
uniform float uAmbientIntensity;

in vec3 vWorldPosition;
in vec3 vWorldNormal;
in vec3 vViewDirection;
in vec2 vUv;
in vec3 vLocalPosition;

out vec4 fragColor;

// ============================================
// PBR Helper Functions
// ============================================

// Fresnel-Schlick approximation
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// Fresnel-Schlick with roughness for ambient
vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness) {
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// GGX/Trowbridge-Reitz Normal Distribution Function
float distributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;

    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return a2 / denom;
}

// Schlick-GGX Geometry Function
float geometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;

    float denom = NdotV * (1.0 - k) + k;
    return NdotV / denom;
}

// Smith's Geometry Function
float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = geometrySchlickGGX(NdotV, roughness);
    float ggx1 = geometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}

// ============================================
// Blade Light Calculation
// ============================================

// Calculate closest point on blade line segment to surface point
vec3 closestPointOnBlade(vec3 p) {
    vec3 ba = uBladeTipWorld - uBladeBaseWorld;
    float t = clamp(dot(p - uBladeBaseWorld, ba) / dot(ba, ba), 0.0, 1.0);
    return uBladeBaseWorld + t * ba;
}

// Calculate blade light contribution at a point
vec3 calculateBladeLight(vec3 worldPos, vec3 N, vec3 V, vec3 albedo, float metalness, float roughness) {
    // Find closest point on blade to this surface point
    vec3 closestPoint = closestPointOnBlade(worldPos);
    vec3 L = normalize(closestPoint - worldPos);
    vec3 H = normalize(V + L);

    float dist = length(closestPoint - worldPos);

    // Attenuation with quadratic falloff
    float attenuation = 1.0 / (1.0 + dist * dist * 0.8);
    attenuation *= uBladeIntensity;

    // Skip if too far or blade is off
    if (attenuation < 0.001) {
        return vec3(0.0);
    }

    // PBR calculations
    float NdotL = max(dot(N, L), 0.0);
    float NdotV = max(dot(N, V), 0.0);

    // F0: reflectance at normal incidence
    vec3 F0 = mix(vec3(0.04), albedo, metalness);

    // Cook-Torrance BRDF
    float D = distributionGGX(N, H, roughness);
    float G = geometrySmith(N, V, L, roughness);
    vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

    // Specular and diffuse components
    vec3 numerator = D * G * F;
    float denominator = 4.0 * NdotV * NdotL + 0.0001;
    vec3 specular = numerator / denominator;

    vec3 kS = F;
    vec3 kD = (1.0 - kS) * (1.0 - metalness);

    // Radiance from blade
    vec3 radiance = uBladeColor * attenuation * 2.0;

    // Final contribution
    return (kD * albedo / PI + specular) * radiance * NdotL;
}


// Anisotropic Highlights (Brushed Metal Effect)

float anisotropicHighlight(vec3 N, vec3 V, vec3 L, vec3 tangent, float roughnessX, float roughnessY) {
    vec3 H = normalize(V + L);
    vec3 bitangent = normalize(cross(N, tangent));

    float HdotT = dot(H, tangent);
    float HdotB = dot(H, bitangent);
    float NdotH = max(dot(N, H), 0.0);

    float ax = roughnessX * roughnessX;
    float ay = roughnessY * roughnessY;

    float exponent = (HdotT * HdotT / ax + HdotB * HdotB / ay) / max(NdotH * NdotH, 0.001);
    return exp(-exponent) / (PI * ax * ay);
}

// Main Rendering

void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(vViewDirection);

    // Material properties
    vec3 albedo = uBaseColor;
    float metalness = uMetalness;
    float roughness = max(uRoughness, 0.04); // Prevent division by zero

    // F0 for ambient
    vec3 F0 = mix(vec3(0.04), albedo, metalness);

    // Blade Light Contribution
    vec3 bladeContribution = calculateBladeLight(vWorldPosition, N, V, albedo, metalness, roughness);

    // Ambient Light (simple IBL approximation)
    float NdotV = max(dot(N, V), 0.0);
    vec3 F = fresnelSchlickRoughness(NdotV, F0, roughness);

    vec3 kS = F;
    vec3 kD = (1.0 - kS) * (1.0 - metalness);

    // Ambient diffuse
    vec3 ambient = uAmbientColor * uAmbientIntensity;
    vec3 diffuse = kD * albedo * ambient;

    // Ambient specular (simplified)
    vec3 specularAmbient = F * ambient * 0.3;

    vec3 ambientContribution = diffuse + specularAmbient;

    // Anisotropic Highlight (Brushed Metal)
    // Tangent along the cylinder axis (vertical)
    vec3 tangent = normalize(vec3(0.0, 1.0, 0.0));

    // Find closest blade light direction for anisotropic highlight
    vec3 closestBlade = closestPointOnBlade(vWorldPosition);
    vec3 L = normalize(closestBlade - vWorldPosition);

    float aniso = anisotropicHighlight(N, V, L, tangent, roughness * 0.5, roughness * 2.0);
    vec3 anisoHighlight = uBladeColor * aniso * uBladeIntensity * 0.15;

    // Rim Lighting (Fresnel Edge Glow)
    float fresnel = pow(1.0 - NdotV, 4.0);
    vec3 rimLight = uBladeColor * fresnel * uBladeIntensity * 0.2;

    // Final Color Composition
    vec3 finalColor = vec3(0.0);
    finalColor += ambientContribution;
    finalColor += bladeContribution;
    finalColor += anisoHighlight;
    finalColor += rimLight;

    // Tone mapping (simple Reinhard)
    finalColor = finalColor / (finalColor + vec3(1.0));

    // Gamma correction
    finalColor = pow(finalColor, vec3(1.0 / 2.2));

    fragColor = vec4(finalColor, 1.0);
}
