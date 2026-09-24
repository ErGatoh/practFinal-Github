import { defineMorphIcon } from 'morphicons/element';

// Icon paths and responsive limits.
const MENU_ICON = 'M4 7h16M4 12h16M4 17h16';
const CLOSE_ICON = 'M18 6 6 18M6 6l12 12';
const DESKTOP_QUERY = '(min-width: 992px)';
const MENU_STROKE_WIDTH = '2';
const CLOSE_STROKE_WIDTH = '1.5';

// Register the custom icon element.
defineMorphIcon();

// Navbar controls.
const menu = document.querySelector('#githubNavbar');
const toggle = document.querySelector('.mobile-menu-toggle');
const icon = document.querySelector('#mobileMenuIcon');

if (menu && toggle && icon) {
    // Keep the icon and labels in sync.
    const setMenuState = (isOpen) => {
        icon.morphTo(isOpen ? CLOSE_ICON : MENU_ICON, 'snappy');
        const strokeWidth = isOpen ? CLOSE_STROKE_WIDTH : MENU_STROKE_WIDTH;
        icon.setAttribute('stroke-width', strokeWidth);
        icon.querySelector('svg')?.setAttribute('stroke-width', strokeWidth);
        icon.setAttribute('label', isOpen ? 'Close navigation' : 'Open navigation');
        toggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    };

    // Follow the Bootstrap collapse lifecycle.
    menu.addEventListener('show.bs.collapse', () => {
        document.body.classList.add('mobile-menu-open');
        setMenuState(true);
    });

    menu.addEventListener('hide.bs.collapse', () => {
        setMenuState(false);
    });

    menu.addEventListener('hidden.bs.collapse', () => {
        document.body.classList.remove('mobile-menu-open');
    });

    // Reset mobile state when desktop layout returns.
    const desktopMedia = window.matchMedia(DESKTOP_QUERY);
    desktopMedia.addEventListener('change', ({ matches }) => {
        if (!matches) {
            return;
        }

        document.body.classList.remove('mobile-menu-open');
        setMenuState(false);

        if (menu.classList.contains('show')) {
            bootstrap.Collapse.getOrCreateInstance(menu, { toggle: false }).hide();
        }
    });
}