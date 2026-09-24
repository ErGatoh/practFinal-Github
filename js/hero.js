import { getModelInstance } from './models.js';

// Hero controls.
const hero = document.querySelector('#hero');
const scrollScene = hero?.querySelector('.hero-scroll-scene');
const signupButton = hero?.querySelector('#heroSignupButton');
const navbar = document.querySelector('.navbar');

if (hero && scrollScene && navbar) {
    // Keep animation values within their valid range.
    const clamp = (value, minimum = 0, maximum = 1) => (
        Math.min(Math.max(value, minimum), maximum)
    );

    let animationFrame = null;
    let modelAnimationFrame = null;
    let previousModelTime = null;
    let activeModelTime = 0;
    let isHeroVisible = true;
    const motionSources = new Set();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Model-specific timing keeps the hero motion asynchronous.
    const modelMotion = {
        cat: { rotationDegrees: 9.5, rotationSeconds: 4.8, rise: 0.11, riseSeconds: 3.6 },
        copilot: { rotationDegrees: 8, rotationSeconds: 5.6, rise: 0.09, riseSeconds: 4.3 },
        duck: { rotationDegrees: 10, rotationSeconds: 4.2, rise: 0.08, riseSeconds: 3.1 }
    };

    const heroModels = Array.from(hero.querySelectorAll('[data-hero-model]'))
        .map((container) => ({
            instance: getModelInstance(container),
            motion: modelMotion[container.dataset.heroModel]
        }))
        .filter(({ instance, motion }) => instance && motion);

    // Map page scroll to CSS animation variables.
    const updateHero = () => {
        const sceneTop = scrollScene.getBoundingClientRect().top + window.scrollY;
        const availableScroll = Math.max(scrollScene.offsetHeight - window.innerHeight, 1);
        const progress = clamp((window.scrollY - sceneTop) / availableScroll);
        const videoProgress = clamp((progress - 0.12) / 0.78);
        const hasScrolled = window.scrollY > 75 ;

        hero.style.setProperty('--hero-progress', progress.toFixed(4));
        hero.style.setProperty('--video-progress', videoProgress.toFixed(4));
        navbar.classList.toggle('hero-nav-at-top', !hasScrolled);
        navbar.classList.toggle('hero-nav-scrolled', hasScrolled);
        animationFrame = null;
    };

    // Limit visual updates to one per frame.
    const requestHeroUpdate = () => {
        if (animationFrame !== null) {
            return;
        }

        animationFrame = window.requestAnimationFrame(updateHero);
    };

    // Oscillate from center to each side without exceeding the configured angle.
    const updateModelMotion = (time) => {
        if (previousModelTime === null) previousModelTime = time;
        activeModelTime += Math.min(time - previousModelTime, 64) / 1000;
        previousModelTime = time;

        for (const { instance, motion } of heroModels) {
            const rotationPhase = (activeModelTime / motion.rotationSeconds) * Math.PI * 2;
            const risePhase = (activeModelTime / motion.riseSeconds) * Math.PI * 2;

            instance.setPose({
                rotationZ: -Math.sin(rotationPhase) * motion.rotationDegrees * (Math.PI / 180),
                offsetY: (1 - Math.cos(risePhase)) * motion.rise * 0.5
            });
        }

        modelAnimationFrame = window.requestAnimationFrame(updateModelMotion);
    };

    const syncHeroMotion = () => {
        const shouldAnimate = (
            motionSources.size > 0
            && isHeroVisible
            && !document.hidden
            && !reducedMotion.matches
        );

        hero.classList.toggle('is-particle-active', shouldAnimate);

        if (shouldAnimate && modelAnimationFrame === null) {
            hero.classList.add('has-particle-motion');
            previousModelTime = null;
            modelAnimationFrame = window.requestAnimationFrame(updateModelMotion);
        } else if (!shouldAnimate && modelAnimationFrame !== null) {
            window.cancelAnimationFrame(modelAnimationFrame);
            modelAnimationFrame = null;
            previousModelTime = null;
        }
    };

    // Keep hover and keyboard focus independent.
    const setMotionSource = (source, isActive) => {
        if (isActive) {
            motionSources.add(source);
        } else {
            motionSources.delete(source);
        }

        syncHeroMotion();
    };

    // Pointer and keyboard activation.
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
    reducedMotion.addEventListener('change', syncHeroMotion);

    // Scroll and viewport synchronization.
    window.addEventListener('scroll', requestHeroUpdate, { passive: true });
    window.addEventListener('resize', requestHeroUpdate, { passive: true });
    updateHero();
}
