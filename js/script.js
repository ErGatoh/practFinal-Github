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

const MASCOT_VERTEX_SHADER = `
uniform vec3 uTranslate;
varying vec2 vUv;
varying vec3 vViewNormal;
varying vec3 vModelPosition;

void main() {
    vUv = uv;
    vViewNormal = normalize(normalMatrix * normal);
    vModelPosition = position + uTranslate;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const MASCOT_FRAGMENT_SHADER = `
uniform sampler2D uAo;
uniform sampler2D uColorTex;
uniform sampler2D uMatcapTex;
uniform vec3 uColor;
uniform vec3 uLightDirection;

varying vec2 vUv;
varying vec3 vViewNormal;
varying vec3 vModelPosition;

vec3 blendSoftLight(vec3 base, vec3 blend) {
    return mix(
        sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend),
        2.0 * base * blend + base * base * (1.0 - 2.0 * blend),
        step(base, vec3(0.5))
    );
}

vec3 rgbToHsv(vec3 color) {
    vec4 k = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(color.bg, k.wz), vec4(color.gb, k.xy), step(color.b, color.g));
    vec4 q = mix(vec4(p.xyw, color.r), vec4(color.r, p.yzx), step(p.x, color.r));
    float difference = q.x - min(q.w, q.y);
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * difference + 1.0e-10)),
        difference / (q.x + 1.0e-10), q.x);
}

vec3 hsvToRgb(vec3 color) {
    vec4 k = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(color.xxx + k.xyz) * 6.0 - k.www);
    return color.z * mix(k.xxx, clamp(p - k.xxx, 0.0, 1.0), color.y);
}

vec4 permute(vec4 value) {
    return mod(((value * 34.0) + 1.0) * value, 289.0);
}

vec4 inverseSqrtApprox(vec4 value) {
    return 1.79284291400159 - 0.85373472095314 * value;
}

float simplexNoise(vec3 point) {
    const vec2 c = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 d = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 cell = floor(point + dot(point, c.yyy));
    vec3 corner = point - cell + dot(cell, c.xxx);
    vec3 greater = step(corner.yzx, corner.xyz);
    vec3 lesser = 1.0 - greater;
    vec3 offset1 = min(greater.xyz, lesser.zxy);
    vec3 offset2 = max(greater.xyz, lesser.zxy);
    vec3 corner1 = corner - offset1 + c.xxx;
    vec3 corner2 = corner - offset2 + 2.0 * c.xxx;
    vec3 corner3 = corner - 1.0 + 3.0 * c.xxx;
    cell = mod(cell, 289.0);
    vec4 hash = permute(permute(permute(
        cell.z + vec4(0.0, offset1.z, offset2.z, 1.0))
        + cell.y + vec4(0.0, offset1.y, offset2.y, 1.0))
        + cell.x + vec4(0.0, offset1.x, offset2.x, 1.0));
    float seventh = 1.0 / 7.0;
    vec3 normalized = seventh * d.wyz - d.xzx;
    vec4 index = hash - 49.0 * floor(hash * normalized.z * normalized.z);
    vec4 xIndex = floor(index * normalized.z);
    vec4 yIndex = floor(index - 7.0 * xIndex);
    vec4 x = xIndex * normalized.x + normalized.yyyy;
    vec4 y = yIndex * normalized.x + normalized.yyyy;
    vec4 height = 1.0 - abs(x) - abs(y);
    vec4 base0 = vec4(x.xy, y.xy);
    vec4 base1 = vec4(x.zw, y.zw);
    vec4 sign0 = floor(base0) * 2.0 + 1.0;
    vec4 sign1 = floor(base1) * 2.0 + 1.0;
    vec4 correction = -step(height, vec4(0.0));
    vec4 gradient0 = base0.xzyw + sign0.xzyw * correction.xxyy;
    vec4 gradient1 = base1.xzyw + sign1.xzyw * correction.zzww;
    vec3 point0 = vec3(gradient0.xy, height.x);
    vec3 point1 = vec3(gradient0.zw, height.y);
    vec3 point2 = vec3(gradient1.xy, height.z);
    vec3 point3 = vec3(gradient1.zw, height.w);
    vec4 normalization = inverseSqrtApprox(vec4(
        dot(point0, point0), dot(point1, point1),
        dot(point2, point2), dot(point3, point3)));
    point0 *= normalization.x;
    point1 *= normalization.y;
    point2 *= normalization.z;
    point3 *= normalization.w;
    vec4 attenuation = max(0.6 - vec4(
        dot(corner, corner), dot(corner1, corner1),
        dot(corner2, corner2), dot(corner3, corner3)), 0.0);
    attenuation *= attenuation;
    return 42.0 * dot(attenuation * attenuation, vec4(
        dot(point0, corner), dot(point1, corner1),
        dot(point2, corner2), dot(point3, corner3)));
}

void main() {
    vec3 matcapNormal = normalize(vViewNormal);
    float denominator = 2.8284271247461903 * sqrt(max(matcapNormal.z + 1.0, 0.0001));
    vec2 matcapUv = matcapNormal.xy / denominator + 0.5;
    vec3 matcap = texture2D(uMatcapTex, matcapUv).rgb;
    vec3 ao = texture2D(uAo, vUv).rgb;
    vec3 normal = normalize(vViewNormal + ao * 0.8);
    float light = dot(normal, normalize(uLightDirection)) * 0.5 + 0.5;
    light = pow(light, 12.0) * 0.5;

    vec3 color = uColor;
#ifdef USE_COLOR_TEXTURE
    color = texture2D(uColorTex, vUv).rgb;
#endif
    vec3 shaded = rgbToHsv(blendSoftLight(color, ao));

#if MASCOT_TYPE == 0
    float noise = simplexNoise(vModelPosition * 0.8 + vec3(0.0, 0.0, 1.2)) * 0.5 + 0.5;
    shaded.x += mix(-0.2, 0.1, noise);
    shaded.y += mix(0.0, 0.3, matcap.g) + 0.1;
    shaded.z += mix(-0.5, 0.7, matcap.g) + mix(0.0, 0.5, noise);
#elif MASCOT_TYPE == 1
    float noise = simplexNoise(vModelPosition * 1.6 + 0.5) * 0.5 + 0.5;
    shaded.x += mix(-0.1, 0.05, noise);
    shaded.y += mix(0.0, 0.3, matcap.g) + 0.05;
    shaded.z += mix(-0.5, 0.6, matcap.g) + mix(-0.3, 0.5, noise) + 0.1;
#elif MASCOT_TYPE == 2
    float noise = simplexNoise(vModelPosition * 0.6 + 0.5) * 0.5 + 0.5;
    shaded.x += mix(-0.1, 0.05, noise);
    shaded.y += mix(0.0, 0.3, matcap.g) + 0.05;
    shaded.z += mix(-0.3, 0.3, matcap.g) + 0.3;
#endif

    gl_FragColor = vec4(clamp(hsvToRgb(shaded) + light, 0.0, 1.0), 1.0);
}
`;

function shaderColorFromHex(hex) {
    return new THREE.Color().setRGB(
        ((hex >> 16) & 255) / 255,
        ((hex >> 8) & 255) / 255,
        (hex & 255) / 255
    );
}

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

    getTexture(url, colorSpace = THREE.SRGBColorSpace) {
        if (!url) return null;

        const cacheKey = `${colorSpace}:${url}`;
        if (!this.textureCache.has(cacheKey)) {
            const texture = this.textureLoader.load(
                url,
                undefined,
                undefined,
                (error) => console.error('Texture could not be loaded: ' + url, error)
            );
            texture.flipY = false;
            texture.colorSpace = colorSpace;
            this.textureCache.set(cacheKey, texture);
        }

        return this.textureCache.get(cacheKey);
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
        if (config.shaderProfile !== 'githubMascot') this.addLights();
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

    createMaterial(meshConfig, meshPosition) {
        const options = {
            ...this.config.defaultMaterial,
            ...meshConfig
        };

        if (this.config.shaderProfile === 'githubMascot') {
            return new THREE.ShaderMaterial({
                vertexShader: MASCOT_VERTEX_SHADER,
                fragmentShader: MASCOT_FRAGMENT_SHADER,
                uniforms: {
                    uAo: { value: this.stage.getTexture(options.aoMap, THREE.NoColorSpace) },
                    uColorTex: { value: this.stage.getTexture(options.colorMap, THREE.NoColorSpace) },
                    uMatcapTex: { value: this.stage.getTexture(options.matcapMap, THREE.NoColorSpace) },
                    uColor: { value: shaderColorFromHex(options.color) },
                    uLightDirection: { value: new THREE.Vector3(-1, 1, 3) },
                    uTranslate: { value: meshPosition }
                },
                defines: {
                    MASCOT_TYPE: this.config.mascotType ?? 0,
                    ...(options.colorMap ? { USE_COLOR_TEXTURE: 1 } : {})
                },
                toneMapped: false
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

                this.model.traverse((child) => {
                    if (!child.isMesh) return;

                    const meshConfig = this.config.materials?.[child.name] || {};
                    child.material = this.createMaterial(meshConfig, child.position);
                    child.castShadow = this.config.shaderProfile !== 'githubMascot';
                    child.receiveShadow = this.config.shaderProfile !== 'githubMascot';
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
    shaderProfile: 'githubMascot',
    mascotType: 0,
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
            color: 0xf763c1,
            aoMap: 'assets/head_sss-29270cf59da664ea.jpg',
            matcapMap: 'assets/mascot-7c495cf9822e0d5c.jpg'
        },
        face: {
            color: 0xff8fd6,
            aoMap: 'assets/head_sss-29270cf59da664ea.jpg',
            matcapMap: 'assets/mascot-7c495cf9822e0d5c.jpg'
        },
        eyeball: {
            color: 0xffffff,
            aoMap: 'assets/head_sss-29270cf59da664ea.jpg',
            matcapMap: 'assets/mascot-7c495cf9822e0d5c.jpg'
        },
        eye: {
            color: 0x000000,
            aoMap: 'assets/eye_sss-8e43fcedfb9ddaf9.jpg',
            colorMap: 'assets/eye_color-bb27e609004c77cc.jpg',
            matcapMap: 'assets/cat_eye-75fdf7af6c5dc157.jpg'
        },
        nose: {
            color: 0x000000,
            aoMap: 'assets/head_sss-29270cf59da664ea.jpg',
            matcapMap: 'assets/mascot-7c495cf9822e0d5c.jpg'
        }
    }
};

const stage = new ModelStage();
stage.add(catConfig);
