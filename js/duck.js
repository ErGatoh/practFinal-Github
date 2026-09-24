import { createMascotMaterial } from './mascot-material.js';

const MASCOT_MATCAP = 'assets/mascot-7c495cf9822e0d5c.jpg';

// Lightweight Duck appearance and pointer response.
export const duckConfig = {
    modelURL: 'assets/duck-b3412913788eaa25.glb',
    createMaterial: createMascotMaterial,
    mascotType: 2,
    useLights: false,
    castShadow: false,
    receiveShadow: false,
    scale: 3,
    positionY: -0.45,
    headHeight: 0.45,
    degreesHorizontal: 18,
    degreesVerticalUp: 16,
    degreesVerticalDown: 12,
    sensitivity: 1.1,
    rotationSpeed: 0.03,
    invertHorizontal: false,
    invertVertical: true,
    offsetMouseY: -160,
    exposure: 1.4,

    defaultMaterial: {
        color: 0xffffff,
        matcapMap: MASCOT_MATCAP
    },

    materials: {
        body: {
            color: 0xffd43b,
            aoMap: 'assets/body_sss-ecb11ff73d84fd3b.jpg'
        },
        beak: {
            color: 0xff8a36,
            aoMap: 'assets/beak_sss-9bedb47fe065d769.jpg'
        },
        eyeballs: {
            color: 0xffffff,
            aoMap: 'assets/eyeballs_sss-d377e4858a74c681.jpg'
        },
        eyes: {
            color: 0x111111,
            aoMap: 'assets/eyes_sss-1cf5a161036fa333.jpg'
        }
    }
};
