import * as THREE from 'three';
import {
    collaborationScreenVertexShader,
    collaborationAuraFragmentShader,
    collaborationStarVertexShader,
    collaborationStarFragmentShader
} from './collaboration-shaders.js';

export class CollaborationEffects {
    constructor(stage) {
        this.stage = stage;
        this.canvas = stage.canvas;
        this.visible = true;
        this.renderingEnabled = true;
        this.canvasSize = new THREE.Vector2(1, 1);
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 10);
        this.camera.position.z = 1;

        const aura = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            new THREE.ShaderMaterial({
                vertexShader: collaborationScreenVertexShader,
                fragmentShader: collaborationAuraFragmentShader,
                uniforms: { uCanvasSize: { value: this.canvasSize } },
                transparent: true,
                depthTest: false,
                depthWrite: false,
                toneMapped: false
            })
        );
        aura.frustumCulled = false;
        this.scene.add(aura);
        this.createStars();
        this.resize();
    }

    createStars() {
        const plane = new THREE.PlaneGeometry(1, 1);
        const geometry = new THREE.InstancedBufferGeometry();
        geometry.index = plane.index;
        geometry.setAttribute('position', plane.attributes.position);
        geometry.setAttribute('uv', plane.attributes.uv);

        const count = 110;
        const centers = new Float32Array(count * 2);
        const sizes = new Float32Array(count);
        const opacities = new Float32Array(count);
        let seed = 74291;
        const random = () => {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            return seed / 4294967296;
        };

        for (let index = 0; index < count; index++) {
            centers[index * 2] = 0.5 + (random() + random() - 1) * 0.25;
            centers[index * 2 + 1] = 0.34 + (random() + random() - 1) * 0.3;
            sizes[index] = 2 + random() * 8;
            opacities[index] = 0.24 + random() * 0.52;
        }

        geometry.instanceCount = count;
        geometry.setAttribute('aCenter', new THREE.InstancedBufferAttribute(centers, 2));
        geometry.setAttribute('aSize', new THREE.InstancedBufferAttribute(sizes, 1));
        geometry.setAttribute('aOpacity', new THREE.InstancedBufferAttribute(opacities, 1));

        const material = new THREE.ShaderMaterial({
            vertexShader: collaborationStarVertexShader,
            fragmentShader: collaborationStarFragmentShader,
            uniforms: {
                uCanvasSize: { value: this.canvasSize },
                uStarMask: { value: null }
            },
            transparent: true,
            depthTest: false,
            depthWrite: false,
            toneMapped: false
        });
        this.stars = new THREE.Mesh(geometry, material);
        this.stars.frustumCulled = false;
        this.stars.renderOrder = 1;
        this.stars.visible = false;
        this.scene.add(this.stars);

        new THREE.TextureLoader().load('assets/star-9663b0f4de9d12b1.jpg', (texture) => {
            texture.colorSpace = THREE.NoColorSpace;
            material.uniforms.uStarMask.value = texture;
            this.stars.visible = true;
            this.stage.requestRender();
        }, undefined, (error) => console.error('Collaboration stars could not be loaded.', error));
    }

    resize() {
        this.canvasSize.set(this.canvas.clientWidth || 1, this.canvas.clientHeight || 1);
    }

    update() {
        return false;
    }

    render(renderer) {
        renderer.setScissorTest(false);
        renderer.setViewport(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
        renderer.render(this.scene, this.camera);
    }
}
