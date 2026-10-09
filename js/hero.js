import { getModelStage } from './models.js';
import { HeroWebGL } from './hero-webgl.js';

// Hero controls.
const hero = document.querySelector('#hero');
const scrollScene = hero?.querySelector('.hero-scroll-scene');
const videoShell = hero?.querySelector('.hero-video-shell');
const heroCanvas = hero?.querySelector('.hero-webgl-canvas');
const signupButton = hero?.querySelector('#heroSignupButton');
const downloadButton = hero?.querySelector('#heroDownloadButton');
const navbar = document.querySelector('.navbar');

if (hero && scrollScene && navbar) {
    const MOBILE_QUERY = '(max-width: 767.98px)';
    const PURPLE_LIGHT_HEIGHT = 18;
    const clamp = (value, minimum = 0, maximum = 1) => (
        Math.min(Math.max(value, minimum), maximum)
    );
    const mobileLayout = window.matchMedia(MOBILE_QUERY);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionSources = new Set();
    const modelStage = getModelStage();
    let heroEffects = null;
    let scrollAnimationFrame = null;
    let isHeroVisible = hero.getBoundingClientRect().bottom > 0
        && hero.getBoundingClientRect().top < window.innerHeight;
    let modelsRenderingEnabled = true;
    let navbarHeight = 0;

    const ensureHeroEffects = () => {
        if (heroEffects || !isHeroVisible || mobileLayout.matches || !heroCanvas) return heroEffects;

        heroEffects = new HeroWebGL({ hero, canvas: heroCanvas });
        heroEffects.load();
        return heroEffects;
    };

    const isInteractionRequested = () => (
        motionSources.size > 0
        && isHeroVisible
        && !document.hidden
        && !mobileLayout.matches
    );

    const syncHeroEffects = () => {
        const effects = ensureHeroEffects();
        if (!effects) return;

        effects.setReducedMotion(reducedMotion.matches);
        effects.setVisible(isHeroVisible && !mobileLayout.matches);
        effects.setRenderingEnabled(modelsRenderingEnabled && !mobileLayout.matches);
        effects.setInteractionActive(isInteractionRequested());
    };

    const setHeroModelsRendering = (isEnabled) => {
        modelsRenderingEnabled = isEnabled;
        heroEffects?.setRenderingEnabled(isEnabled && !mobileLayout.matches);
    };

    // Desktop and tablet keep the hero fixed while the video passes above it.
    const updateHero = () => {
        const hasScrolled = window.scrollY > 75;
        navbar.classList.toggle('hero-nav-at-top', !hasScrolled);
        navbar.classList.toggle('hero-nav-scrolled', hasScrolled);

        if (mobileLayout.matches || reducedMotion.matches) {
            hero.style.setProperty('--hero-progress', '0');
            setHeroModelsRendering(!mobileLayout.matches);
            syncHeroEffects();
            // Visible body models still need to follow their markers while scrolling.
            if (!mobileLayout.matches || modelStage?.items.some(item => (
                item.visible && item.renderingEnabled && item.model
            ))) modelStage?.requestRender();
            scrollAnimationFrame = null;
            return;
        }

        const sceneTop = scrollScene.getBoundingClientRect().top + window.scrollY;
        const sceneStart = Math.max(sceneTop - navbarHeight, 0);
        const stickyHeight = Math.max(window.innerHeight - navbarHeight, 1);
        const availableScroll = Math.max(scrollScene.offsetHeight - stickyHeight, 1);
        const progress = clamp((window.scrollY - sceneStart) / availableScroll);
        const heroProgress = clamp(progress / 0.82);

        hero.style.setProperty('--hero-progress', heroProgress.toFixed(4));
        setHeroModelsRendering(heroProgress < 0.98);
        syncHeroEffects();
        heroEffects?.resize();
        heroEffects?.requestRender();
        modelStage?.requestRender();
        scrollAnimationFrame = null;
    };

    const requestHeroUpdate = () => {
        if (scrollAnimationFrame !== null) return;
        scrollAnimationFrame = window.requestAnimationFrame(updateHero);
    };

    const syncSceneHeight = () => {
        if (!videoShell || mobileLayout.matches) {
            scrollScene.style.removeProperty('--hero-scene-height');
            return;
        }

        const sceneTop = scrollScene.getBoundingClientRect().top;
        const videoBottom = videoShell.getBoundingClientRect().bottom;
        const stickyHeight = Math.max(window.innerHeight - navbarHeight, 1);
        const sceneHeight = Math.max(
            Math.ceil(videoBottom - sceneTop + PURPLE_LIGHT_HEIGHT),
            stickyHeight
        );

        scrollScene.style.setProperty('--hero-scene-height', `${sceneHeight}px`);
    };

    const syncLayoutMetrics = () => {
        navbarHeight = navbar.offsetHeight;
        hero.style.setProperty('--hero-navbar-height', `${navbarHeight}px`);
        syncSceneHeight();
        heroEffects?.resize();
        heroEffects?.requestRender();
    };

    const setMotionSource = (source, isActive) => {
        if (isActive) {
            motionSources.add(source);
        } else {
            motionSources.delete(source);
        }

        syncHeroEffects();
    };

    const registerInteractionTrigger = (element, sourceName) => {
        if (!element) return;

        const pointerSource = `${sourceName}-pointer`;
        const focusSource = `${sourceName}-focus`;
        element.addEventListener('pointerenter', (event) => {
            if (event.pointerType === 'mouse') setMotionSource(pointerSource, true);
        });
        element.addEventListener('pointerleave', (event) => {
            if (event.pointerType === 'mouse') setMotionSource(pointerSource, false);
        });
        element.addEventListener('focus', () => {
            setMotionSource(focusSource, element.matches(':focus-visible'));
        });
        element.addEventListener('blur', () => setMotionSource(focusSource, false));
    };

    registerInteractionTrigger(signupButton, 'signup');
    registerInteractionTrigger(downloadButton, 'download');

    const heroObserver = new IntersectionObserver(([entry]) => {
        isHeroVisible = entry.isIntersecting;
        syncHeroEffects();
    });
    heroObserver.observe(hero);

    const videoShellObserver = videoShell
        ? new ResizeObserver(() => {
            syncLayoutMetrics();
            requestHeroUpdate();
        })
        : null;
    videoShellObserver?.observe(videoShell);

    document.addEventListener('visibilitychange', () => {
        syncHeroEffects();
        if (!document.hidden) heroEffects?.requestRender();
    });
    reducedMotion.addEventListener('change', () => {
        syncHeroEffects();
        requestHeroUpdate();
    });
    mobileLayout.addEventListener('change', () => {
        syncHeroEffects();
        requestHeroUpdate();
    });
    window.addEventListener('scroll', requestHeroUpdate, { passive: true });
    window.addEventListener('resize', () => {
        syncLayoutMetrics();
        requestHeroUpdate();
    }, { passive: true });
    syncLayoutMetrics();
    updateHero();
}
