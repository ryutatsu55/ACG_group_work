export class PhysicsWorld {
  constructor() {
    // 状態データ
    this.mouse = { x: 0, y: 0 }; // マウス位置 (-1 ~ 1)
    this.saberState = {
      rotationX: 0,
      rotationZ: 0,
      swingSpeed: 0
    };

    // 前フレームのマウス位置（速度計算用）
    this.prevMouse = { x: 0, y: 0 };

    this.setupInput();
  }

  setupInput() {
    window.addEventListener('mousemove', (e) => {
      // 画面中央を(0,0)とする正規化座標
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
  }

  // 毎フレーム計算するメソッド
  update() {
    // 1. マウス位置から目標角度を計算 (簡易的な物理)
    const targetRotZ = -this.mouse.x * 1.5;
    const targetRotX = this.mouse.y * 1.0;

    // 2. 慣性をつける (線形補間: Lerp)
    this.saberState.rotationZ += (targetRotZ - this.saberState.rotationZ) * 0.1;
    this.saberState.rotationX += (targetRotX - this.saberState.rotationX) * 0.1;

    // 3. 速度を計算 (移動量の絶対値)
    const dist = Math.sqrt(
      Math.pow(this.mouse.x - this.prevMouse.x, 2) + 
      Math.pow(this.mouse.y - this.prevMouse.y, 2)
    );
    this.saberState.swingSpeed = dist * 100.0; // 適当な係数で強調

    // 次のフレームのために保存
    this.prevMouse.x = this.mouse.x;
    this.prevMouse.y = this.mouse.y;
  }

  // App.js がデータを取りに来るためのゲッター
  getSaberState() {
    return this.saberState;
  }
}