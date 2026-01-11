import * as THREE from 'three';

export class Floor {
    constructor(scene) {
        // GridHelper(サイズ, 分割数, 中心線の色, グリッドの色)
        // サイズを大きく(200など)することで、遠くまで線が続くようになります
        const size = 100;
        const divisions = 100;
        
        // 色の設定 (ご友人の画面に合わせて白にしています。ピンクにしたい場合は 0xff00ff)
        const colorCenter = 0xffffff; 
        const colorGrid = 0xffffff;

        this.grid = new THREE.GridHelper(size, divisions, colorCenter, colorGrid);
        
        // 床の位置調整（必要であれば）
        this.grid.position.y = -4.0; // ライトセーバーの持ち手の下に来るように調整

        scene.add(this.grid);
    }
}