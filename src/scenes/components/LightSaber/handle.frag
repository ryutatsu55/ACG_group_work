// Disney BRDF Fragment Shader for Handle
// Based on Disney's Principled BRDF (Burley 2012)
// Adapted for Three.js GLSL3 with blade light integration

precision highp float;

#define PI 3.14159265358979323846


// Disney BRDF Uniforms (Simplified Set)

uniform vec3 uBaseColor;
uniform float uMetallic;
uniform float uRoughness;
uniform float uClearcoat;
uniform float uClearcoatGloss;
uniform float uSheen;
uniform float uSheenTint;
uniform float uSubsurface;

// Blade light properties
uniform vec3 uBladeColor;
uniform float uBladeIntensity;
uniform vec3 uBladeTipWorld;
uniform vec3 uBladeBaseWorld;

// Scene lighting
uniform vec3 uAmbientColor;
uniform float uAmbientIntensity;

// Varyings from vertex shader
in vec3 vWorldPosition;
in vec3 vWorldNormal;
in vec3 vViewDirection;
in vec2 vUv;
in vec3 vLocalPosition;

out vec4 fragColor;


// Disney BRDF Helper Functions


float sqr(float x) { return x * x; }

float SchlickFresnel(float u) {
    float m = clamp(1.0 - u, 0.0, 1.0);
    float m2 = m * m;
    return m2 * m2 * m; // pow(m, 5)
}

// GTR1: Used for clearcoat (Berry distribution)
float GTR1(float NdotH, float a) {
    if (a >= 1.0) return 1.0 / PI;
    float a2 = a * a;
    float t = 1.0 + (a2 - 1.0) * NdotH * NdotH;
    return (a2 - 1.0) / (PI * log(a2) * t);
}

// GTR2: GGX/Trowbridge-Reitz for specular
float GTR2(float NdotH, float a) {
    float a2 = a * a;
    float t = 1.0 + (a2 - 1.0) * NdotH * NdotH;
    return a2 / (PI * t * t);
}

// Smith GGX geometry term
float smithG_GGX(float NdotV, float alphaG) {
    float a = alphaG * alphaG;
    float b = NdotV * NdotV;
    return 1.0 / (NdotV + sqrt(a + b - a * b));
}

// sRGB to linear conversion
vec3 mon2lin(vec3 x) {
    return vec3(pow(x.r, 2.2), pow(x.g, 2.2), pow(x.b, 2.2));
}

// Linear to sRGB conversion
vec3 lin2mon(vec3 x) {
    return vec3(pow(x.r, 1.0/2.2), pow(x.g, 1.0/2.2), pow(x.b, 1.0/2.2));
}


// Disney BRDF Main Function


vec3 DisneyBRDF(vec3 L, vec3 V, vec3 N, vec3 baseColor) {
    float NdotL = dot(N, L);
    float NdotV = dot(N, V);
    
    if (NdotL < 0.0 || NdotV < 0.0) return vec3(0.0);

    vec3 H = normalize(L + V);
    float NdotH = dot(N, H);
    float LdotH = dot(L, H);

    vec3 Cdlin = mon2lin(baseColor);
    float Cdlum = 0.3 * Cdlin.r + 0.6 * Cdlin.g + 0.1 * Cdlin.b;

    vec3 Ctint = Cdlum > 0.0 ? Cdlin / Cdlum : vec3(1.0);
    vec3 Cspec0 = mix(0.08 * mix(vec3(1.0), Ctint, 0.0), Cdlin, uMetallic);
    vec3 Csheen = mix(vec3(1.0), Ctint, uSheenTint);

    // Diffuse fresnel
    float FL = SchlickFresnel(NdotL);
    float FV = SchlickFresnel(NdotV);
    float Fd90 = 0.5 + 2.0 * LdotH * LdotH * uRoughness;
    float Fd = mix(1.0, Fd90, FL) * mix(1.0, Fd90, FV);

    // Subsurface approximation
    float Fss90 = LdotH * LdotH * uRoughness;
    float Fss = mix(1.0, Fss90, FL) * mix(1.0, Fss90, FV);
    float ss = 1.25 * (Fss * (1.0 / (NdotL + NdotV) - 0.5) + 0.5);

    // Specular (isotropic GGX)
    float a = max(0.001, sqr(uRoughness));
    float Ds = GTR2(NdotH, a);
    float FH = SchlickFresnel(LdotH);
    vec3 Fs = mix(Cspec0, vec3(1.0), FH);
    float Gs = smithG_GGX(NdotL, a) * smithG_GGX(NdotV, a);

    // Sheen
    vec3 Fsheen = FH * uSheen * Csheen;

    // Clearcoat (ior = 1.5 -> F0 = 0.04)
    float Dr = GTR1(NdotH, mix(0.1, 0.001, uClearcoatGloss));
    float Fr = mix(0.04, 1.0, FH);
    float Gr = smithG_GGX(NdotL, 0.25) * smithG_GGX(NdotV, 0.25);

    // Combine all components
    vec3 diffuse = (1.0 / PI) * mix(Fd, ss, uSubsurface) * Cdlin;
    vec3 specular = Gs * Fs * Ds;
    vec3 clearcoat = vec3(0.25 * uClearcoat * Gr * Fr * Dr);
    
    return (diffuse + Fsheen) * (1.0 - uMetallic) + specular + clearcoat;
}

// Blade Light Calculation


vec3 closestPointOnBlade(vec3 p) {
    vec3 ba = uBladeTipWorld - uBladeBaseWorld;
    float t = clamp(dot(p - uBladeBaseWorld, ba) / dot(ba, ba), 0.0, 1.0);
    return uBladeBaseWorld + t * ba;
}

vec3 calculateBladeLight(vec3 worldPos, vec3 N, vec3 V) {
    vec3 closestPoint = closestPointOnBlade(worldPos);
    vec3 L = normalize(closestPoint - worldPos);
    float dist = length(closestPoint - worldPos);

    // Attenuation with quadratic falloff
    float attenuation = 1.0 / (1.0 + dist * dist * 0.8);
    attenuation *= uBladeIntensity;

    if (attenuation < 0.001) return vec3(0.0);

    // Disney BRDF for blade light
    vec3 brdf = DisneyBRDF(L, V, N, uBaseColor);
    
    // Radiance from blade
    vec3 radiance = uBladeColor * attenuation * 2.0;
    float NdotL = max(dot(N, L), 0.0);

    return brdf * radiance * NdotL;
}


// Main

void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(vViewDirection);

    // Blade light contribution (main and only direct light source)
    vec3 bladeContribution = calculateBladeLight(vWorldPosition, N, V);

    // Ambient contribution (very dim base illumination)
    vec3 Cdlin = mon2lin(uBaseColor);
    float NdotV = max(dot(N, V), 0.0);
    
    vec3 ambient = uAmbientColor * uAmbientIntensity;
    vec3 kD = (1.0 - uMetallic) * Cdlin;
    vec3 ambientContribution = kD * ambient;

    // Clearcoat reflection from blade (when blade is on)
    float FV = SchlickFresnel(NdotV);
    float clearcoatFromBlade = uClearcoat * FV * uBladeIntensity * 0.3;
    ambientContribution += uBladeColor * clearcoatFromBlade;

    // Sheen edge glow from blade light
    vec3 Ctint = Cdlin / max(0.3 * Cdlin.r + 0.6 * Cdlin.g + 0.1 * Cdlin.b, 0.001);
    vec3 Csheen = mix(vec3(1.0), Ctint, uSheenTint);
    vec3 sheenFromBlade = uSheen * FV * Csheen * uBladeColor * uBladeIntensity * 0.2;
    ambientContribution += sheenFromBlade * (1.0 - uMetallic);

    // Rim lighting from blade (Fresnel edge glow)
    float fresnel = pow(1.0 - NdotV, 4.0);
    vec3 rimLight = uBladeColor * fresnel * uBladeIntensity * 0.2;

    // Final composition
    vec3 finalColor = ambientContribution + bladeContribution + rimLight;

    // Tone mapping (Reinhard)
    finalColor = finalColor / (finalColor + vec3(1.0));

    // Gamma correction
    finalColor = lin2mon(finalColor);

    fragColor = vec4(finalColor, 1.0);
}
