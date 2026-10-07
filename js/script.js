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

export class ModelStage {
    constructor() {
        // Shared resources for every model instance.
        this.items = [];
        this.effects = [];
        this.modelCache = new Map();
        this.textureCache = new Map();
        this.materialCache = new WeakMap();
        this.loader = new GLTFLoader();
        this.textureLoader = new THREE.TextureLoader();
        this.pointer = null;
        this.tapPointer = null;
        this.frameID = null;
        this.lastFrameTime = 0;
        this.isMobile = window.matchMedia(MOBILE_QUERY).matches;

        this.renderer = new THREE.WebGLRenderer({
            antialias: !this.isMobile,
            alpha: true,
            premultipliedAlpha: true,
            powerPreference: 'low-power'
        });
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.autoClear = false;
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.domElement.className = 'model-canvas';
        this.renderer.domElement.setAttribute('aria-hidden', 'true');
        document.body.appendChild(this.renderer.domElement);

        // Load and render only visible containers.
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
            const followsPointer = this.items.some((item) => (
                item.visible && item.renderingEnabled && item.hasAction('follow-pointer')
            ));
            if (!followsPointer) return;

            this.pointer = { x: event.clientX, y: event.clientY };
            this.requestRender();
        }, { passive: true });
        window.addEventListener('pointerdown', (event) => {
            const followsTap = this.items.some((item) => (
                item.visible && item.renderingEnabled && item.hasAction('follow-tap')
            ));
            if (!followsTap) return;

            this.tapPointer = { x: event.clientX, y: event.clientY };
            this.requestRender();
        }, { passive: true });
        window.addEventListener('resize', () => this.resize());
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.frameID !== null) {
                cancelAnimationFrame(this.frameID);
                this.frameID = null;
            }
            this.requestRender();
        });

        this.resize();
    }

    add(config, target, options = {}) {
        const container = typeof target === 'string' ? document.getElementById(target) : target;

        if (!container) {
            console.error('Model container not found.');
            return null;
        }
        const mountedItem = this.items.find((item) => item.container === container);
        if (mountedItem) return mountedItem;

        const item = new InteractiveModel(this, config, container, options);
        this.items.push(item);
        this.observer.observe(container);
        return item;
    }

    addEffect(effect) {
        if (!effect || this.effects.includes(effect)) return effect || null;

        this.effects.push(effect);
        this.requestRender();
        return effect;
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

    getTexture(url, colorSpace = THREE.SRGBColorSpace) {
        if (!url) return null;

        const cacheKey = `${colorSpace}:${url}`;
        if (!this.textureCache.has(cacheKey)) {
            const texture = this.textureLoader.load(
                url,
                () => this.requestRender(),
                undefined,
                (error) => console.error('Texture could not be loaded: ' + url, error)
            );
            texture.flipY = false;
            texture.colorSpace = colorSpace;
            this.textureCache.set(cacheKey, texture);
        }

        return this.textureCache.get(cacheKey);
    }

    // Reuse materials between copies of the same model.
    getMaterial(config, key, createMaterial) {
        if (!this.materialCache.has(config)) this.materialCache.set(config, new Map());

        const configMaterials = this.materialCache.get(config);
        if (!configMaterials.has(key)) configMaterials.set(key, createMaterial());
        return configMaterials.get(key);
    }

    resize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.matchMedia(MOBILE_QUERY).matches;

        const pixelRatioLimit = this.isMobile ? 1 : 2;
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

        for (const effect of this.effects) effect.resize?.();

        this.requestRender();
    }

    clear() {
        this.renderer.setScissorTest(false);
        this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
        this.renderer.clear(true, true, true);
    }

    requestRender() {
        if (this.frameID !== null) return;

        const hasVisibleItem = this.items.some((item) => (
            item.visible && item.renderingEnabled && item.model
        ));
        const hasVisibleEffect = this.effects.some((effect) => (
            effect.visible && effect.renderingEnabled
        ));

        if (document.hidden || (!hasVisibleItem && !hasVisibleEffect)) {
            this.clear();
            return;
        }

        this.frameID = requestAnimationFrame((time) => this.render(time));
    }

    // Stop the loop as soon as all visible models settle.
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
        const elapsedTime = this.lastFrameTime ? time - this.lastFrameTime : 0;
        let keepRendering = false;

        for (const effect of this.effects) {
            if (!effect.visible || !effect.renderingEnabled) continue;

            keepRendering = effect.update(time, elapsedTime) || keepRendering;
            effect.render(this.renderer, viewportWidth, viewportHeight);
        }

        for (const item of this.items) {
            if (!item.visible || !item.renderingEnabled || !item.model) continue;

            const rect = item.container.getBoundingClientRect();
            const clipLeft = Math.max(0, rect.left);
            const clipRight = Math.min(viewportWidth, rect.right);
            const clipTop = Math.max(0, rect.top);
            const clipBottom = Math.min(viewportHeight, rect.bottom);
            if (clipRight <= clipLeft || clipBottom <= clipTop) continue;

            const interactionPoint = item.hasAction('follow-tap')
                ? this.tapPointer
                : this.pointer;
            keepRendering = item.update(interactionPoint, elapsedTime, rect) || keepRendering;
            const aspect = rect.width / rect.height;
            if (item.camera.aspect !== aspect) {
                item.camera.aspect = aspect;
                item.camera.updateProjectionMatrix();
            }

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
        }

        this.renderer.setScissorTest(false);
        this.lastFrameTime = time;
        if (keepRendering) this.requestRender();
    }
}

// Independent camera and rotation state for one container.
class InteractiveModel {
    constructor(stage, config, container, options) {
        this.stage = stage;
        this.config = config;
        this.container = container;
        this.options = options;
        this.basePositionY = options.positionY ?? config.positionY;
        this.actions = new Set(options.actions || []);
        this.pose = {};
        this.interactionPose = {};
        this.visible = false;
        this.renderingEnabled = true;
        this.model = null;
        this.loadPromise = null;
        this.mouseNDC = new THREE.Vector2(0, 0);
        this.headPosition = new THREE.Vector3();
        this.basePosition = new THREE.Vector3(0, this.basePositionY, 0);
        this.baseRotation = new THREE.Euler();
        this.pointerRotation = new THREE.Euler();
        this.interactionLightPosition = new THREE.Vector3(0, -0.8, 2.4);
        this.interactionLightViewPosition = new THREE.Vector3();
        this.interactionLightColor = new THREE.Color(0xa982ff);
        this.interactionLightIntensity = 0;
        this.interactionLight = null;
        this.limitX = config.degreesHorizontal * (Math.PI / 180);
        this.limitUp = config.degreesVerticalUp * (Math.PI / 180);
        this.limitDown = config.degreesVerticalDown * (Math.PI / 180);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        this.camera.position.set(0, 0, 5);
        if (config.useLights !== false) this.addLights();
        this.resize();
    }

    hasAction(action) {
        return this.actions.has(action);
    }

    setAction(action, isEnabled) {
        if (this.actions.has(action) === isEnabled) return;
        if (isEnabled) {
            this.actions.add(action);
        } else {
            this.actions.delete(action);
        }

        this.stage.requestRender();
    }

    // Suspend one instance without releasing its shared cached resources.
    setRenderingEnabled(isEnabled) {
        if (this.renderingEnabled === isEnabled) return;

        this.renderingEnabled = isEnabled;
        this.stage.requestRender();
    }

    // Applies only supplied values so independent actions can coexist.
    setPose(pose) {
        Object.assign(this.pose, pose);
        if (!this.model) return;

        this.applyCompositePose();
        this.stage.requestRender();
    }

    setInteractionPose(pose, requestRender = true) {
        Object.assign(this.interactionPose, pose);
        if (!this.model) return;

        this.applyCompositePose();
        if (requestRender) this.stage.requestRender();
    }

    setInteractionLight({ color, intensity, position }, requestRender = true) {
        if (color !== undefined) this.interactionLightColor.set(color);
        if (position) this.interactionLightPosition.set(...position);
        this.interactionLightIntensity = Math.max(0, intensity || 0);

        if (this.config.useLights !== false) {
            if (!this.interactionLight) {
                this.interactionLight = new THREE.PointLight(
                    this.interactionLightColor,
                    this.interactionLightIntensity,
                    8,
                    2
                );
                this.scene.add(this.interactionLight);
            }

            this.interactionLight.color.copy(this.interactionLightColor);
            this.interactionLight.intensity = this.interactionLightIntensity;
            this.interactionLight.position.copy(this.interactionLightPosition);
        }

        if (requestRender) this.stage.requestRender();
    }

    applyCompositePose() {
        const layout = this.pose;
        const interaction = this.interactionPose;

        this.model.position.set(
            this.basePosition.x + (layout.offsetX || 0) + (interaction.offsetX || 0),
            this.basePosition.y + (layout.offsetY || 0) + (interaction.offsetY || 0),
            this.basePosition.z + (layout.offsetZ || 0) + (interaction.offsetZ || 0)
        );
        this.model.rotation.set(
            this.baseRotation.x + (layout.rotationX || 0)
                + (interaction.rotationX || 0) + this.pointerRotation.x,
            this.baseRotation.y + (layout.rotationY || 0)
                + (interaction.rotationY || 0) + this.pointerRotation.y,
            this.baseRotation.z + (layout.rotationZ || 0)
                + (interaction.rotationZ || 0) + this.pointerRotation.z
        );
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
        const baseDistance = this.options.cameraDistance ?? this.config.cameraDistance ?? 5;
        const heightRatio = this.container.clientHeight / 600;
        const mobileDistanceFactor = Math.max(0.9, Math.min(1, heightRatio));
        this.camera.position.z = baseDistance * (this.stage.isMobile ? mobileDistanceFactor : 1);
        this.camera.position.y = this.stage.isMobile ? this.basePositionY : 0;
    }

    createMaterial(meshConfig, meshPosition) {
        const options = {
            ...this.config.defaultMaterial,
            ...meshConfig
        };

        if (this.config.createMaterial) {
            return this.config.createMaterial({
                stage: this.stage,
                config: this.config,
                options,
                meshPosition
            });
        }

        const mapURL = options.map;
        const emissiveMapURL = options.emissiveMap;
        delete options.map;
        delete options.emissiveMap;

        if (mapURL) options.map = this.stage.getTexture(mapURL);
        if (emissiveMapURL) options.emissiveMap = this.stage.getTexture(emissiveMapURL);

        return new THREE.MeshPhysicalMaterial(options);
    }

    load() {
        if (this.loadPromise) return this.loadPromise;

        this.loadPromise = this.stage.getModel(this.config.modelURL)
            .then((sourceModel) => {
                this.model = sourceModel.clone(true);

                let meshIndex = 0;
                this.model.traverse((child) => {
                    if (!child.isMesh) return;

                    const meshConfig = this.config.materials?.[child.name] || {};
                    const materialKey = `${meshIndex}:${child.name}`;
                    child.material = this.stage.getMaterial(
                        this.config,
                        materialKey,
                        () => this.createMaterial(meshConfig, child.position)
                    );
                    child.castShadow = this.config.castShadow ?? true;
                    child.receiveShadow = this.config.receiveShadow ?? true;
                    meshIndex += 1;
                });

                this.model.scale.setScalar(this.options.scale ?? this.config.scale);
                this.basePosition.set(0, this.basePositionY, 0);
                this.baseRotation.copy(this.model.rotation);
                this.applyCompositePose();

                this.model.traverse((child) => {
                    if (!child.isMesh) return;

                    child.onBeforeRender = (renderer, scene, camera, geometry, material) => {
                        const uniforms = material.uniforms;
                        if (!uniforms?.uInteractionLightIntensity) return;

                        this.interactionLightViewPosition
                            .copy(this.interactionLightPosition)
                            .applyMatrix4(camera.matrixWorldInverse);
                        uniforms.uInteractionLightPosition.value.copy(
                            this.interactionLightViewPosition
                        );
                        uniforms.uInteractionLightColor.value.copy(this.interactionLightColor);
                        uniforms.uInteractionLightIntensity.value = this.interactionLightIntensity;
                    };
                });
                this.scene.add(this.model);
                this.stage.requestRender();
            })
            .catch(() => {
                this.loadPromise = null;
            });

        return this.loadPromise;
    }

    update(pointer, elapsedTime, rect) {
        const followsInteraction = this.hasAction('follow-pointer')
            || this.hasAction('follow-tap');
        if (!followsInteraction || !pointer) return false;

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
        const differenceY = targetRotationY - this.pointerRotation.y;
        const differenceX = targetRotationX - this.pointerRotation.x;
        this.pointerRotation.y += differenceY * smoothing;
        this.pointerRotation.x += differenceX * smoothing;
        this.applyCompositePose();

        return Math.abs(differenceY) > 0.0001 || Math.abs(differenceX) > 0.0001;
    }
}
