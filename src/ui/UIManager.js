import GUI from 'lil-gui';

export class UIManager {
  constructor(sceneSystem, physicsSystem) {
    this.gui = new GUI();
    
    // UIが直接操作する対象を受け取る
    this.scene = sceneSystem;
    this.physics = physicsSystem;

    this.setupGUI();
  }

  setupGUI() {
    const params = {
      color: '#00ff00',
      sensitivity: 0.1 // Physics用のパラメータ例
    };

    const folder = this.gui.addFolder('Saber Settings');

    // 色変更：Scene担当のメソッドを呼ぶ
    folder.addColor(params, 'color').onChange((value) => {
      // sceneSystem が持っている lightsaber にアクセス
      this.scene.lightsaber.setColor(value);
    });

    // 感度変更：Physics担当に値を渡す (PhysicsWorldにメソッドが必要)
    // folder.add(params, 'sensitivity', 0.01, 0.5).onChange(...)
  }
}