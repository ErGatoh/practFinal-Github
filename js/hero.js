import { getModelInstance } from './models.js';

// Hero controls.
const hero = document.querySelector('#hero');
const scrollScene = hero?.querySelector('.hero-scroll-scene');
const signupButton = hero?.querySelector('#heroSignupButton');
const starParticleGroup = hero?.querySelector('.hero-star-particles');
const navbar = document.querySelector('.navbar');

if (hero && scrollScene && navbar) {
    const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
    const MOBILE_QUERY = '(max-width: 767.98px)';
    const TABLET_QUERY = '(max-width: 991.98px)';
    const clamp = (value, minimum = 0, maximum = 1) => (
        Math.min(Math.max(value, minimum), maximum)
    );

    let scrollAnimationFrame = null;
    let motionAnimationFrame = null;
    let previousMotionTime = null;
    let activeModelTime = 0;
    let modelMotionSpeed = 0;
    let particleSpawnTime = 0;
    let isHeroVisible = true;
    let navbarHeight = 0;
    const particles = [];
    const motionSources = new Set();
    const mobileLayout = window.matchMedia(MOBILE_QUERY);
    const tabletLayout = window.matchMedia(TABLET_QUERY);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Hero-only poses preserve the reusable model defaults.
    const modelMotion = {
        cat: {
            rotationX: -0.08, rotationY: -0.38, rotationZ: -0.14,
            rotationDegrees: 4.5, rotationSeconds: 5.4,
            rise: 0.05, drop: 0.16, riseSeconds: 4.1
        },
        copilot: {
            rotationX: -0.1, rotationY: 0.34, rotationZ: 0.17,
            rotationDegrees: 4, rotationSeconds: 6.1,
            rise: 0.05, drop: 0.24, riseSeconds: 4.8
        },
        duck: {
            rotationX: -0.05, rotationY: -0.48, rotationZ: -0.12,
            rotationDegrees: 3.8, rotationSeconds: 5.7, rise: 0.045, riseSeconds: 4.5
        }
    };

    const heroModels = Array.from(hero.querySelectorAll('[data-hero-model]'))
        .map((container) => ({
            instance: getModelInstance(container),
            motion: modelMotion[container.dataset.heroModel] || null,
            renderingEnabled: true
        }))
        .filter(({ instance, motion }) => instance && motion);

    for (const { instance, motion } of heroModels) {
        instance.setPose({
            rotationX: motion.rotationX,
            rotationY: motion.rotationY,
            rotationZ: motion.rotationZ,
            offsetY: 0
        });
    }

    const setHeroModelsRendering = (isEnabled) => {
        for (const model of heroModels) {
            model.renderingEnabled = isEnabled;
            model.instance.setRenderingEnabled(isEnabled);
        }
    };

    const removeParticle = (particle, index) => {
        particle.element.remove();
        particles.splice(index, 1);
    };

    const clearParticles = () => {
        while (particles.length) {
            removeParticle(particles[particles.length - 1], particles.length - 1);
        }
        particleSpawnTime = 0;
    };

    // Emit only through the upper half of the glow.
    const spawnParticle = () => {
        if (!starParticleGroup) return;

        const particleLimit = tabletLayout.matches ? 5 : 7;
        if (particles.length >= particleLimit) return;

        const element = document.createElementNS(SVG_NAMESPACE, 'circle');
        const angle = Math.PI * (1.06 + Math.random() * 0.88);
        const speed = 18 + Math.random() * 16;
        const particle = {
            element,
            x: 500 + (Math.random() - 0.5) * 12,
            y: 458 + (Math.random() - 0.5) * 7,
            velocityX: Math.cos(angle) * speed,
            velocityY: Math.sin(angle) * speed,
            age: 0,
            radius: 0.65 + Math.random() * 0.85
        };

        element.setAttribute('cx', '0');
        element.setAttribute('cy', '0');
        element.setAttribute('r', particle.radius.toFixed(2));
        element.setAttribute('opacity', '0');
        starParticleGroup.append(element);
        particles.push(particle);
    };

    const updateParticles = (elapsedSeconds, motionRequested) => {
        if (!motionRequested) {
            particleSpawnTime = 0;
            return;
        }

        particleSpawnTime += elapsedSeconds;
        const spawnInterval = tabletLayout.matches ? 0.85 : 0.65;

        while (particleSpawnTime >= spawnInterval) {
            particleSpawnTime -= spawnInterval;
            spawnParticle();
        }

        for (let index = particles.length - 1; index >= 0; index -= 1) {
            const particle = particles[index];
            particle.age += elapsedSeconds;
            particle.x += particle.velocityX * elapsedSeconds;
            particle.y += particle.velocityY * elapsedSeconds;

            const ellipseDistance = (
                ((particle.x - 500) / 430) ** 2
                + ((particle.y - 460) / 300) ** 2
            );
            if (ellipseDistance >= 1 || particle.age >= 5) {
                removeParticle(particle, index);
                continue;
            }

            const fadeIn = clamp(particle.age / 0.18);
            const fadeOut = clamp((1 - ellipseDistance) / 0.24);
            const opacity = Math.min(fadeIn, fadeOut) * 0.76;
            particle.element.setAttribute(
                'transform',
                `translate(${particle.x.toFixed(2)} ${particle.y.toFixed(2)})`
            );
            particle.element.setAttribute('opacity', opacity.toFixed(3));
        }
    };

    const isMotionRequested = () => (
        motionSources.size > 0
        && isHeroVisible
        && !document.hidden
        && !mobileLayout.matches
        && !reducedMotion.matches
    );

    // Slow the phase itself so models freeze at the reached pose.
    const updateHeroMotion = (time) => {
        const frameInterval = 1000 / (tabletLayout.matches ? 24 : 30);
        if (previousMotionTime === null) previousMotionTime = time - frameInterval;

        const elapsedMilliseconds = time - previousMotionTime;
        if (elapsedMilliseconds < frameInterval) {
            motionAnimationFrame = window.requestAnimationFrame(updateHeroMotion);
            return;
        }

        const elapsedSeconds = Math.min(elapsedMilliseconds, 64) / 1000;
        const motionRequested = isMotionRequested();
        previousMotionTime = time;

        if (motionRequested) {
            modelMotionSpeed = Math.min(1, modelMotionSpeed + elapsedSeconds / 0.28);
        } else {
            modelMotionSpeed = Math.max(0, modelMotionSpeed - elapsedSeconds / 0.62);
        }

        activeModelTime += elapsedSeconds * modelMotionSpeed;
        updateParticles(elapsedSeconds, motionRequested);

        if (modelMotionSpeed > 0) {
            for (const { instance, motion, renderingEnabled } of heroModels) {
                if (!renderingEnabled) continue;

                const rotationPhase = (activeModelTime / motion.rotationSeconds) * Math.PI * 2;
                const risePhase = (activeModelTime / motion.riseSeconds) * Math.PI * 2;
                const verticalWave = Math.sin(risePhase);
                const offsetY = motion.drop
                    ? verticalWave * (verticalWave > 0 ? motion.drop : motion.rise)
                    : (1 - Math.cos(risePhase)) * motion.rise * 0.5;
                instance.setPose({
                    rotationX: motion.rotationX,
                    rotationY: motion.rotationY,
                    rotationZ: motion.rotationZ - Math.sin(rotationPhase)
                        * motion.rotationDegrees * (Math.PI / 180),
                    offsetY
                });
            }
        }

        if (motionRequested || modelMotionSpeed > 0) {
            motionAnimationFrame = window.requestAnimationFrame(updateHeroMotion);
        } else {
            motionAnimationFrame = null;
            previousMotionTime = null;
        }
    };

    const syncHeroMotion = () => {
        const motionRequested = isMotionRequested();
        hero.classList.toggle('is-hero-motion-active', motionRequested);

        if (document.hidden || mobileLayout.matches || reducedMotion.matches) {
            if (motionAnimationFrame !== null) window.cancelAnimationFrame(motionAnimationFrame);
            motionAnimationFrame = null;
            previousMotionTime = null;
            modelMotionSpeed = 0;
            clearParticles();
            return;
        }

        if ((motionRequested || modelMotionSpeed > 0)
            && motionAnimationFrame === null) {
            previousMotionTime = null;
            motionAnimationFrame = window.requestAnimationFrame(updateHeroMotion);
        }
    };

    // Desktop and tablet keep the composition fixed while it scales and fades.
    const updateHero = () => {
        const hasScrolled = window.scrollY > 75;
        navbar.classList.toggle('hero-nav-at-top', !hasScrolled);
        navbar.classList.toggle('hero-nav-scrolled', hasScrolled);

        if (mobileLayout.matches || reducedMotion.matches) {
            hero.style.setProperty('--hero-progress', '0');
            hero.style.setProperty('--video-progress', '0');
            setHeroModelsRendering(!mobileLayout.matches);
            syncHeroMotion();
            scrollAnimationFrame = null;
            return;
        }

        const sceneTop = scrollScene.getBoundingClientRect().top + window.scrollY;
        const sceneStart = Math.max(sceneTop - navbarHeight, 0);
        const stickyHeight = Math.max(window.innerHeight - navbarHeight, 1);
        const availableScroll = Math.max(scrollScene.offsetHeight - stickyHeight, 1);
        const progress = clamp((window.scrollY - sceneStart) / availableScroll);
        const heroProgress = clamp(progress / 0.68);
        const videoProgress = clamp(progress / 0.76);

        hero.style.setProperty('--hero-progress', heroProgress.toFixed(4));
        hero.style.setProperty('--video-progress', videoProgress.toFixed(4));
        setHeroModelsRendering(heroProgress < 0.91);
        syncHeroMotion();
        scrollAnimationFrame = null;
    };

    const requestHeroUpdate = () => {
        if (scrollAnimationFrame !== null) return;
        scrollAnimationFrame = window.requestAnimationFrame(updateHero);
    };

    const syncLayoutMetrics = () => {
        navbarHeight = navbar.offsetHeight;
        hero.style.setProperty('--hero-navbar-height', `${navbarHeight}px`);
    };

    // Hover and keyboard focus share the same resumable motion state.
    const setMotionSource = (source, isActive) => {
        if (isActive) {
            motionSources.add(source);
        } else {
            motionSources.delete(source);
        }

        syncHeroMotion();
    };

    signupButton?.addEventListener('pointerenter', () => setMotionSource('pointer', true));
    signupButton?.addEventListener('pointerleave', () => setMotionSource('pointer', false));
    signupButton?.addEventListener('focus', () => setMotionSource('focus', true));
    signupButton?.addEventListener('blur', () => setMotionSource('focus', false));

    const heroObserver = new IntersectionObserver(([entry]) => {
        isHeroVisible = entry.isIntersecting;
        syncHeroMotion();
    });
    heroObserver.observe(hero);

    document.addEventListener('visibilitychange', syncHeroMotion);
    reducedMotion.addEventListener('change', () => {
        syncHeroMotion();
        requestHeroUpdate();
    });
    mobileLayout.addEventListener('change', () => {
        syncHeroMotion();
        requestHeroUpdate();
    });
    tabletLayout.addEventListener('change', requestHeroUpdate);
    window.addEventListener('scroll', requestHeroUpdate, { passive: true });
    window.addEventListener('resize', () => {
        syncLayoutMetrics();
        requestHeroUpdate();
    }, { passive: true });
    syncLayoutMetrics();
    updateHero();
}
