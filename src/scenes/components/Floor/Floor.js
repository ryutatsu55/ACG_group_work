import * as THREE from 'three';
import floorVertexShader from './floor.vert';
import floorFragmentShader from './floor.frag';

export class Floor {
    constructor(scene) {
        // Create a large plane geometry
        const size = 100;
        const geometry = new THREE.PlaneGeometry(size, size, 1, 1);
        geometry.rotateX(-Math.PI / 2); // Make it horizontal

        // Shader uniforms for blade-reactive lighting
        this.uniforms = {
            // Blade light properties
            uBladeColor: { value: new THREE.Color('#00ff00') },
            uBladeIntensity: { value: 0.0 },
            uBladeTipWorld: { value: new THREE.Vector3(0, 4, 0) },
            uBladeBaseWorld: { value: new THREE.Vector3(0, 0, 0) },
            // Floor material
            uFloorColor: { value: new THREE.Color('#1a1a2e') },
            uRoughness: { value: 0.8 },
            uMetallic: { value: 0.2 },
            uAttenuation: { value: 0.02 },
            uMaxDist: { value: 25.0 },
            // Scene lighting
            uAmbientColor: { value: new THREE.Color('#ffffff') },
            uAmbientIntensity: { value: 0.30 }
        };

        const material = new THREE.ShaderMaterial({
            vertexShader: floorVertexShader,
            fragmentShader: floorFragmentShader,
            uniforms: this.uniforms,
            side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.y = -4.0; // Same position as before

        scene.add(this.mesh);
    }

    // Update from lightsaber each frame
    updateFromLightsaber(lightsaber) {
        if (!lightsaber) return;

        // Get blade color from any algorithm's color
        this.uniforms.uBladeColor.value.copy(lightsaber.bladeColor);

        // Get intensity (blade scale)
        this.uniforms.uBladeIntensity.value = lightsaber.currentScale;

        // Get blade world positions from handle uniforms (already calculated)
        this.uniforms.uBladeTipWorld.value.copy(lightsaber.handleUniforms.uBladeTipWorld.value);
        this.uniforms.uBladeBaseWorld.value.copy(lightsaber.handleUniforms.uBladeBaseWorld.value);
    }

    // Allow UI to change floor color
    setFloorColor(hex) {
        this.uniforms.uFloorColor.value.set(hex);
    }

    setRoughness(value) {
        this.uniforms.uRoughness.value = value;
    }

    setMetallic(value) {
        this.uniforms.uMetallic.value = value;
    }

    setAmbientIntensity(value) {
        this.uniforms.uAmbientIntensity.value = value;
    }

    setAttenuation(value) {
        this.uniforms.uAttenuation.value = value;
    }

    setMaxDist(value) {
        this.uniforms.uMaxDist.value = value;
    }
}