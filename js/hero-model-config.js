// Scene positions, light colors and mesh colors from GitHub's intro-hero-webgl.
export const HERO_MODELS = {
    cat: {
        url: 'assets/cat-53c4522f687c1719.glb',
        position: [0.6, -0.8, 2],
        tabletPosition: [0.5, -0.4, 2],
        scale: 1.32,
        rotation: [0, -1.1, -0.6],
        lightColors: [0x9514b3, 0xbf7600],
        lights: [[-1, 1, 1], [1, -1, 0.4]],
        phase: 0.33 * Math.PI * 2,
        start: [0.6, -2, 0],
        startRotation: [0, Math.PI * 1.5, 1],
        delay: 0,
        duration: 4000,
        materials: {
            nose: { color: 0x000000, ao: 'assets/head_sss-29270cf59da664ea.jpg' },
            eye: { color: 0x000000, ao: 'assets/eye_sss-8e43fcedfb9ddaf9.jpg', colorMap: 'assets/eye_color-bb27e609004c77cc.jpg', matcap: 'assets/cat_eye-75fdf7af6c5dc157.jpg' },
            face: { color: 0xff8fd6, ao: 'assets/head_sss-29270cf59da664ea.jpg' },
            head: { color: 0xf763c1, ao: 'assets/head_sss-29270cf59da664ea.jpg' },
            eyeball: { color: 0xffffff, ao: 'assets/head_sss-29270cf59da664ea.jpg' }
        }
    },
    copilot: {
        url: 'assets/copilot-2addefe0e666acf2.glb',
        position: [-0.5, -1.0, 0],
        tabletPosition: [-0.5, -0.5, 0],
        scale: 1.56,
        rotation: [0, 0.8, 0.8],
        lightColors: [0x7a4ced, 0xce5fe8],
        lights: [[-1, 0, 2], [1, -1, 1]],
        phase: 0.66 * Math.PI * 2,
        start: [-1, -2.5, 0],
        startRotation: [0, -Math.PI * 1.5, -1],
        delay: 600,
        duration: 4400,
        materials: {
            eyes: { color: 0x3963ef, ao: 'assets/head_sss-b7e053d8d541a414.jpg' },
            face: { color: 0x05014d, ao: 'assets/head_sss-b7e053d8d541a414.jpg' },
            glass: { color: 0x6325b0, ao: 'assets/head_sss-b7e053d8d541a414.jpg' },
            goggle: { color: 0x995be3, ao: 'assets/head_sss-b7e053d8d541a414.jpg' },
            head: { color: 0x9e55f8, ao: 'assets/head_sss-b7e053d8d541a414.jpg' }
        }
    },
    duck: {
        url: 'assets/duck-b3412913788eaa25.glb',
        position: [0.3, -1.4, 0],
        tabletPosition: [0.1, -0.9, 0],
        scale: 1.8,
        rotation: [0, -0.9, -0.8],
        lightColors: [0xbf7600, 0xffebad],
        lights: [[1, 1, 0.4], [-0.5, -1, 0.6]],
        phase: 0,
        start: [1, -2.5, 0],
        startRotation: [0, Math.PI * 1.5, -1],
        delay: 1000,
        duration: 3000,
        materials: {
            body: { color: 0xf6b545, ao: 'assets/body_sss-ecb11ff73d84fd3b.jpg' },
            beak: { color: 0xf6b545, ao: 'assets/body_sss-ecb11ff73d84fd3b.jpg' },
            eyes: { color: 0x000000, ao: 'assets/body_sss-ecb11ff73d84fd3b.jpg' },
            eyeballs: { color: 0x000000, ao: 'assets/body_sss-ecb11ff73d84fd3b.jpg' }
        }
    }
};
