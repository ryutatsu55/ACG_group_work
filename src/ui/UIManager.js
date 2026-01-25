export class UIManager {
    constructor(sceneSystem, physicsSystem) {
        this.scene = sceneSystem;
        this.physics = physicsSystem;
        this.movementEnabled = true;

        this.debugParams = {
            rotX: 0.0,
            rotY: 0.0,
            rotZ: 0.0,
            posX: 0.0,
            posY: 0.0,
            posZ: 0.0,
            swingSpeed: 0.0
        };

        this.params = {
            saber_toggle: true,
            saber_mode: true,
            color: '#00ff00',
            sensitivity: 0.5,
            inertia: 0.5,
            sound: false,
            music: false,
            algorithm: "A",
            metallic: 0.9,
            roughness: 0.3,
            clearcoat: 0.0,
            clearcoatGloss: 1.0,
            sheen: 0.0,
            sheenTint: 0.5,
            subsurface: 0.0,
            handleColor: '#666666',
            flickerIntensity: 0.5,
            bloomStrength: 0.5,
            bloomRadius: 0.4,
            bloomThreshold: 0.1,
            exposure: 1.0,
            floorAttenuation: 0.1,
            floorMaxDist: 15.0
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.createUI();
                this.bindEvents();
                this.applyInitialState();
            });
        } else {
            this.createUI();
            this.bindEvents();
            this.applyInitialState();
        }

    }

    applyInitialState() {
        if (!this.scene || !this.scene.lightsaber) return;

        const s = this.scene.lightsaber;

        s.toggle(this.params.saber_toggle);
        s.setMode(this.params.saber_mode);
        s.setColor(this.params.color);
        s.setFlickerIntensity(this.params.flickerIntensity);
        s.setAlgorithm(this.params.algorithm);

        s.setMetallic?.(this.params.metallic);
        s.setRoughness?.(this.params.roughness);
        s.setClearcoat?.(this.params.clearcoat);
        s.setClearcoatGloss?.(this.params.clearcoatGloss);
        s.setSheen?.(this.params.sheen);
        s.setSheenTint?.(this.params.sheenTint);
        s.setSubsurface?.(this.params.subsurface);
        s.setHandleColor?.(this.params.handleColor);

        this.scene.setBloomStrength?.(this.params.bloomStrength);
        this.scene.setBloomRadius?.(this.params.bloomRadius);
        this.scene.setBloomThreshold?.(this.params.bloomThreshold);
        this.scene.setExposure?.(this.params.exposure);

        if (this.scene.floor) {
            this.scene.floor.setAttenuation?.(this.params.floorAttenuation);
            this.scene.floor.setMaxDist?.(this.params.floorMaxDist);
        }

        this.physics.setSensitivity(this.params.sensitivity);
        this.physics.setInertia(this.params.inertia);
    }


    createUI() {
        const panel = document.createElement('div');
        panel.id = 'ui-panel';

        panel.innerHTML = `
            <h2>Control Panel</h2>

            <h6>Light Settings</h6>

            <label>
                Saber On
                <input type="checkbox" id="saber_toggle" checked>
            </label>

            <label>
                Snoise Mode
                <input type="checkbox" id="saber_mode" checked>
            </label>

            <label>
                Sensitivity
                <input type="range" id="sensitivity" min="0.1" max="1" step="0.01" value="${this.params.sensitivity}">
            </label>

            <label>
                Inertia
                <input type="range" id="inertia" min="0.1" max="1" step="0.01" value="${this.params.inertia}">
            </label>

            <label>
                Flicker Intensity
                <input type="range" id="flickerIntensity" min="0" max="1" step="0.01" value="${this.params.flickerIntensity}">
            </label>

            <label>
                Blade Color
                <input type="color" id="color" value="${this.params.color}">
            </label>

            <h6>Handle Settings</h6>

            <label>
                Metallic
                <input type="range" id="metallic" min="0" max="1" step="0.01" value="${this.params.metallic}">
            </label>

            <label>
                Roughness
                <input type="range" id="roughness" min="0" max="1" step="0.01" value="${this.params.roughness}">
            </label>

            <label>
                Clearcoat
                <input type="range" id="clearcoat" min="0" max="1" step="0.01" value="${this.params.clearcoat}">
            </label>
            
            <label>
                Clearcoat Gloss
                <input type="range" id="clearcoatgloss" min="0" max="1" step="0.01" value="${this.params.clearcoatGloss}">
            </label>  
            
            <label>
                Sheen
                <input type="range" id="sheen" min="0" max="1" step="0.01" value="${this.params.sheen}">
            </label>    
            
            <label>
                Sheen Tint
                <input type="range" id="sheentint" min="0" max="1" step="0.01" value="${this.params.sheenTint}">
            </label> 
            
            <label>
                Subsurface
                <input type="range" id="subsurface" min="0" max="1" step="0.01" value="${this.params.subsurface}">
            </label>

            <label>
                Handle Color
                <input type="color" id="handlecolor" value="${this.params.handleColor}">
            </label>
            
            <h6>Audio Settings</h6>
            <label>
                Sound On
                <input type="checkbox" id="sound_toggle">
            </label>

            <label>
                Music On
                <input type="checkbox" id="music_toggle">
            </label>

            <h6>Rendering Settings</h6>

            <label>
                Algorithm
                <select id="algorithm">
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                </select>
            </label>

            <h6>Real-Time Status</h6>
            <div id="debug">
                <div class="my-panel">Swing Speed: <span id="dbg_swing"></span></div>
                <div class="my-panel">Rot: <span id="dbg_rot"></span></div>
                <div class="my-panel">Pos: <span id="dbg_pos"></span></div>
            </div>
        `;

        document.body.appendChild(panel);
    }

    bindEvents() {
        const $ = (id) => document.getElementById(id);

        $('saber_toggle').addEventListener('change', (e) => {
            this.params.saber_toggle = e.target.checked;
            if (this.scene.lightsaber) {
                this.scene.lightsaber.toggle(e.target.checked);
            }
        });

        $('sound_toggle').addEventListener('change', (e) => {
            this.params.sound = e.target.checked;

            if (this.scene.lightsaber && this.scene.lightsaber.setSoundEnable) {
                this.scene.lightsaber.setSoundEnable(e.target.checked);
            }
        });

        $('music_toggle').addEventListener('change', (e) => {
            this.params.music = e.target.checked;

            if (this.scene.lightsaber && this.scene.setMusicEnable) {
                this.scene.setMusicEnable(e.target.checked);
            }
        });

        $('saber_mode').addEventListener('change', (e) => {
            this.params.saber_mode = e.target.checked;
            if (this.scene.lightsaber) {
                this.scene.lightsaber.setMode(e.target.checked);
            }
        });

        $('color').addEventListener('input', (e) => {
            this.params.color = e.target.value;
            if (this.scene.lightsaber) {
                this.scene.lightsaber.setColor(e.target.value);
            }
        });

        $('handlecolor').addEventListener('input', (e) => {
            this.params.handleColorcolor = e.target.value;
            if (this.scene.lightsaber) {
                this.scene.lightsaber.setHandleColor(e.target.value);
            }
        });

        $('sensitivity').addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            this.params.sensitivity = v;
            this.physics.setSensitivity(v);
        });

        $('inertia').addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            this.params.inertia = v;
            this.physics.setInertia(v);
        });

        $('flickerIntensity').addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            this.params.flickerIntensity = v;
            if (this.scene.lightsaber) {
                this.scene.lightsaber.setFlickerIntensity(v);
            }
        });

        $('metallic').addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            this.params.metallic = v;
            if (this.scene.lightsaber) {
                this.scene.lightsaber.setMetallic(v);
            }
        });

        $('roughness').addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            this.params.roughness = v;
            if (this.scene.lightsaber) {
                this.scene.lightsaber.setRoughness(v);
            }
        });

        $('clearcoat').addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            this.params.clearcoat = v;
            if (this.scene.lightsaber) {
                this.scene.lightsaber.setClearcoat(v);
            }
        });        

        $('clearcoatgloss').addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            this.params.clearcoatGloss = v;
            if (this.scene.lightsaber) {
                this.scene.lightsaber.setClearcoatGloss(v);
            }
        });   
        
        $('sheen').addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            this.params.sheen = v;
            if (this.scene.lightsaber) {
                this.scene.lightsaber.setSheen(v);
            }
        });        

        $('sheentint').addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            this.params.sheenTint = v;
            if (this.scene.lightsaber) {
                this.scene.lightsaber.setSheenTint(v);
            }
        });       
        
        $('subsurface').addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            this.params.subsurface = v;
            if (this.scene.lightsaber) {
                this.scene.lightsaber.setSubsurface(v);
            }
        });        

        $('algorithm').addEventListener('change', (e) => {
            this.params.algorithm = e.target.value;
            if (this.scene.lightsaber) {
                this.scene.lightsaber.setAlgorithm(e.target.value);
            }
        });

        document.addEventListener('mousedown', (e) => {
            // Left mouse button only
            if (e.button !== 0) return;

            // Ignore clicks on the UI panel
            if (e.target.closest('#ui-panel')) return;

            this.movementEnabled = !this.movementEnabled;

            if (this.physics.setMovementEnabled) {
                this.physics.setMovementEnabled(this.movementEnabled);
            }

            // Optional cursor feedback
            document.body.style.cursor = this.movementEnabled ? 'default' : 'not-allowed';
        });

    }

    updateStatus(saber_state) {
        document.getElementById('dbg_swing').textContent =
            saber_state.swingSpeed.toFixed(3);

        document.getElementById('dbg_rot').textContent =
            `${saber_state.rotX.toFixed(2)}, ${saber_state.rotY.toFixed(2)}, ${saber_state.rotZ.toFixed(2)}`;

        document.getElementById('dbg_pos').textContent =
            `${saber_state.posX.toFixed(2)}, ${saber_state.posY.toFixed(2)}, ${saber_state.posZ.toFixed(2)}`;
    }
}
