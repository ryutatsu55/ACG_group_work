// #version 300 es

precision mediump float;

uniform vec3 uColor;
uniform float uTime;
uniform float uMode;
uniform vec3 uCameraPosLocal;

in vec3 vLocalPosition;
in vec2 vUv;

out vec4 fragColor;

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
    return mod289(((x*34.0)+10.0)*x);
}
float snoise(vec2 v){
    // ... (前回のsnoiseの中身) ...
    // 省略しますが、必ず定義を入れてください
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

float sdSegment(vec3 p, vec3 a, vec3 b) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

void main() {
    // 1. レイの定義 (Ray Definition)
    vec3 ro = uCameraPosLocal; // Ray Origin (カメラ位置)
    vec3 rd = normalize(vLocalPosition - ro); // Ray Direction (視線方向)

    // 線分の定義 (ライトセーバーの芯)
    vec3 lineStart = vec3(0.0, 0.0, 0.0);
    vec3 lineEnd   = vec3(0.0, 4.0, 0.0);
    
    // 剣先・根元のフェード (UV座標は表面のものを使うのが安全)
    float verticalFade = smoothstep(-0.05, 0.03, vUv.y) * smoothstep(1.0, 0.9, vUv.y);

    // 2. レイマーチングの設定
    vec3 currentPos = vLocalPosition; 
    float stepSize = 0.02; // 1回の移動距離 (細かいほどきれいだが重い)
    int steps = 15;        // 何回サンプリングするか (多いほどきれい)
    
    float totalDensity = 0.0; // 光の蓄積量

    // 3. ボリュームレンダリング・ループ (Integration)
    for(int i = 0; i < steps; i++) {
        // 現在の点での「直線からの距離」を計算
        float dist = sdSegment(currentPos, lineStart, lineEnd)/verticalFade;
        if(dist > 2.0)break;
        
        // --- ノイズによる歪み ---
        float noiseVal = 0.0;
        if (uMode > 0.5) {
            // 時間と位置でノイズを生成
            noiseVal = snoise(vec2(currentPos.y * 2.0 , currentPos.x * 1.0 + uTime*10.0)) * 0.02;
        } else {
            // noiseVal = snoise(vec2(currentPos.y, uTime)) * 0.02;
            noiseVal = 0.0;
        }
        
        // 距離にノイズを加える (空間が歪むイメージ)
        // float noisyDist = dist + noiseVal;
        float noisyDist = dist;

        // --- 密度の計算 (Density Function) ---
        // 距離が近いほど密度が高い（明るい）。逆二乗の法則のようなカーブ。
        // abs()で負の値対策
        float density = 0.0005 / (pow(abs(noisyDist), 2.5) + 0.0001) + noiseVal;
        

        // 積算 (Additive)
        totalDensity += density;

        currentPos += rd * stepSize;
    }

    // 4. 色の合成
    vec3 coreColor = vec3(1.0); // コアは白より明るく
    vec3 glowColor = uColor;
    
    // 積算された密度をもとに最終カラーを決定
    vec3 finalColor = mix(glowColor, coreColor, smoothstep(0.5, 8.0, totalDensity));
    // vec3 finalColor = glowColor * totalDensity;
    
    // アルファ値も密度そのもの
    float alpha = smoothstep(0.0, 4.0, totalDensity);

    alpha *= verticalFade;
    // alpha = 1.0;

    fragColor = vec4(finalColor * verticalFade, alpha);
}

// void main() {
//   float speedGlow = uSwingSpeed * 0.5; 
//   vec3 glow = uColor + vec3(speedGlow);

//   // 定義した変数に出力
//   fragColor = vec4(glow, 1.0);
// }
