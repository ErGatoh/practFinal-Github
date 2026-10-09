import * as THREE from 'three';
import {
    screenVertexShader,
    lightFragmentShader,
    outputFragmentShader,
    starVertexShader,
    starFragmentShader
} from './hero-stellar-shaders.js';

const FLOAT_PHASES = { cat: 0.33 * Math.PI * 2, copilot: 0.66 * Math.PI * 2, duck: 0 };
const easeOutCubic = (value) => 1 - Math.pow(1 - THREE.MathUtils.clamp(value, 0, 1), 3);
const easeOutExpo = (value) => value >= 1 ? 1 : 1 - Math.pow(2, -10 * Math.max(0, value));

// Fits GitHub's stellar effects to the existing hero without changing page scrolling.
export class HeroEffects {
    constructor({ stage, hero, models }) {
        this.stage = stage;
        this.hero = hero;
        this.models = models;
        this.visible = true;
        this.renderingEnabled = true;
        this.reducedMotion = false;
        this.interactionActive = false;
        this.interactionStrength = 0;
        this.motionTime = 0;
        this.introTime = 0;
        this.layoutDirty = true;
        this.lightDirty = true;
        this.ready = false;
        this.bounds = new THREE.Vector4();
        this.resolution = new THREE.Vector2(1, 1);
        this.lightProgress = new THREE.Vector4();
        this.starProgress = new THREE.Vector4();
        this.scene = new THREE.Scene();
        this.lightScene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-2.3, 2.3, 2.3, -2.3, 0.01, 100);
        this.camera.position.z = 10;
        this.lightTarget = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
        this.uniforms = {
            uCtaAnimTime: { value: 0 },
            uCtaProgress: { value: 0 }
        };

        const plane = new THREE.PlaneGeometry(2, 2);
        this.lightMaterial = new THREE.ShaderMaterial({
            vertexShader: screenVertexShader,
            fragmentShader: lightFragmentShader,
            uniforms: {
                ...this.uniforms,
                uColor1: { value: new THREE.Color(0x0e0aa2) },
                uColor2: { value: new THREE.Color(0x9a7cff) },
                uResolution: { value: this.resolution },
                uProgress: { value: this.lightProgress }
            },
            depthTest: false,
            depthWrite: false,
            blending: THREE.NoBlending
        });
        const light = new THREE.Mesh(plane, this.lightMaterial);
        light.frustumCulled = false;
        this.lightScene.add(light);
        this.outputMaterial = new THREE.ShaderMaterial({
            vertexShader: screenVertexShader,
            fragmentShader: outputFragmentShader,
            uniforms: { uLight: { value: this.lightTarget.texture } },
            transparent: true,
            premultipliedAlpha: true,
            depthTest: false,
            depthWrite: false
        });
        const output = new THREE.Mesh(plane, this.outputMaterial);
        output.frustumCulled = false;
        output.renderOrder = 0;
        this.scene.add(output);
        this.createStars();
    }

    createStars() {
        // All particles share one draw call; the GPU calculates their lifetimes and positions.
        const plane = new THREE.PlaneGeometry(0.04, 0.04);
        const geometry = new THREE.InstancedBufferGeometry();
        geometry.index = plane.index;
        geometry.setAttribute('position', plane.attributes.position);
        geometry.setAttribute('uv', plane.attributes.uv);
        geometry.instanceCount = 50;
        const positions = new Float32Array(50 * 3);
        const randoms = new Float32Array(50 * 3);
        for (let index = 0; index < 50; index++) {
            positions[index * 3] = THREE.MathUtils.lerp(Math.PI * 0.25, Math.PI * 0.75, Math.random());
            positions[index * 3 + 1] = Math.random();
            for (let axis = 0; axis < 3; axis++) randoms[index * 3 + axis] = Math.random();
        }
        geometry.setAttribute('atranslate', new THREE.InstancedBufferAttribute(positions, 3));
        geometry.setAttribute('arandom', new THREE.InstancedBufferAttribute(randoms, 3));
        const material = new THREE.ShaderMaterial({
            vertexShader: starVertexShader,
            fragmentShader: starFragmentShader,
            uniforms: {
                ...this.uniforms,
                uMask: { value: null },
                uRadius: { value: 2.3 },
                uOffsetY: { value: 2.2 },
                uProgress: { value: this.starProgress }
            },
            transparent: true,
            premultipliedAlpha: true,
            depthTest: false,
            depthWrite: false
        });
        this.stars = new THREE.Mesh(geometry, material);
        this.stars.frustumCulled = false;
        this.stars.renderOrder = 1;
        this.stars.visible = false;
        this.scene.add(this.stars);
        new THREE.TextureLoader().load('assets/star-9663b0f4de9d12b1.jpg', (texture) => {
            texture.colorSpace = THREE.NoColorSpace;
            material.uniforms.uMask.value = texture;
            this.ready = true;
            this.stars.visible = true;
            this.stage.requestRender();
        }, undefined, (error) => console.error('Hero star texture could not be loaded.', error));
    }

    setInteractionActive(active) {
        if (this.interactionActive === active) return;
        this.interactionActive = active;
        this.stage.requestRender();
    }

    setReducedMotion(reduced) {
        if (this.reducedMotion === reduced) return;
        this.reducedMotion = reduced;
        this.lightDirty = true;
        this.stage.requestRender();
    }

    setVisible(visible) {
        if (this.visible === visible) return;
        this.visible = visible;
        this.stage.requestRender();
    }

    setRenderingEnabled(enabled) {
        if (this.renderingEnabled === enabled) return;
        this.renderingEnabled = enabled;
        this.stage.requestRender();
    }

    resize() {
        this.layoutDirty = true;
    }

    updateLayout() {
        const rects = this.models.map(({ instance }) => instance.container.getBoundingClientRect())
            .filter((rect) => rect.width && rect.height);
        if (!rects.length) return;
        const left = Math.min(...rects.map((rect) => rect.left));
        const right = Math.max(...rects.map((rect) => rect.right));
        const bottom = Math.max(...rects.map((rect) => rect.bottom));
        const width = Math.min(1400, Math.max(700, window.innerWidth * 0.65));
        const height = width * 0.65;
        this.bounds.set((left + right - width) * 0.5, bottom - height, width, height);
        this.camera.left = -2.3 * width / height;
        this.camera.right = 2.3 * width / height;
        this.camera.updateProjectionMatrix();
        const ratio = Math.min(1.5, this.stage.renderer.getPixelRatio());
        const targetWidth = Math.max(1, Math.round(width * ratio * 0.1));
        const targetHeight = Math.max(1, Math.round(height * ratio * 0.1));
        if (this.resolution.x !== targetWidth || this.resolution.y !== targetHeight) {
            this.resolution.set(targetWidth, targetHeight);
            this.lightTarget.setSize(targetWidth, targetHeight);
            this.lightDirty = true;
        }
        this.layoutDirty = false;
    }

    update(time, elapsedMilliseconds) {
        if (this.layoutDirty) this.updateLayout();
        const delta = Math.min(Math.max(elapsedMilliseconds, 0), 64) / 1000;
        const target = this.interactionActive ? 1 : 0;
        if (this.reducedMotion) {
            this.interactionStrength = target;
            this.introTime = 10;
        } else {
            this.introTime = Math.min(10, this.introTime + delta);
            this.interactionStrength = THREE.MathUtils.lerp(this.interactionStrength, target, 1 - Math.exp(-delta / 0.22));
            if (Math.abs(this.interactionStrength - target) < 0.001) this.interactionStrength = target;
            this.motionTime += delta * this.interactionStrength;
        }
        this.lightProgress.set(
            easeOutCubic(this.introTime),
            easeOutCubic((this.introTime - 0.3) / 3),
            easeOutCubic(this.introTime / 5), 0
        );
        this.starProgress.set(easeOutCubic((this.introTime - 0.1)), easeOutExpo(this.introTime / 10), 0, 0);
        if (this.uniforms.uCtaProgress.value !== this.interactionStrength
            || this.uniforms.uCtaAnimTime.value !== this.motionTime || this.introTime < 5.1) this.lightDirty = true;
        this.uniforms.uCtaProgress.value = this.interactionStrength;
        this.uniforms.uCtaAnimTime.value = this.motionTime;
        for (const { name, instance } of this.models) {
            const phase = FLOAT_PHASES[name] || 0;
            const wave = this.reducedMotion ? 0 : Math.sin(this.motionTime + phase);
            const floating = wave * THREE.MathUtils.lerp(0.05, 0.18, this.interactionStrength);
            const turning = wave * THREE.MathUtils.lerp(0.05, 0.16, this.interactionStrength);
            instance.setInteractionPose({ offsetY: floating, rotationY: turning }, false);
            instance.setInteractionLight({
                color: 0x9a7cff,
                intensity: 0.38 + this.interactionStrength * 0.24,
                position: [0, -0.82, 2.5]
            }, false);
        }
        return !this.reducedMotion && (this.introTime < 10 || this.interactionStrength > 0 || target > 0);
    }

    render(renderer, viewportWidth, viewportHeight) {
        const target = renderer.getRenderTarget();
        const viewport = renderer.getViewport(new THREE.Vector4());
        const scissor = renderer.getScissor(new THREE.Vector4());
        const scissorTest = renderer.getScissorTest();
        const { x, y, z: width, w: height } = this.bounds;
        try {
            if (this.lightDirty) {
                renderer.setScissorTest(false);
                renderer.setRenderTarget(this.lightTarget);
                renderer.setViewport(0, 0, this.resolution.x, this.resolution.y);
                renderer.clear();
                renderer.render(this.lightScene, this.camera);
                this.lightDirty = false;
            }
            renderer.setRenderTarget(target);
            renderer.setViewport(x, viewportHeight - y - height, width, height);
            const heroRect = this.hero.getBoundingClientRect();
            const top = Math.max(0, y, heroRect.top);
            const bottom = Math.min(viewportHeight, y + height, heroRect.bottom);
            const left = Math.max(0, x);
            const right = Math.min(viewportWidth, x + width);
            if (right <= left || bottom <= top) return;
            renderer.setScissor(left, viewportHeight - bottom, right - left, bottom - top);
            renderer.setScissorTest(true);
            renderer.render(this.scene, this.camera);
        } finally {
            renderer.setRenderTarget(target);
            renderer.setViewport(viewport);
            renderer.setScissor(scissor);
            renderer.setScissorTest(scissorTest);
        }
    }
}
