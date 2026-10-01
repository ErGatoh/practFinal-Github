import * as THREE from 'three';

export const HERO_EFFECT_CONFIG = {
    glow: {
        baseOpacity: 0.36,
        activeOpacity: 0.62,
        activeScale: 1.1,
        widthRatio: 0.55,
        minWidth: 520,
        maxWidth: 760,
        heightRatio: 0.55
    },
    light: {
        color: 0xb69aff,
        baseIntensity: 0.38,
        activeIntensity: 0.62,
        position: [0, -0.82, 2.5]
    },
    interaction: {
        smoothingSeconds: 0.22,
        reducedStrength: 0.2
    },
    particles: {
        poolSize: 32,
        tabletLimit: 24,
        desktopInterval: [0.12, 0.35],
        tabletInterval: [0.2, 0.45],
        lifetime: [0.8, 2.0],
        size: [3.5, 9]
    },
    motion: {
        copilot: {
            phase: 0.4,
            speed: 1.15,
            offsetY: 0.045,
            rotationX: 0.012,
            rotationZ: 0.028
        },
        cat: {
            phase: 2.1,
            speed: 1.32,
            offsetY: 0.05,
            rotationX: 0.018,
            rotationY: 0.012,
            rotationZ: 0.03
        },
        duck: {
            phase: 4.1,
            speed: 1,
            offsetY: 0.032,
            rotationY: 0.038,
            rotationZ: 0.018
        }
    }
};

const GLOW_VERTEX_SHADER = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const GLOW_FRAGMENT_SHADER = `
uniform float uOpacity;
uniform vec2 uCenter;
uniform vec2 uSize;
varying vec2 vUv;

void main() {
    vec2 localPosition = (vUv - uCenter) / uSize;
    float beamProgress = clamp(localPosition.y + 0.5, 0.0, 1.0);
    float edgeVariation = 1.0
        + sin(beamProgress * 13.0 + 0.8) * 0.025
        + sin(beamProgress * 29.0 - 0.5) * 0.012;
    float halfWidth = mix(0.08, 0.54, pow(beamProgress, 0.86)) * edgeVariation;
    float horizontalDistance = abs(localPosition.x) / max(halfWidth, 0.001);
    float sideFade = 1.0 - smoothstep(0.42, 1.12, horizontalDistance);
    float lowerFade = smoothstep(0.0, 0.11, beamProgress);
    float upperFade = 1.0 - smoothstep(0.78, 1.0, beamProgress);
    float centerGlow = exp(-horizontalDistance * horizontalDistance * 1.1);
    float longitudinalBrightness = mix(
        1.12,
        0.58,
        smoothstep(0.08, 0.9, beamProgress)
    );
    float glow = sideFade * lowerFade * upperFade;
    glow *= mix(0.48, 0.78, centerGlow) * longitudinalBrightness;
    glow = pow(glow, 1.28);

    vec3 outerColor = vec3(0.341, 0.267, 0.788);
    vec3 middleColor = vec3(0.471, 0.388, 1.0);
    vec3 innerColor = vec3(0.60, 0.48, 1.0);
    vec3 centerColor = vec3(0.82, 0.68, 1.0);
    vec3 color = mix(outerColor, middleColor, smoothstep(0.0, 0.5, glow));
    color = mix(color, innerColor, smoothstep(0.35, 0.72, glow));
    color = mix(color, centerColor, smoothstep(0.72, 1.0, glow));

    float alpha = glow * uOpacity;
    gl_FragColor = vec4(color * alpha, alpha);
}
`;

const PARTICLE_VERTEX_SHADER = `
attribute float aOpacity;
attribute float aSize;
attribute float aShape;
varying float vOpacity;
varying float vShape;
uniform float uPixelRatio;

void main() {
    vOpacity = aOpacity;
    vShape = aShape;
    gl_PointSize = aSize * uPixelRatio;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const PARTICLE_FRAGMENT_SHADER = `
varying float vOpacity;
varying float vShape;

void main() {
    vec2 point = (gl_PointCoord - 0.5) * 2.0;
    float radius = length(point);
    float dotShape = smoothstep(1.0, 0.12, radius);
    float verticalRay = smoothstep(0.2, 0.0, abs(point.x))
        * smoothstep(1.0, 0.08, abs(point.y));
    float horizontalRay = smoothstep(0.2, 0.0, abs(point.y))
        * smoothstep(1.0, 0.08, abs(point.x));
    float starShape = max(verticalRay, horizontalRay) * smoothstep(1.0, 0.18, radius);
    float alpha = mix(dotShape, starShape, vShape) * vOpacity;

    if (alpha < 0.01) discard;
    vec3 color = vec3(0.93, 0.9, 1.0);
    gl_FragColor = vec4(color * alpha, alpha);
}
`;

const randomBetween = ([minimum, maximum]) => (
    minimum + Math.random() * (maximum - minimum)
);

export class HeroEffects {
    constructor({ stage, hero, models }) {
        this.stage = stage;
        this.hero = hero;
        this.models = models;
        this.visible = true;
        this.renderingEnabled = true;
        this.interactionStrength = 0;
        this.targetInteractionStrength = 0;
        this.interactionActive = false;
        this.reducedMotion = false;
        this.motionTime = 0;
        this.spawnAccumulator = 0;
        this.nextSpawnDelay = randomBetween(HERO_EFFECT_CONFIG.particles.desktopInterval);
        this.aliveCount = 0;
        this.layoutDirty = true;
        this.tabletLayout = window.matchMedia('(max-width: 991.98px)');
        this.glowCenter = new THREE.Vector2();
        this.glowSize = new THREE.Vector2();

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(0, 1, 0, 1, 0.1, 100);
        this.camera.position.z = 10;
        this.createGlow();
        this.createParticles();
        this.applyVisualState();
    }

    createGlow() {
        this.glowMaterial = new THREE.ShaderMaterial({
            vertexShader: GLOW_VERTEX_SHADER,
            fragmentShader: GLOW_FRAGMENT_SHADER,
            uniforms: {
                uOpacity: { value: HERO_EFFECT_CONFIG.glow.baseOpacity },
                uCenter: { value: new THREE.Vector2(0.5, 0.5) },
                uSize: { value: new THREE.Vector2(1, 1) }
            },
            transparent: true,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
            premultipliedAlpha: true,
            toneMapped: false
        });
        this.glow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.glowMaterial);
        this.glow.frustumCulled = false;
        this.glow.renderOrder = 0;
        this.scene.add(this.glow);
    }

    createParticles() {
        const count = HERO_EFFECT_CONFIG.particles.poolSize;
        this.particlePositions = new Float32Array(count * 3);
        this.particleVelocities = new Float32Array(count * 2);
        this.particleAges = new Float32Array(count);
        this.particleLifetimes = new Float32Array(count);
        this.particleOpacities = new Float32Array(count);
        this.particleSizes = new Float32Array(count);
        this.particleShapes = new Float32Array(count);
        this.particleTwinkles = new Float32Array(count);
        this.particlePhases = new Float32Array(count);
        this.particleAges.fill(-1);

        this.particleGeometry = new THREE.BufferGeometry();
        this.positionAttribute = new THREE.BufferAttribute(this.particlePositions, 3);
        this.opacityAttribute = new THREE.BufferAttribute(this.particleOpacities, 1);
        this.sizeAttribute = new THREE.BufferAttribute(this.particleSizes, 1);
        this.shapeAttribute = new THREE.BufferAttribute(this.particleShapes, 1);
        this.positionAttribute.setUsage(THREE.DynamicDrawUsage);
        this.opacityAttribute.setUsage(THREE.DynamicDrawUsage);
        this.sizeAttribute.setUsage(THREE.DynamicDrawUsage);
        this.particleGeometry.setAttribute('position', this.positionAttribute);
        this.particleGeometry.setAttribute('aOpacity', this.opacityAttribute);
        this.particleGeometry.setAttribute('aSize', this.sizeAttribute);
        this.particleGeometry.setAttribute('aShape', this.shapeAttribute);

        this.particleMaterial = new THREE.ShaderMaterial({
            vertexShader: PARTICLE_VERTEX_SHADER,
            fragmentShader: PARTICLE_FRAGMENT_SHADER,
            uniforms: {
                uPixelRatio: { value: 1 }
            },
            transparent: true,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
            premultipliedAlpha: true,
            toneMapped: false
        });
        this.particlePoints = new THREE.Points(this.particleGeometry, this.particleMaterial);
        this.particlePoints.frustumCulled = false;
        this.particlePoints.renderOrder = 1;
        this.scene.add(this.particlePoints);
    }

    setInteractionActive(isActive) {
        if (this.interactionActive === isActive) return;
        this.interactionActive = isActive;

        if (this.reducedMotion) {
            this.interactionStrength = isActive
                ? HERO_EFFECT_CONFIG.interaction.reducedStrength
                : 0;
            this.targetInteractionStrength = this.interactionStrength;
            this.applyVisualState();
        } else {
            this.targetInteractionStrength = isActive ? 1 : 0;
        }

        this.stage.requestRender();
    }

    setReducedMotion(isReduced) {
        if (this.reducedMotion === isReduced) return;
        this.reducedMotion = isReduced;
        this.targetInteractionStrength = isReduced
            ? (this.interactionActive ? HERO_EFFECT_CONFIG.interaction.reducedStrength : 0)
            : (this.interactionActive ? 1 : 0);

        if (isReduced) {
            this.interactionStrength = this.targetInteractionStrength;
            this.clearParticles();
            this.applyVisualState();
        }

        this.stage.requestRender();
    }

    setVisible(isVisible) {
        if (this.visible === isVisible) return;
        this.visible = isVisible;
        this.stage.requestRender();
    }

    setRenderingEnabled(isEnabled) {
        if (this.renderingEnabled === isEnabled) return;
        this.renderingEnabled = isEnabled;
        this.stage.requestRender();
    }

    resize() {
        this.layoutDirty = true;
    }

    updateLayout() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        this.camera.right = viewportWidth;
        this.camera.bottom = viewportHeight;
        this.camera.updateProjectionMatrix();

        const visibleRects = this.models
            .map(({ instance }) => instance.container.getBoundingClientRect())
            .filter((rect) => rect.width > 0 && rect.height > 0);
        if (!visibleRects.length) return;

        const left = Math.min(...visibleRects.map((rect) => rect.left));
        const right = Math.max(...visibleRects.map((rect) => rect.right));
        const top = Math.min(...visibleRects.map((rect) => rect.top));
        const bottom = Math.max(...visibleRects.map((rect) => rect.bottom));
        const width = Math.min(
            HERO_EFFECT_CONFIG.glow.maxWidth,
            Math.max(HERO_EFFECT_CONFIG.glow.minWidth, viewportWidth * HERO_EFFECT_CONFIG.glow.widthRatio)
        );
        const height = width * HERO_EFFECT_CONFIG.glow.heightRatio;

        this.glowCenter.set((left + right) * 0.5, bottom - height * 0.32);
        this.glowSize.set(width, height);
        this.layoutDirty = false;
    }

    update(time, elapsedMilliseconds) {
        const elapsedSeconds = Math.min(Math.max(elapsedMilliseconds, 0), 64) / 1000;
        if (this.layoutDirty) this.updateLayout();

        const difference = this.targetInteractionStrength - this.interactionStrength;
        if (!this.reducedMotion && Math.abs(difference) > 0.001) {
            const smoothing = 1 - Math.exp(
                -elapsedSeconds / HERO_EFFECT_CONFIG.interaction.smoothingSeconds
            );
            this.interactionStrength += difference * smoothing;
        } else if (Math.abs(difference) <= 0.001) {
            this.interactionStrength = this.targetInteractionStrength;
        }

        const motionActive = !this.reducedMotion && this.interactionStrength > 0.001;
        if (motionActive) {
            this.motionTime += elapsedSeconds * this.interactionStrength;
            this.applyModelMotion();
        }

        if (!this.reducedMotion) this.updateParticles(time, elapsedSeconds);
        this.applyVisualState();

        const strengthChanging = Math.abs(
            this.targetInteractionStrength - this.interactionStrength
        ) > 0.001;
        return strengthChanging
            || (!this.reducedMotion && this.interactionActive)
            || motionActive
            || this.aliveCount > 0;
    }

    applyVisualState() {
        const glowConfig = HERO_EFFECT_CONFIG.glow;
        const strength = this.interactionStrength;
        const scale = THREE.MathUtils.lerp(1, glowConfig.activeScale, strength);
        this.glowMaterial.uniforms.uOpacity.value = THREE.MathUtils.lerp(
            glowConfig.baseOpacity,
            glowConfig.activeOpacity,
            strength
        );
        this.glowMaterial.uniforms.uCenter.value.set(
            this.glowCenter.x / Math.max(window.innerWidth, 1),
            1 - (this.glowCenter.y / Math.max(window.innerHeight, 1))
        );
        this.glowMaterial.uniforms.uSize.value.set(
            (this.glowSize.x * scale) / Math.max(window.innerWidth, 1),
            (this.glowSize.y * scale) / Math.max(window.innerHeight, 1)
        );

        const lightConfig = HERO_EFFECT_CONFIG.light;
        const intensity = THREE.MathUtils.lerp(
            lightConfig.baseIntensity,
            lightConfig.activeIntensity,
            strength
        );
        for (const { instance } of this.models) {
            instance.setInteractionLight({
                color: lightConfig.color,
                intensity,
                position: lightConfig.position
            }, false);
        }
    }

    applyModelMotion() {
        for (const { name, instance } of this.models) {
            const motion = HERO_EFFECT_CONFIG.motion[name];
            if (!motion) continue;

            const phase = this.motionTime * motion.speed + motion.phase;
            const baseSine = Math.sin(motion.phase);
            const baseCosine = Math.cos(motion.phase);
            instance.setInteractionPose({
                offsetY: (Math.sin(phase) - baseSine) * (motion.offsetY || 0),
                rotationX: (Math.sin(phase * 0.83) - Math.sin(motion.phase * 0.83))
                    * (motion.rotationX || 0),
                rotationY: (Math.cos(phase * 0.72) - Math.cos(motion.phase * 0.72))
                    * (motion.rotationY || 0),
                rotationZ: (Math.cos(phase) - baseCosine) * (motion.rotationZ || 0)
            }, false);
        }
    }

    updateParticles(time, elapsedSeconds) {
        const particleConfig = HERO_EFFECT_CONFIG.particles;
        const isTablet = this.tabletLayout.matches;
        const intervalRange = isTablet
            ? particleConfig.tabletInterval
            : particleConfig.desktopInterval;

        if (this.interactionActive && this.interactionStrength > 0.25) {
            this.spawnAccumulator += elapsedSeconds;
            if (this.spawnAccumulator >= this.nextSpawnDelay) {
                this.spawnAccumulator = 0;
                this.nextSpawnDelay = randomBetween(intervalRange);
                this.spawnParticle(isTablet ? particleConfig.tabletLimit : particleConfig.poolSize);
            }
        } else {
            this.spawnAccumulator = 0;
        }

        let aliveCount = 0;
        for (let index = 0; index < particleConfig.poolSize; index += 1) {
            if (this.particleAges[index] < 0) continue;

            this.particleAges[index] += elapsedSeconds;
            const lifetime = this.particleLifetimes[index];
            if (this.particleAges[index] >= lifetime) {
                this.particleAges[index] = -1;
                this.particleOpacities[index] = 0;
                continue;
            }

            const positionIndex = index * 3;
            this.particlePositions[positionIndex] += this.particleVelocities[index * 2]
                * elapsedSeconds;
            this.particlePositions[positionIndex + 1] += this.particleVelocities[index * 2 + 1]
                * elapsedSeconds;
            const lifeProgress = this.particleAges[index] / lifetime;
            const fadeIn = Math.min(lifeProgress / 0.18, 1);
            const fadeOut = Math.min((1 - lifeProgress) / 0.32, 1);
            const twinkle = this.particleTwinkles[index]
                ? 0.65 + Math.sin(time * 0.008 + this.particlePhases[index]) * 0.35
                : 1;
            this.particleOpacities[index] = Math.min(fadeIn, fadeOut) * twinkle * 0.88;
            aliveCount += 1;
        }

        this.aliveCount = aliveCount;
        this.positionAttribute.needsUpdate = true;
        this.opacityAttribute.needsUpdate = true;
    }

    spawnParticle(limit) {
        if (this.aliveCount >= limit) return;

        const index = this.particleAges.findIndex((age) => age < 0);
        if (index < 0) return;

        const positionIndex = index * 3;
        const velocityIndex = index * 2;
        this.particlePositions[positionIndex] = this.glowCenter.x
            + (Math.random() - 0.5) * this.glowSize.x * 0.28;
        this.particlePositions[positionIndex + 1] = this.glowCenter.y
            + this.glowSize.y * (0.34 + Math.random() * 0.12);
        this.particlePositions[positionIndex + 2] = 1;
        this.particleVelocities[velocityIndex] = (Math.random() - 0.5) * 18;
        this.particleVelocities[velocityIndex + 1] = -(10 + Math.random() * 18);
        this.particleAges[index] = 0;
        this.particleLifetimes[index] = randomBetween(HERO_EFFECT_CONFIG.particles.lifetime);
        this.particleOpacities[index] = 0;
        this.particleSizes[index] = randomBetween(HERO_EFFECT_CONFIG.particles.size);
        this.particleShapes[index] = Math.random() < 0.35 ? 1 : 0;
        this.particleTwinkles[index] = Math.random() < 0.45 ? 1 : 0;
        this.particlePhases[index] = Math.random() * Math.PI * 2;
        this.aliveCount += 1;
        this.sizeAttribute.needsUpdate = true;
        this.shapeAttribute.needsUpdate = true;
    }

    clearParticles() {
        this.particleAges.fill(-1);
        this.particleOpacities.fill(0);
        this.aliveCount = 0;
        this.spawnAccumulator = 0;
        this.opacityAttribute.needsUpdate = true;
    }

    render(renderer, viewportWidth, viewportHeight) {
        if (this.layoutDirty) this.updateLayout();
        renderer.setScissorTest(false);
        renderer.setViewport(0, 0, viewportWidth, viewportHeight);
        renderer.toneMappingExposure = 1;
        this.particleMaterial.uniforms.uPixelRatio.value = renderer.getPixelRatio();
        renderer.render(this.scene, this.camera);
    }
}
