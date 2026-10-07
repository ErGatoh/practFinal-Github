import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
    CTA_MASCOT_CONFIGS,
    CTA_MODEL_URLS,
    CTA_TEXTURE_URLS
} from './cta-webgl-config.js';
import {
    backgroundFragmentShader,
    backgroundVertexShader,
    blackMascotFragmentShader,
    mascotFragmentShader,
    mascotVertexShader
} from './cta-webgl-shaders.js';

const wrapper = document.querySelector('.cta-mascots');
const canvas = wrapper?.querySelector('.cta-mascots-canvas');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const clamp = (value, minimum = 0, maximum = 1) => (
    Math.min(Math.max(value, minimum), maximum)
);
const lerp = (start, end, progress) => start + (end - start) * progress;
const easeOutExpo = (progress) => (
    progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
);

function supportsWebGL() {
    try {
        const testCanvas = document.createElement('canvas');
        return Boolean(
            window.WebGLRenderingContext
            && (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl'))
        );
    } catch {
        return false;
    }
}

class CtaMascotScene {
    constructor(target, targetCanvas) {
        this.wrapper = target;
        this.canvas = targetCanvas;
        this.renderer = null;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(30, 1, 0.01, 50);
        this.cameraTarget = new THREE.Vector3();
        this.resolution = new THREE.Vector2();
        this.backgroundProgress = new THREE.Vector4();
        this.backgroundColor = new THREE.Color(0x000000);
        this.mascotGroup = new THREE.Group();
        this.mascots = [];
        this.textures = {};
        this.visible = false;
        this.loaded = false;
        this.loading = false;
        this.animationStarted = false;
        this.animationComplete = false;
        this.animationStart = 0;
        this.frameID = null;
        this.scrollProgress = 0;
        this.pixelRatio = 1;

        this.scene.position.set(0.2, 0, 0);
        this.camera.position.set(0, 2, 3);
        this.camera.lookAt(this.scene.position);
        this.scene.add(this.camera, this.mascotGroup);
        this.mascotGroup.visible = false;

        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(this.wrapper);
        window.addEventListener('scroll', () => this.updateScroll(), { passive: true });
        document.addEventListener('visibilitychange', () => this.syncVisibility());
        reducedMotion.addEventListener('change', () => this.updateMotionPreference());
    }

    async initialize() {
        if (this.loading || this.loaded) return;
        this.loading = true;

        try {
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                canvas: this.canvas,
                powerPreference: 'low-power'
            });
            this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
            this.renderer.setClearColor(this.backgroundColor, 1);
            this.createBackground();
            this.resize();

            const [models, textures] = await Promise.all([
                this.loadModels(),
                this.loadTextures()
            ]);
            this.textures = textures;
            for (const name of ['cat', 'copilot', 'duck']) {
                this.createMascot(name, models[name]);
            }

            this.loaded = true;
            this.loading = false;
            this.updateScroll();
            if (reducedMotion.matches) {
                this.showStatic();
            } else if (this.visible) {
                this.startAnimation();
            }
            this.requestRender();
        } catch (error) {
            this.loading = false;
            this.wrapper.classList.add('is-unavailable');
            console.error('CTA mascot scene could not be loaded.', error);
        }
    }

    async loadModels() {
        const loader = new GLTFLoader();
        const entries = await Promise.all(
            Object.entries(CTA_MODEL_URLS).map(async ([name, url]) => {
                const gltf = await loader.loadAsync(url);
                return [name, gltf.scene];
            })
        );
        return Object.fromEntries(entries);
    }

    async loadTextures() {
        const loader = new THREE.TextureLoader();
        const entries = await Promise.all(
            Object.entries(CTA_TEXTURE_URLS).map(async ([name, url]) => {
                const texture = await loader.loadAsync(url);
                texture.flipY = false;
                texture.colorSpace = THREE.NoColorSpace;
                return [name, texture];
            })
        );
        return Object.fromEntries(entries);
    }

    createBackground() {
        const material = new THREE.ShaderMaterial({
            vertexShader: backgroundVertexShader,
            fragmentShader: backgroundFragmentShader,
            uniforms: {
                uColor: { value: new THREE.Color(0x674ef1) },
                uProgress: { value: this.backgroundProgress }
            },
            depthTest: false,
            depthWrite: false,
            transparent: true
        });
        const background = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), material);
        background.renderOrder = 0;
        this.scene.add(background);
    }

    createMascot(name, sourceModel) {
        const config = CTA_MASCOT_CONFIGS[name];
        const dropGroup = new THREE.Group();
        const placementGroup = new THREE.Group();
        const modelGroup = new THREE.Group();
        const progress = new THREE.Vector4();

        dropGroup.position.y = 0.7;
        placementGroup.position.set(...config.position);
        modelGroup.scale.set(...config.scale);
        modelGroup.rotation.set(...config.rotation);
        modelGroup.rotation.order = config.rotationOrder;
        dropGroup.add(placementGroup);
        placementGroup.add(modelGroup);
        this.mascotGroup.add(dropGroup);

        const commonUniforms = {
            u_resolution: { value: this.resolution },
            u_lightPos: { value: new THREE.Vector3(...config.lightPosition) },
            uProgress: { value: progress },
            uBgColor: { value: this.backgroundColor }
        };

        sourceModel.traverse((child) => {
            if (!child.isMesh) return;
            const materialConfig = config.materials[child.name];
            if (!materialConfig) return;

            const colorTexture = materialConfig.colorTexture
                ? this.textures[materialConfig.colorTexture]
                : null;
            const defines = { MASCOT_TYPE: config.type };
            if (colorTexture) defines.USE_COLORTEX = 1;
            const material = new THREE.ShaderMaterial({
                vertexShader: mascotVertexShader,
                fragmentShader: materialConfig.blackObject
                    ? blackMascotFragmentShader
                    : mascotFragmentShader,
                uniforms: {
                    u_ao: { value: this.textures[materialConfig.ao] },
                    u_color: { value: new THREE.Color(materialConfig.color) },
                    u_colorTex: { value: colorTexture },
                    u_matcapTex: { value: this.textures[materialConfig.matcap] },
                    u_noiseRange: { value: new THREE.Vector2(...materialConfig.noiseRange) },
                    u_fogRangeZ: { value: new THREE.Vector2(...materialConfig.fogRangeZ) },
                    u_translate: { value: child.position },
                    uSpecularFactor: { value: materialConfig.specularFactor },
                    ...commonUniforms
                },
                transparent: true,
                defines
            });
            const mesh = new THREE.Mesh(child.geometry, material);
            mesh.position.copy(child.position);
            mesh.renderOrder = 1;
            modelGroup.add(mesh);
        });

        this.mascots.push({ config, dropGroup, progress });
    }

    setVisible(isVisible) {
        this.visible = isVisible;
        if (isVisible) {
            if (this.loaded && !reducedMotion.matches) this.startAnimation();
            this.updateScroll();
            this.requestRender();
        } else {
            this.cancelRender();
        }
    }

    startAnimation() {
        if (this.animationStarted || this.animationComplete) return;
        this.animationStarted = true;
        this.animationStart = performance.now();
        this.mascotGroup.visible = true;
        this.requestRender();
    }

    applyAnimation(time) {
        if (!this.animationStarted || this.animationComplete) return;
        const elapsed = time - this.animationStart;
        const cameraProgress = easeOutExpo(clamp(elapsed / 2000));
        const angle = lerp(Math.PI * 0.1, Math.PI * 0.43, cameraProgress);
        this.camera.position.x = -Math.sin(angle) * 4;
        this.camera.position.z = Math.cos(angle) * 4;

        for (const mascot of this.mascots) {
            const elapsedForMascot = elapsed - mascot.config.delay;
            mascot.progress.x = clamp(elapsedForMascot / 500);
            mascot.dropGroup.position.y = lerp(
                0.7,
                0,
                easeOutExpo(clamp(elapsedForMascot / 1800))
            );
        }

        const backgroundElapsed = elapsed - 500;
        this.backgroundProgress.x = easeOutExpo(clamp(backgroundElapsed / 3000));
        this.backgroundProgress.y = clamp(backgroundElapsed / 500);
        this.backgroundProgress.z = easeOutExpo(clamp(backgroundElapsed / 4000));
        this.camera.lookAt(this.cameraTarget);

        if (elapsed >= 4500) {
            this.animationComplete = true;
            this.animationStarted = false;
        }
    }

    showStatic() {
        this.animationStarted = false;
        this.animationComplete = true;
        this.mascotGroup.visible = true;
        this.backgroundProgress.set(1, 1, 1, 0);
        for (const mascot of this.mascots) {
            mascot.progress.x = 1;
            mascot.dropGroup.position.y = 0;
        }
        const angle = Math.PI * 0.43;
        this.camera.position.x = -Math.sin(angle) * 4;
        this.camera.position.z = Math.cos(angle) * 4;
        this.updateScroll();
        this.camera.lookAt(this.cameraTarget);
        this.requestRender();
    }

    updateMotionPreference() {
        if (reducedMotion.matches) {
            this.showStatic();
        } else {
            this.requestRender();
        }
    }

    updateScroll() {
        const rect = this.wrapper.getBoundingClientRect();
        const rangeStart = window.innerHeight;
        const rangeEnd = -rect.height;
        this.scrollProgress = reducedMotion.matches
            ? 0.5
            : clamp((rangeStart - rect.top) / (rangeStart - rangeEnd));
        this.camera.position.y = lerp(2, -0.5, this.scrollProgress);
        this.camera.lookAt(this.cameraTarget);
        this.requestRender();
    }

    resize() {
        if (!this.renderer) return;
        const width = this.wrapper.clientWidth;
        const height = this.wrapper.clientHeight;
        if (!width || !height) return;

        this.pixelRatio = Math.min(1.5, window.devicePixelRatio || 1);
        this.resolution.set(width * this.pixelRatio, height * this.pixelRatio);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(this.pixelRatio);
        this.renderer.setSize(width, height, false);
        this.requestRender();
    }

    syncVisibility() {
        if (document.hidden) {
            this.cancelRender();
        } else {
            this.requestRender();
        }
    }

    requestRender() {
        if (!this.visible || !this.loaded || document.hidden || this.frameID !== null) return;
        this.frameID = requestAnimationFrame((time) => this.render(time));
    }

    cancelRender() {
        if (this.frameID === null) return;
        cancelAnimationFrame(this.frameID);
        this.frameID = null;
    }

    render(time) {
        this.frameID = null;
        if (!this.visible || !this.loaded || document.hidden) return;
        this.applyAnimation(time);
        this.renderer.render(this.scene, this.camera);
        if (this.animationStarted) this.requestRender();
    }
}

if (wrapper && canvas) {
    if (!supportsWebGL()) {
        wrapper.classList.add('is-unavailable');
    } else {
        const scene = new CtaMascotScene(wrapper, canvas);
        const loadObserver = new IntersectionObserver((entries, observer) => {
            if (!entries.some((entry) => entry.isIntersecting)) return;
            observer.disconnect();
            scene.initialize();
        }, { rootMargin: '250px 0px', threshold: 0 });
        const visibilityObserver = new IntersectionObserver((entries) => {
            for (const entry of entries) scene.setVisible(entry.isIntersecting);
        }, { threshold: 0.1 });

        loadObserver.observe(wrapper);
        visibilityObserver.observe(wrapper);
    }
}
