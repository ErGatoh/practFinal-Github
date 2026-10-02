import { getModelInstance } from './models.js';

const MOBILE_QUERY = '(max-width: 767.98px)';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileLayout = window.matchMedia(MOBILE_QUERY);
const copilotTarget = document.querySelector('.workflow-copilot');
const copilot = getModelInstance(copilotTarget);
const videos = Array.from(document.querySelectorAll('.body-demo-video'));
const carouselTrack = document.querySelector('.customer-marquee-track');
const carouselControl = document.querySelector('#carouselControl');
const carouselControlPath = document.querySelector('#carouselControlPath');
const PAUSE_PATH = 'M6 5h4v14H6V5zm8 0h4v14h-4V5z';
const PLAY_PATH = 'M8 5v14l11-7z';
let carouselPausedByUser = false;
let pageActive = true;

function updateCopilotMotion() {
    if (!copilot) return;

    const motionEnabled = !reducedMotion.matches;
    copilot.setAction('follow-pointer', motionEnabled && !mobileLayout.matches);
    copilot.setAction('follow-tap', motionEnabled && mobileLayout.matches);
    copilot.setRenderingEnabled(true);
}

function updateVideo(video, isVisible) {
    if (reducedMotion.matches || !isVisible) {
        video.pause();
        return;
    }

    video.play().catch(() => {});
}

function updateCarouselControl() {
    if (!carouselControl || !carouselControlPath) return;

    carouselControlPath.setAttribute(
        'd',
        carouselPausedByUser ? PLAY_PATH : PAUSE_PATH
    );
    carouselControl.setAttribute(
        'aria-label',
        carouselPausedByUser ? 'Play carousel' : 'Pause carousel'
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

const videoObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) updateVideo(entry.target, entry.isIntersecting);
}, { threshold: 0.15 });

for (const video of videos) videoObserver.observe(video);

reducedMotion.addEventListener('change', () => {
    updateCopilotMotion();
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
updateCopilotMotion();
updateCarouselControl();
updateCarouselMotion();
