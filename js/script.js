import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MOBILE_QUERY = '(max-width: 767px)';

const DEFAULT_LIGHTING = {
    ambient: { color: 0xffffff, intensity: 0.65 },
    directional: [
        { color: 0xffffff, intensity: 1.35, position: [-4, 3, 5], castShadow: true },
        { color: 0xd9caff, intensity: 0.16, position: [4, 1, 2] }
    ]
};

class ModelStage {
    constructor() {
        this.items = [];
        this.modelCache = new Map();
        this.textureCache = new Map();
        this.loader = new GLTFLoader();
        this.textureLoader = new THREE.TextureLoader();
        this.pointer = null;
        this.frameID = null;
        this.lastFrameTime = 0;
        this.isMobile = window.matchMedia(MOBILE_QUERY).matches;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.autoClear = false;
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.domElement.className = 'model-canvas';
        this.renderer.domElement.setAttribute('aria-hidden', 'true');
        document.body.appendChild(this.renderer.domElement);

        this.observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                const item = this.items.find((candidate) => candidate.container === entry.target);
                if (!item) continue;

                item.visible = entry.isIntersecting;
                if (item.visible) item.load();
            }

            this.requestRender();
        });

        window.addEventListener('pointermove', (event) => {
            this.pointer = { x: event.clientX, y: event.clientY };
            this.requestRender();
        });
        window.addEventListener('resize', () => this.resize());
        document.addEventListener('visibilitychange', () => this.requestRender());

        this.resize();
    }

    add(config) {
        const container = document.getElementById(config.containerID);

        if (!container) {
            console.error('Container not found: ' + config.containerID);
            return null;
        }
        if (this.items.some((item) => item.container === container)) {
            console.error('Container already has a model: ' + config.containerID);
            return null;
        }

        const item = new InteractiveModel(this, config, container);
        this.items.push(item);
        this.observer.observe(container);
        return item;
    }

    getModel(url) {
        if (!this.modelCache.has(url)) {
            const modelPromise = new Promise((resolve, reject) => {
                this.loader.load(
                    url,
                    (gltf) => resolve(gltf.scene),
                    undefined,
                    (error) => {
                        this.modelCache.delete(url);
                        console.error('Model could not be loaded: ' + url, error);
                        reject(error);
                    }
                );
            });
            this.modelCache.set(url, modelPromise);
        }

        return this.modelCache.get(url);
    }

    getColorTexture(url) {
        if (!url) return null;

        if (!this.textureCache.has(url)) {
            const texture = this.textureLoader.load(
                url,
                undefined,
                undefined,
                (error) => console.error('Texture could not be loaded: ' + url, error)
            );
            texture.flipY = false;
            texture.colorSpace = THREE.SRGBColorSpace;
            this.textureCache.set(url, texture);
        }

        return this.textureCache.get(url);
    }

    resize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.matchMedia(MOBILE_QUERY).matches;

        const pixelRatioLimit = this.isMobile ? 1.5 : 2;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioLimit));
        this.renderer.setSize(window.innerWidth, window.innerHeight, false);
        this.renderer.shadowMap.enabled = !this.isMobile;

        for (const item of this.items) {
            item.resize();

            if (wasMobile !== this.isMobile && item.model) {
                item.model.traverse((child) => {
                    if (child.isMesh) child.material.needsUpdate = true;
                });
            }
        }

        this.requestRender();
    }

    clear() {
        this.renderer.setScissorTest(false);
        this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
        this.renderer.clear(true, true, true);
    }

    requestRender() {
        if (this.frameID !== null) return;

        if (document.hidden || !this.items.some((item) => item.visible && item.model)) {
            this.clear();
            return;
        }

        this.frameID = requestAnimationFrame((time) => this.render(time));
    }

    render(time) {
        this.frameID = null;
        if (document.hidden) return;

        if (this.isMobile && time - this.lastFrameTime < 1000 / 30) {
            this.requestRender();
            return;
        }

        this.clear();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        let rendered = false;

        for (const item of this.items) {
            if (!item.visible || !item.model) continue;

            const rect = item.container.getBoundingClientRect();
            const clipLeft = Math.max(0, rect.left);
            const clipRight = Math.min(viewportWidth, rect.right);
            const clipTop = Math.max(0, rect.top);
            const clipBottom = Math.min(viewportHeight, rect.bottom);
            if (clipRight <= clipLeft || clipBottom <= clipTop) continue;

            item.update(this.pointer, time - this.lastFrameTime);
            item.camera.aspect = rect.width / rect.height;
            item.camera.updateProjectionMatrix();

            this.renderer.toneMappingExposure = item.config.exposure ?? 1.25;
            this.renderer.setViewport(
                rect.left,
                viewportHeight - rect.bottom,
                rect.width,
                rect.height
            );
            this.renderer.setScissor(
                clipLeft,
                viewportHeight - clipBottom,
                clipRight - clipLeft,
                clipBottom - clipTop
            );
            this.renderer.setScissorTest(true);
            this.renderer.clearDepth();
            this.renderer.render(item.scene, item.camera);
            rendered = true;
        }

        this.renderer.setScissorTest(false);
        this.lastFrameTime = time;
        if (rendered) this.requestRender();
    }
}

class InteractiveModel {
    constructor(stage, config, container) {
        this.stage = stage;
        this.config = config;
        this.container = container;
        this.visible = false;
        this.model = null;
        this.loadPromise = null;
        this.mouseNDC = new THREE.Vector2(0, 0);
        this.headPosition = new THREE.Vector3();
        this.limitX = config.degreesHorizontal * (Math.PI / 180);
        this.limitUp = config.degreesVerticalUp * (Math.PI / 180);
        this.limitDown = config.degreesVerticalDown * (Math.PI / 180);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        this.camera.position.set(0, 0, 5);
        this.addLights();
        this.resize();
    }

    addLights() {
        const lighting = { ...DEFAULT_LIGHTING, ...this.config.lighting };
        const ambient = lighting.ambient;
        this.scene.add(new THREE.AmbientLight(ambient.color, ambient.intensity));

        for (const lightConfig of lighting.directional || []) {
            const light = new THREE.DirectionalLight(lightConfig.color, lightConfig.intensity);
            light.position.set(...lightConfig.position);

            if (lightConfig.castShadow) {
                light.castShadow = true;
                light.shadow.mapSize.set(1024, 1024);
                light.shadow.camera.left = -6;
                light.shadow.camera.right = 6;
                light.shadow.camera.top = 6;
                light.shadow.camera.bottom = -6;
                light.shadow.camera.near = 0.5;
                light.shadow.camera.far = 20;
                light.shadow.bias = -0.0001;
                light.shadow.normalBias = 0.02;
            }

            this.scene.add(light);
        }
    }

    resize() {
        const baseDistance = this.config.cameraDistance ?? 5;
        const heightRatio = this.container.clientHeight / 600;
        const mobileDistanceFactor = Math.max(0.55, Math.min(1, heightRatio));
        this.camera.position.z = baseDistance * (this.stage.isMobile ? mobileDistanceFactor : 1);
        this.camera.position.y = this.stage.isMobile ? this.config.positionY : 0;
    }

    createMaterial(meshConfig) {
        const options = {
            ...this.config.defaultMaterial,
            ...meshConfig
        };

        const mapURL = options.map;
        const emissiveMapURL = options.emissiveMap;
        delete options.map;
        delete options.emissiveMap;

        if (mapURL) options.map = this.stage.getColorTexture(mapURL);
        if (emissiveMapURL) options.emissiveMap = this.stage.getColorTexture(emissiveMapURL);

        return new THREE.MeshPhysicalMaterial(options);
    }

    load() {
        if (this.loadPromise) return this.loadPromise;

        this.loadPromise = this.stage.getModel(this.config.modelURL)
            .then((sourceModel) => {
                this.model = sourceModel.clone(true);

                this.model.traverse((child) => {
                    if (!child.isMesh) return;

                    const meshConfig = this.config.materials?.[child.name] || {};
                    child.material = this.createMaterial(meshConfig);
                    child.castShadow = true;
                    child.receiveShadow = true;
                });

                this.model.scale.setScalar(this.config.scale);
                this.model.position.set(0, this.config.positionY, 0);
                this.scene.add(this.model);
                this.stage.requestRender();
            })
            .catch(() => {
                this.loadPromise = null;
            });

        return this.loadPromise;
    }

    update(pointer, elapsedTime) {
        if (!pointer) return;

        const rect = this.container.getBoundingClientRect();
        const mouseY = pointer.y + (this.config.offsetMouseY || 0);
        this.mouseNDC.x = ((pointer.x - rect.left) / rect.width) * 2 - 1;
        this.mouseNDC.y = -((mouseY - rect.top) / rect.height) * 2 + 1;

        this.headPosition.set(0, this.config.headHeight, 0);
        this.model.localToWorld(this.headPosition);
        this.headPosition.project(this.camera);

        const deltaX = this.mouseNDC.x - this.headPosition.x;
        const deltaY = this.mouseNDC.y - this.headPosition.y;

        let targetRotationY = deltaX * this.config.sensitivity;
        let targetRotationX = deltaY * this.config.sensitivity;
        if (this.config.invertHorizontal) targetRotationY = -targetRotationY;
        if (this.config.invertVertical) targetRotationX = -targetRotationX;

        targetRotationY = Math.max(-this.limitX, Math.min(this.limitX, targetRotationY));
        targetRotationX = Math.max(-this.limitUp, Math.min(this.limitDown, targetRotationX));

        const frameCount = Math.min(Math.max(elapsedTime, 0), 64) / (1000 / 60);
        const smoothing = 1 - Math.pow(1 - this.config.rotationSpeed, frameCount);
        this.model.rotation.y += (targetRotationY - this.model.rotation.y) * smoothing;
        this.model.rotation.x += (targetRotationX - this.model.rotation.x) * smoothing;
    }
}

// Add another config with a unique container ID to show more models at once.
const catConfig = {
    containerID: '3d-container',
    modelURL: 'assets/cat-53c4522f687c1719.glb',
    scale: 2.0,
    positionY: -1.0,
    headHeight: 0.8,
    degreesHorizontal: 20,
    degreesVerticalUp: 25,
    degreesVerticalDown: 15,
    sensitivity: 1.2,
    rotationSpeed: 0.03,
    invertHorizontal: false,
    invertVertical: true,
    offsetMouseY: -220,

    exposure: 1.5,

    defaultMaterial: {
        color: 0xffffff,
        roughness: 0.65,
        metalness: 0,
        clearcoat: 0
    },

    materials: {
        head: {
            color: 0xe64cff,
        },
        face: {
            color: 0xff9dff,
        },
        eyeball: {
            color: 0xffffff,
            roughness: 0.4
        },
        eye: {
            color: 0x222127,
            map: 'assets/cat_eye-75fdf7af6c5dc157.jpg',
            roughness: 0.18,
            clearcoat: 0.8,
            clearcoatRoughness: 0.1
        },
        nose: {
            color: 0x111111,
            roughness: 0.35
        }
    }
};

const stage = new ModelStage();
stage.add(catConfig);


