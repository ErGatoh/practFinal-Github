import { getModelInstance } from './models.js';
import { updateMediaControl } from './media-control.js';
import { CollaborationEffects } from './collaboration-effects.js';

const MOBILE_QUERY = '(max-width: 767.98px)';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileLayout = window.matchMedia(MOBILE_QUERY);
const copilotTarget = document.querySelector('.workflow-copilot');
const copilot = getModelInstance(copilotTarget);
const catTarget = document.querySelector('.collaboration-cat');
const cat = getModelInstance(catTarget);
if (cat?.stage.canvas?.classList.contains('collaboration-webgl-canvas')) {
    cat.stage.addEffect(new CollaborationEffects(cat.stage));
}
const videos = Array.from(document.querySelectorAll('.body-demo-video'));
const carouselTrack = document.querySelector('.customer-marquee-track');
const carouselControl = document.querySelector('#carouselControl');
const carouselControlPath = document.querySelector('#carouselControlPath');
const workflowVideoControl = document.querySelector('#workflowVideoControl');
const workflowVideoControlPath = document.querySelector('#workflowVideoControlPath');
const hero = document.querySelector('#hero');
const backToTop = document.querySelector('#backToTop');
let carouselPausedByUser = false;
let pageActive = true;

function updateWorkflowVideoControl(video) {
    if (video) updateMediaControl(
        workflowVideoControl, workflowVideoControlPath, video.paused || video.ended
    );
}

function updateCopilotMotion() {
    if (!copilot) return;

    const motionEnabled = !reducedMotion.matches;
    copilot.setAction('follow-pointer', motionEnabled && !mobileLayout.matches);
    copilot.setAction('follow-tap', motionEnabled && mobileLayout.matches);
    copilot.setRenderingEnabled(true);
}

function updateCatMotion() {
    if (!cat) return;

    const motionEnabled = !reducedMotion.matches;
    cat.setAction('follow-pointer', motionEnabled && !mobileLayout.matches);
    cat.setAction('follow-tap', motionEnabled && mobileLayout.matches);
    cat.setRenderingEnabled(true);
}

function updateVideo(video, isVisible) {
    if (reducedMotion.matches || !isVisible) {
        video.pause();
        updateWorkflowVideoControl(video);
        return;
    }

    if (video.dataset.pausedByUser === 'true' || video.ended) return;
    video.play().then(() => updateWorkflowVideoControl(video)).catch(() => {});
}

function updateCarouselControl() {
    updateMediaControl(
        carouselControl, carouselControlPath, carouselPausedByUser, 'carousel'
    );
}

function updateCarouselMotion() {
    if (!carouselTrack) return;

    const shouldPause = carouselPausedByUser
        || !pageActive
        || reducedMotion.matches;
    carouselTrack.classList.toggle('is-paused', shouldPause);
}

carouselControl?.addEventListener('click', () => {
    carouselPausedByUser = !carouselPausedByUser;
    updateCarouselControl();
    updateCarouselMotion();
});

workflowVideoControl?.addEventListener('click', () => {
    const video = workflowVideoControl.closest('.product-showcase')?.querySelector('video');
    if (!video) return;

    if (video.paused || video.ended) {
        if (video.ended) video.currentTime = 0;
        video.dataset.pausedByUser = 'false';
        video.play().catch(() => {});
    } else {
        video.dataset.pausedByUser = 'true';
        video.pause();
    }

    updateWorkflowVideoControl(video);
});

for (const video of videos) {
    for (const event of ['play', 'pause', 'ended']) {
        video.addEventListener(event, () => updateWorkflowVideoControl(video));
    }
}

const videoObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) updateVideo(entry.target, entry.isIntersecting);
}, { threshold: 0.15 });

for (const video of videos) videoObserver.observe(video);

const heroObserver = new IntersectionObserver(([entry]) => {
    const heroIsAboveViewport = !entry.isIntersecting
        && entry.boundingClientRect.bottom <= 0;
    backToTop?.classList.toggle('is-visible', heroIsAboveViewport);
    backToTop?.setAttribute('aria-hidden', String(!heroIsAboveViewport));
}, { threshold: 0 });

if (hero) heroObserver.observe(hero);

backToTop?.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: reducedMotion.matches ? 'auto' : 'smooth'
    });
});

reducedMotion.addEventListener('change', () => {
    updateCopilotMotion();
    updateCatMotion();
    updateCarouselMotion();
    for (const video of videos) {
        const rect = video.getBoundingClientRect();
        updateVideo(video, rect.top < window.innerHeight && rect.bottom > 0);
    }
});
document.addEventListener('visibilitychange', () => {
    pageActive = !document.hidden;
    updateCarouselMotion();
});
window.addEventListener('blur', () => {
    pageActive = false;
    updateCarouselMotion();
});
window.addEventListener('focus', () => {
    if (document.hidden) return;

    pageActive = true;
    updateCarouselMotion();
});
mobileLayout.addEventListener('change', updateCopilotMotion);
mobileLayout.addEventListener('change', updateCatMotion);
updateCopilotMotion();
updateCatMotion();
updateCarouselControl();
updateCarouselMotion();
