import GUI from 'lil-gui';

export class UIManager {
  constructor(sceneSystem, physicsSystem) {
    this.gui = new GUI();
    
    // UIが直接操作する対象を受け取る
    this.scene = sceneSystem;
    this.physics = physicsSystem;

    this.debugParams = {
      velocity: 0.0,
      angle: 0.0
    };

    this.setupGUI();
  }

  setupGUI() {
    const debugFolder = this.gui.addFolder('Real-time Status');

    this.ctrlVelocity = debugFolder.add(this.debugParams, 'velocity');
    this.ctrlVelocity.name('Swing Speed').disable().listen();
    this.ctrlAngle = debugFolder.add(this.debugParams, 'angle');
    this.ctrlAngle.name('Angle (rad)').disable().listen();


    const params = {
      color: '#00ff00',
      sensitivity: 0.1, // Physics用のパラメータ例
      check: true,
      algorithm: "A"
    };

    const saber_folder = this.gui.addFolder('Saber Settings');

    // execute everytime value was changed
    saber_folder.addColor(params, 'color').onChange((value) => {
      // pass the value to the scene.lightsaber
      this.scene.lightsaber.setColor(value);
    });
    saber_folder.add(params, 'sensitivity', 0.01, 0.5).onChange((value) => {
        // this.physics.setSensitivity(value)
    });


    const music_folder = this.gui.addFolder('music Settings');

    const music_toggle = music_folder.add(params, 'check');
    music_toggle.name("music on/off");
    music_toggle.onChange((value) => {
    //   this.scene.lightsaber.setColor(value);
    });


    const render_folder = this.gui.addFolder('rendering Settings');

    const algorithm_options = ["A", "B", "C"];
    const algorithm_select = render_folder.add(params, 'algorithm', algorithm_options);
    algorithm_select.name("algorithm");
    algorithm_select.onChange((value) => {
    //   this.scene.lightsaber.setColor(value);
    });
  }

  updateStatus(velocity, angle) {
    // 内部の値を更新するだけで、.listen() があるので画面も変わる
    this.debugParams.velocity = velocity.toFixed(2); // 小数点2桁に丸める
    this.debugParams.angle = angle.toFixed(2);
  }
}