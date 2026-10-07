const PAUSE_PATH = 'M6 5h4v14H6V5zm8 0h4v14h-4V5z';
const PLAY_PATH = 'M8 5v14l11-7z';

// Share presentation without coupling each player's playback policy.
export function updateMediaControl(button, path, paused, label = 'video') {
    if (!button || !path) return;
    path.setAttribute('d', paused ? PLAY_PATH : PAUSE_PATH);
    button.setAttribute('aria-label', `${paused ? 'Play' : 'Pause'} ${label}`);
}
