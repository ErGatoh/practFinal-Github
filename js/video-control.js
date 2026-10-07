import { updateMediaControl } from './media-control.js';

const button = document.querySelector('#videoControl');
const iconPath = document.querySelector('#videoControlPath');
const desktopVideo = document.querySelector('.preview-video.d-none.d-md-block');
const mobileVideo = document.querySelector('.preview-video.d-md-none');
const desktopMedia = window.matchMedia('(min-width: 768px)');
let pausedByUser = false;

const getActiveVideo = () => desktopMedia.matches ? desktopVideo : mobileVideo;
const getInactiveVideo = () => desktopMedia.matches ? mobileVideo : desktopVideo;
const updateIcon = () => updateMediaControl(button, iconPath, pausedByUser);
const pauseWhenInactive = () => getActiveVideo()?.pause();

async function resumeWhenActive() {
    if (pausedByUser) return;
    try {
        await getActiveVideo()?.play();
    } catch (error) {
        console.warn('Video could not be played:', error);
    }
}

button.addEventListener('click', async () => {
    pausedByUser = !pausedByUser;
    if (pausedByUser) pauseWhenInactive();
    else await resumeWhenActive();
    updateIcon();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseWhenInactive();
    else resumeWhenActive();
});
window.addEventListener('blur', pauseWhenInactive);
window.addEventListener('focus', () => {
    if (!document.hidden) resumeWhenActive();
});

desktopMedia.addEventListener('change', async () => {
    getInactiveVideo()?.pause();
    if (!pausedByUser) {
        try { await getActiveVideo()?.play(); } catch {}
    }
    updateIcon();
});

getInactiveVideo()?.pause();
updateIcon();
getActiveVideo()?.play().catch(() => {});
