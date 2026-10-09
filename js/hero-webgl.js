import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HeroEffects } from './hero-effects.js';
import { HERO_MODELS } from './hero-model-config.js';
import { heroMascotVertexShader, heroMascotFragmentShader } from './hero-model-shaders.js';

const easeOutExpo = (value) => value >= 1 ? 1 : 1 - Math.pow(2, -10 * Math.max(0, value));
const progress = (time, delay, duration) => THREE.MathUtils.clamp((time - delay) / duration, 0, 1);

export class HeroWebGL extends HeroEffects {
    constructor({ hero, canvas }) {
        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'low-power'
        });
        renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
        renderer.setClearColor(0x000000, 0);
        const stage = { renderer, requestRender: () => {} };
        super({ stage, hero, models: [] });
        stage.requestRender = () => this.requestRender();
        this.canvas = canvas;
        this.renderer = renderer;
        this.loader = new GLTFLoader();
        this.textureLoader = new THREE.TextureLoader();
        this.textures = new Map();
        this.mascots = [];
        this.mascotResolution = new THREE.Vector2(1, 1);
        this.loaded = false;
        this.loading = false;
        this.frameID = null;
        this.lastFrame = 0;
        this.camera.position.z = 3.0;
        this.resize();
    }

    async load() {
        if (this.loaded || this.loading) return;
        this.loading = true;
        try {
            const [cat, copilot, duck] = await Promise.all(
                ['cat', 'copilot', 'duck'].map((name) => this.loader.loadAsync(HERO_MODELS[name].url))
            );
            for (const [name, gltf] of Object.entries({ cat, copilot, duck })) {
                this.addMascot(name, gltf.scene);
            }
            this.loaded = true;
            this.loading = false;
            this.requestRender();
        } catch (error) {
            this.loading = false;
            console.error('Hero mascots could not be loaded.', error);
        }
    }

    texture(url, color = false) {
        if (!this.textures.has(url)) {
            const texture = this.textureLoader.load(url, () => this.requestRender());
            texture.flipY = false;
            texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
            this.textures.set(url, texture);
        }
        return this.textures.get(url);
    }

    addMascot(name, source) {
        const config = HERO_MODELS[name];
        const floatGroup = new THREE.Group();
        const entranceGroup = new THREE.Group();
        const modelGroup = new THREE.Group();
        const faceGroup = new THREE.Group();
        const reveal = new THREE.Vector3();
        floatGroup.add(entranceGroup);
        entranceGroup.add(modelGroup);
        modelGroup.add(faceGroup);
        modelGroup.scale.setScalar(config.scale);
        modelGroup.rotation.set(...config.rotation, 'ZYX');
        entranceGroup.position.set(...config.start);
        entranceGroup.scale.setScalar(0);
        entranceGroup.rotation.set(...config.startRotation);
        this.scene.add(floatGroup);

        source.traverse((child) => {
            if (!child.isMesh || !config.materials[child.name]) return;
            const settings = config.materials[child.name];
            const colorTexture = settings.colorMap ? this.texture(settings.colorMap, true) : null;
            const defines = { MASCOT_TYPE: name === 'cat' ? 0 : name === 'copilot' ? 1 : 2 };
            if (colorTexture) defines.USE_COLORTEX = 1;
            const material = new THREE.ShaderMaterial({
                vertexShader: heroMascotVertexShader,
                fragmentShader: heroMascotFragmentShader,
                defines,
                uniforms: {
                    uAo: { value: this.texture(settings.ao) },
                    uColorTex: { value: colorTexture },
                    uMatcapTex: { value: this.texture(settings.matcap || 'assets/mascot-7c495cf9822e0d5c.jpg') },
                    uColor: { value: new THREE.Color(settings.color) },
                    uTranslate: { value: child.position },
                    uViewDir: { value: this.camera.position },
                    uLightColor1: { value: new THREE.Color(config.lightColors[0]) },
                    uLightColor2: { value: new THREE.Color(config.lightColors[1]) },
                    uLightPos: { value: new THREE.Vector3(...config.lights[0]) },
                    uLightPos2: { value: new THREE.Vector3(...config.lights[1]) },
                    uResolution: { value: this.mascotResolution },
                    uProgress: { value: reveal },
                    uDiffuse_star: { value: this.lightTarget.texture },
                    uDiffuse_blue: { value: this.lightTarget.texture },
                    uTime: { value: 0 }
                },
                transparent: true
            });
            const mesh = new THREE.Mesh(child.geometry, material);
            mesh.position.copy(child.position);
            mesh.frustumCulled = false;
            mesh.renderOrder = 2;
            faceGroup.add(mesh);
        });
        this.mascots.push({ config, floatGroup, entranceGroup, faceGroup, reveal });
    }

    updateLayout() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        if (!width || !height) return;
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        if (this.bounds.z === width && this.bounds.w === height && this.pixelRatio === ratio) {
            this.layoutDirty = false;
            return;
        }
        this.pixelRatio = ratio;
        this.bounds.set(0, 0, width, height);
        this.renderer.setPixelRatio(ratio);
        this.renderer.setSize(width, height, false);
        this.camera.left = -2.3 * width / height;
        this.camera.right = 2.3 * width / height;
        this.camera.top = 2.3;
        this.camera.bottom = -2.3;
        this.camera.updateProjectionMatrix();
        const w = Math.max(1, Math.round(width * ratio * 0.1));
        const h = Math.max(1, Math.round(height * ratio * 0.1));
        this.mascotResolution.set(width * ratio, height * ratio);
        this.resolution.set(w, h);
        this.lightTarget.setSize(w, h);
        this.lightDirty = true;
        this.layoutDirty = false;
    }

    update(time, elapsedMilliseconds) {
        const keepRendering = super.update(time, elapsedMilliseconds);
        if (this.loaded) {
            const tablet = window.innerWidth >= 768 && window.innerWidth <= 1011;
            for (const mascot of this.mascots) {
                const { config, floatGroup, entranceGroup, faceGroup, reveal } = mascot;
                const elapsed = this.reducedMotion ? 10000 : this.introTime * 1000;
                const entrance = easeOutExpo(progress(elapsed, config.delay, config.duration));
                const rotation = easeOutExpo(progress(elapsed, config.delay, rotationDuration(config)));
                const destination = tablet ? config.tabletPosition : config.position;
                entranceGroup.position.set(
                    THREE.MathUtils.lerp(config.start[0], destination[0], entrance),
                    THREE.MathUtils.lerp(config.start[1], destination[1], entrance),
                    THREE.MathUtils.lerp(config.start[2], destination[2], entrance)
                );
                entranceGroup.rotation.set(
                    0,
                    THREE.MathUtils.lerp(config.startRotation[1], 0, rotation),
                    THREE.MathUtils.lerp(config.startRotation[2], 0, rotation)
                );
                entranceGroup.scale.setScalar(this.reducedMotion ? 1 : easeOutExpo(progress(elapsed, config.delay, 300)));
                reveal.x = progress(elapsed, config.delay, 500);
                const wave = this.reducedMotion ? 0 : Math.sin(this.motionTime + config.phase);
                floatGroup.position.y = wave * THREE.MathUtils.lerp(0.05, 0.18, this.interactionStrength);
                faceGroup.rotation.y = wave * THREE.MathUtils.lerp(0.05, 0.16, this.interactionStrength);
            }
        }
        return keepRendering;
    }

    requestRender() {
        if (this.frameID !== null || !this.loaded || !this.visible || !this.renderingEnabled || document.hidden) return;
        this.frameID = requestAnimationFrame((time) => {
            this.frameID = null;
            if (!this.visible || !this.renderingEnabled || document.hidden) return;
            const keepRendering = this.update(time, this.lastFrame ? time - this.lastFrame : 16);
            this.lastFrame = time;
            this.renderer.setRenderTarget(null);
            this.renderer.clear();
            this.render(this.renderer, this.canvas.clientWidth, this.canvas.clientHeight);
            if (keepRendering) this.requestRender();
        });
    }

    render(renderer, width, height) {
        const target = renderer.getRenderTarget();
        if (this.lightDirty) {
            renderer.setRenderTarget(this.lightTarget);
            renderer.setViewport(0, 0, this.lightTarget.width, this.lightTarget.height);
            renderer.clear();
            renderer.render(this.lightScene, this.camera);
            this.lightDirty = false;
        }
        renderer.setRenderTarget(target);
        renderer.setViewport(0, 0, width, height);
        renderer.render(this.scene, this.camera);
    }
}

function rotationDuration(config) {
    return config === HERO_MODELS.cat ? 3000 : config === HERO_MODELS.copilot ? 2400 : 2000;
}
