precision mediump float;

uniform vec3 uColor;

in vec3 vWorldPosition; // 世界座標を受け取る

out vec4 fragColor;

void main() {
    // 1. グリッドの設定
    float gridSize = 1.0; // 1マス = 1.0単位 (メートル)
    
    // 2. 座標をグリッドサイズで割る
    vec2 coord = vWorldPosition.xz / gridSize;
    
    // 3. 【重要】微分(fwidth)を使ったアンチエイリアスグリッド
    // これにより、距離に関係なくシャープな線が描ける
    // fract(...) で0~1の繰り返しを作り、中心(0.5)からの距離を測る
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
    
    // X軸とZ軸の線のうち、強い方を採用
    float line = min(grid.x, grid.y);
    
    // 線の太さ調整 (1.0 = 1ピクセル)
    float thickness = 1.5;
    
    // 線の強度 (0.0 〜 1.0)
    // line が thickness 以下なら 1.0、それ以外は 0.0 になる（少しぼかす）
    float gridPattern = 1.0 - min(line, thickness);

    // 4. 遠くをフェードアウト (中心からの距離)
    // 床の中心(0,0)からの距離を使って消す
    float dist = length(vWorldPosition.xz);
    float mask = 1.0 - smoothstep(10.0, 50.0, dist);

    // 5. 色の合成
    vec3 finalColor = uColor;
    
    // マスクとグリッドパターンを掛け合わせる
    float alpha = gridPattern * mask;

    // アルファが低すぎる場所は描画しない（パフォーマンス向上）
    if (alpha < 0.01) discard;

    fragColor = vec4(finalColor, alpha);
}