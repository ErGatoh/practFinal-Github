import { defineMorphIcon } from 'morphicons/element';

// Icon paths and responsive limits.
const MENU_ICON = 'M4 7h16M4 12h16M4 17h16';
const CLOSE_ICON = 'M18 6 6 18M6 6l12 12';
const LINK_CHEVRON_ICON = 'M9 6l6 6-6 6';
const LINK_ARROW_ICON = 'M5 12h14m-6-6 6 6-6 6';
const DESKTOP_QUERY = '(min-width: 1012px)';
const MENU_STROKE_WIDTH = '2';
const CLOSE_STROKE_WIDTH = '1.5';

// Register the custom icon element.
defineMorphIcon();

// Navbar controls.
const menu = document.querySelector('#githubNavbar');
const toggle = document.querySelector('.mobile-menu-toggle');
const icon = document.querySelector('#mobileMenuIcon');
const textLinks = document.querySelectorAll('.text-link');

for (const link of textLinks) {
    const linkIcon = link.querySelector('.text-link-icon');
    if (!linkIcon) continue;

    const setLinkIcon = (isActive) => {
        linkIcon.morphTo(isActive ? LINK_ARROW_ICON : LINK_CHEVRON_ICON, 'snappy');
    };

    link.addEventListener('pointerenter', () => setLinkIcon(true));
    link.addEventListener('pointerleave', () => setLinkIcon(false));
    link.addEventListener('focus', () => setLinkIcon(true));
    link.addEventListener('blur', () => setLinkIcon(false));
}

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
