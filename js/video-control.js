const button = document.querySelector('#videoControl');
const iconPath = document.querySelector('#videoControlPath');

const desktopVideo = document.querySelector(
    '.preview-video.d-none.d-md-block'
);

const mobileVideo = document.querySelector(
    '.preview-video.d-md-none'
);

const desktopMedia = window.matchMedia('(min-width: 768px)');


// PATHS
const PAUSE_PATH = 'M6 5h4v14H6V5zm8 0h4v14h-4V5z';
const PLAY_PATH = 'M8 5v14l11-7z';


// 0 = reproduciendo
// 1 = pausado
let videoState = 0;


function getActiveVideo() {
    return desktopMedia.matches
        ? desktopVideo
        : mobileVideo;
}


function getInactiveVideo() {
    return desktopMedia.matches
        ? mobileVideo
        : desktopVideo;
}


function updateIcon() {

    if (videoState === 0) {

        // Vídeo reproduciéndose → mostrar PAUSE
        iconPath.setAttribute('d', PAUSE_PATH);

        button.setAttribute(
            'aria-label',
            'Pause video'
        );

    } else {

        // Vídeo pausado → mostrar PLAY
        iconPath.setAttribute('d', PLAY_PATH);

        button.setAttribute(
            'aria-label',
            'Play video'
        );
    }
}


button.addEventListener('click', async () => {

    // Alternar 0 ↔ 1
    videoState = videoState === 0 ? 1 : 0;

    const video = getActiveVideo();


    if (videoState === 1) {

        video.pause();

    } else {

        try {
            await video.play();
        } catch (error) {
            console.warn(
                'No se pudo reproducir el vídeo:',
                error
            );
        }
    }


    // Cambiar el PATH
    updateIcon();
});


/* =========================
   PAUSA AUTOMÁTICA
========================= */

function pauseWhenInactive() {
    getActiveVideo()?.pause();
}


async function resumeWhenActive() {

    // Solo reanudar si el usuario
    // no lo había pausado manualmente
    if (videoState !== 0) return;

    try {
        await getActiveVideo()?.play();
    } catch (error) {
        console.warn(
            'No se pudo reanudar el vídeo:',
            error
        );
    }
}


document.addEventListener(
    'visibilitychange',
    () => {

        if (document.hidden) {
            pauseWhenInactive();
        } else {
            resumeWhenActive();
        }
    }
);


window.addEventListener(
    'blur',
    pauseWhenInactive
);


window.addEventListener(
    'focus',
    () => {

        if (!document.hidden) {
            resumeWhenActive();
        }
    }
);


/* =========================
   DESKTOP / MOBILE
========================= */

desktopMedia.addEventListener(
    'change',
    async () => {

        // Pausar vídeo oculto
        getInactiveVideo()?.pause();

        // Reproducir el nuevo si corresponde
        if (videoState === 0) {

            try {
                await getActiveVideo()?.play();
            } catch {}
        }

        updateIcon();
    }
);


/* =========================
   INICIO
========================= */

getInactiveVideo()?.pause();

videoState = 0;

updateIcon();

getActiveVideo()?.play().catch(() => {});