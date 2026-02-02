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
            miniGame: true,
            algorithm: "B",
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

        this.onTrackingPauseChanged = null;
        this.trackingPaused = false;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.createUI();
                this.createInstructionHUD();
                this.bindEvents();
                this.applyInitialState();
            });
        } else {
            this.createUI();
            this.createInstructionHUD();
            this.bindEvents();
            this.applyInitialState();
        }
    }

    applyInitialState() {
        if (!this.scene || !this.scene.lightsaber) {
            // Still ensure physics & HUD status reflect initial tracking state
            if (this.physics?.setMovementEnabled) {
                this.physics.setMovementEnabled(this.movementEnabled);
            }
            this.updateInstructionStatus(this.movementEnabled);
            return;
        }

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

        this.physics.setMovementEnabled?.(this.movementEnabled);
        this.updateInstructionStatus(this.movementEnabled);
    }

    createUI() {
        const panel = document.createElement('div');
        panel.id = 'ui-panel';

        panel.innerHTML = `
        <h2>Control Panel</h2>

        <h6>Saber Settings</h6>

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

        <label>
            Mini-Game
            <input type="checkbox" id="minigame_toggle" checked>
        </label>

        <h6>Audio Settings</h6>
        <label>
            Sound On
            <input type="checkbox" id="sound_toggle">
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

        <h6 class="collapsible" data-target="handle-section">
            <span class="arrow">▶</span> Handle Settings
        </h6>
        <div id="handle-section" class="collapsible-content collapsed">
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
        </div>

        <h6 class="collapsible" data-target="bloom-section">
            <span class="arrow">▶</span> Bloom Settings
        </h6>
        <div id="bloom-section" class="collapsible-content collapsed">
            <label>
            Bloom Strength
            <input type="range" id="bloomStrength" min="0" max="3" step="0.01" value="${this.params.bloomStrength}">
            </label>

            <label>
            Bloom Radius
            <input type="range" id="bloomRadius" min="0" max="1" step="0.01" value="${this.params.bloomRadius}">
            </label>

            <label>
            Bloom Threshold
            <input type="range" id="bloomThreshold" min="0" max="1" step="0.01" value="${this.params.bloomThreshold}">
            </label>

            <label>
            Exposure
            <input type="range" id="exposure" min="0" max="3" step="0.01" value="${this.params.exposure}">
            </label>
        </div>

        <h6 class="collapsible" data-target="floor-section">
            <span class="arrow">▶</span> Floor Settings
        </h6>
        <div id="floor-section" class="collapsible-content collapsed">
            <label>
            Floor Attenuation
            <input type="range" id="floorAttenuation" min="0.01" max="1" step="0.01" value="${this.params.floorAttenuation}">
            </label>

            <label>
            Floor Max Distance
            <input type="range" id="floorMaxDist" min="1" max="50" step="0.5" value="${this.params.floorMaxDist}">
            </label>
        </div>

        <h6>Real-Time Status</h6>
        <div id="debug">
            <div class="my-panel">Swing Speed: <span id="dbg_swing"></span></div>
            <div class="my-panel">Rot: <span id="dbg_rot"></span></div>
            <div class="my-panel">Pos: <span id="dbg_pos"></span></div>
        </div>
    `;

        document.body.appendChild(panel);
        document.getElementById('algorithm').value = this.params.algorithm;
    }

    createInstructionHUD() {
        const hud = document.createElement('div');
        hud.id = 'hud-controls';
        hud.className = 'hud-controls';
        hud.innerHTML = `
        <div class="hud-title">Control Instruction</div>
        <ul class="hud-list hud-keys">
        <li>
            <span class="action">Curser</span>
            <span class="desc">Yield lightsaber</span>
        </li> 
        <li>
            <span class="action">Scroll</span>
            <span class="desc">Camera Zoom</span>
        </li>          
        <li>
            <span class="action">Drag</span>
            <span class="desc">Shift camera angle</span>
        </li>       
        <li>
            <span class="action">Left-Click</span>
            <span class="desc">Default camera angle</span>
        </li>
        <li>
        <span class="keys">
            <span class="key dpad">
            <span class="up">↑</span>
            <span class="left">←</span>
            <span class="right">→</span>
            <span class="down">↓</span>
            </span>
        </span>
        <span class="desc">Shift camera</span>
        </li>
        <li>
            <span class="keys">
            <kbd>Space</kbd>
            </span>
            <span class="desc">Enable mouse tracking</span>
        </li>
        <li>
            <span class="keys">
            <kbd>Esc</kbd>
            </span>
            <span class="desc">Disable mouse tracking</span>
        </li>
        </ul>
        <div class="hud-status">
        Mouse tracking: <span id="hud-saber-status" class="on">Enabled</span>
        </div>
  `;
        document.body.appendChild(hud);
    }

    updateInstructionStatus(enabled) {
        const el = document.getElementById('hud-saber-status');
        if (!el) return;
        el.textContent = enabled ? 'Enabled' : 'Disabled';
        el.classList.toggle('on', enabled);
        el.classList.toggle('off', !enabled);
    }

    setMovementEnabled(enabled) {
        this.movementEnabled = !!enabled;

        this.physics.setMovementEnabled?.(this.movementEnabled);
        this.setTrackingPaused(!this.movementEnabled);

        document.body.style.cursor = this.movementEnabled ? 'default' : 'not-allowed';

        this.updateInstructionStatus(this.movementEnabled);
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
            if (this.scene.lightsaber?.setSoundEnable) {
                this.scene.lightsaber.setSoundEnable(e.target.checked);
            }
        });

        $('minigame_toggle').addEventListener('change', (e) => {
            this.params.miniGame = e.target.checked;
            if (this.scene.projectileManager?.setEnabled) {
                this.scene.projectileManager.setEnabled(e.target.checked);
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
            this.params.handleColor = e.target.value;
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

        // Bloom controls
        $('bloomStrength').addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            this.params.bloomStrength = v;
            this.scene.setBloomStrength?.(v);
        });

        $('bloomRadius').addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            this.params.bloomRadius = v;
            this.scene.setBloomRadius?.(v);
        });

        $('bloomThreshold').addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            this.params.bloomThreshold = v;
            this.scene.setBloomThreshold?.(v);
        });

        $('exposure').addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            this.params.exposure = v;
            this.scene.setExposure?.(v);
        });

        // Floor controls
        $('floorAttenuation').addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            this.params.floorAttenuation = v;
            this.scene.floor?.setAttenuation?.(v);
        });

        $('floorMaxDist').addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            this.params.floorMaxDist = v;
            this.scene.floor?.setMaxDist?.(v);
        });

        document.querySelectorAll('.collapsible').forEach((header) => {
            header.addEventListener('click', () => {
                const targetId = header.getAttribute('data-target');
                const content = document.getElementById(targetId);
                const arrow = header.querySelector('.arrow');

                if (content.classList.contains('collapsed')) {
                    content.classList.remove('collapsed');
                    arrow.textContent = '▼';
                } else {
                    content.classList.add('collapsed');
                    arrow.textContent = '▶';
                }
            });
        });

        const onKeyDown = (e) => {
            if (e.code === 'Space') {
                e.preventDefault(); // prevent page scroll
                this.setMovementEnabled(true);
            } else if (e.code === 'Escape') {
                this.setMovementEnabled(false);
            }
        };
        window.addEventListener('keydown', onKeyDown, { passive: false });
    }

    updateStatus(saber_state) {
        document.getElementById('dbg_swing').textContent =
            saber_state.swingSpeed.toFixed(3);

        document.getElementById('dbg_rot').textContent =
            `${saber_state.rotX.toFixed(2)}, ${saber_state.rotY.toFixed(2)}, ${saber_state.rotZ.toFixed(2)}`;

        document.getElementById('dbg_pos').textContent =
            `${saber_state.posX.toFixed(2)}, ${saber_state.posY.toFixed(2)}, ${saber_state.posZ.toFixed(2)}`;
    }

    setTrackingPaused(v) {
        this.trackingPaused = !!v;
        if (this.onTrackingPauseChanged) this.onTrackingPauseChanged(this.trackingPaused);
    }

    isTrackingPaused() {
        return this.trackingPaused;
    }
}

