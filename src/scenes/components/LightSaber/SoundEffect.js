import * as THREE from 'three';

export class SoundController {
  /**
   * @param {THREE.AudioListener} listener - 音を聞く人 (AudioListener用)
   * @param {THREE.Object3D} sourceMesh - 音が鳴る場所 (ライトセーバーの柄)
   */
  constructor(listener, sourceMesh) {
    this.listener = listener; 
    this.sourceMesh = sourceMesh;

    // カメラに耳 (Listener) を追加
    this.listener = new THREE.AudioListener();

    this.humSound = null;   // 待機音
    this.swingSound = null; // スイング音
    this.onSound = null;
    this.offSound = null;
    
    this.isLoaded = false;
    this.isOn = false;
    this.isEnabled = false;

    this._initSounds();
  }

  _initSounds() {
    const loader = new THREE.AudioLoader();

    // 1. アイドル音 (Hum) - 一定音量でループ
    this.humSound = new THREE.PositionalAudio(this.listener);
    loader.load('sound/idle.mp3', (buffer) => {
      this.humSound.setBuffer(buffer);
      this.humSound.setLoop(true);
      this.humSound.setVolume(0.5); // 待機時の音量
      this.humSound.setRefDistance(1.0);
      this.sourceMesh.add(this.humSound);
      
      // this.toggle(true); 
    });

    this.impactSound = new THREE.PositionalAudio(this.listener);
    loader.load('sound/impact.m4a', (buffer) => {
      this.impactSound.setBuffer(buffer);
      this.impactSound.setLoop(false);
      this.impactSound.setVolume(0.5); // 振るまで聞こえない
      this.impactSound.setRefDistance(1.0);
      this.sourceMesh.add(this.impactSound);
    });
    
    this.onSound = new THREE.PositionalAudio(this.listener);
    loader.load('sound/lightsaber-on.mp3', (buffer) => {
      this.onSound.setBuffer(buffer);
      this.onSound.setLoop(false);
      this.onSound.setVolume(1.0);
      this.onSound.setRefDistance(1.0);
      this.sourceMesh.add(this.onSound);
      
    });

    this.offSound = new THREE.PositionalAudio(this.listener);
    loader.load('sound/lightsaber-off.m4a', (buffer) => {
      this.offSound.setBuffer(buffer);
      this.offSound.setLoop(false);
      this.offSound.setVolume(1.0);
      this.offSound.setRefDistance(1.0);
      this.sourceMesh.add(this.offSound);

      this.isLoaded = true;
      
    });

  }

  setEnable(bool) {
    this.isEnabled = bool;

    if (!this.isLoaded) return;

    if (this.isEnabled) {
      if (this.isOn) {
        this.humSound.play();
      }
    } else {
        this.humSound.stop();
        this.onSound.stop();
        this.offSound.stop();
    }
  }

  // ON/OFF切り替え
  toggle(bool) {
    this.isOn = bool;

    if (!this.isLoaded || !this.isEnabled) return;

    if (this.isOn) {
      if (!this.humSound.isPlaying) this.humSound.play();
      this.offSound.stop();
      this.onSound.play();
    } else {
      this.humSound.stop();
      this.onSound.stop();
      this.offSound.play();
    }

    // ブラウザの自動再生ブロック対策 (再開)
    if (this.listener.context.state === 'suspended') {
      this.listener.context.resume();
    }
  }

  playImpact() {
    if (!this.isLoaded || !this.isEnabled) return;

    if (this.impactSound.isPlaying) {
      const soundClone = new THREE.PositionalAudio(this.listener);
      soundClone.setBuffer(this.impactSound.buffer);
      soundClone.setRefDistance(this.impactSound.getRefDistance());
      soundClone.setVolume(this.impactSound.getVolume());

      this.impactSound.parent.add(soundClone);
      soundClone.onEnded = () => {
        soundClone.parent.remove(soundClone);
      };

      soundClone.play();
      
    } else {
      this.impactSound.play();
    }
  }

  // 毎フレーム呼び出し: 速度を受け取って音量を更新
  update(speed) {
    if (!this.isEnabled) return;
    if (!this.isOn) return;
    if (!this.isLoaded) return;
    if (!this.humSound.isPlaying) return;

    const temp = Math.min(speed * 0.1, 1.0);
    const targetVolume = Math.max(temp, 0.3);

    const currentVolume = this.humSound.getVolume();
    const smoothVolume = currentVolume + (targetVolume - currentVolume) * 0.5;
    
    // this.humSound.setVolume(smoothVolume);
    this.humSound.setVolume(targetVolume);
  }
}
