import { createMascotMaterial } from './mascot-material.js';

const MASCOT_MATCAP = 'assets/mascot-7c495cf9822e0d5c.jpg';
const METAL_MATCAP = 'assets/metal-3c8c628f34ff880e.jpg';

// Lightweight Copilot appearance and pointer response.
export const copilotConfig = {
    modelURL: 'assets/copilot-2addefe0e666acf2.glb',
    createMaterial: createMascotMaterial,
    materialStyle: 'clean',
    mascotType: 1,
    useLights: true,
    castShadow: false,
    receiveShadow: false,
    scale: 2,
    positionY: -0.55,
    headHeight: 0.55,
    degreesHorizontal: 20,
    degreesVerticalUp: 18,
    degreesVerticalDown: 14,
    sensitivity: 1.15,
    rotationSpeed: 0.03,
    invertHorizontal: false,
    invertVertical: true,
    offsetMouseY: -180,
    exposure: 1.45,

    lighting: {
        ambient: { color: 0xffffff, intensity: 1.2 },
        directional: [
            { color: 0xf1e9ff, intensity: 1.1, position: [-4, 4, 6] },
            { color: 0x745cff, intensity: 0.45, position: [4, 1, 3] }
        ]
    },

    defaultMaterial: {
        color: 0xffffff,
        matcapMap: MASCOT_MATCAP,
        roughness: 0.52,
        metalness: 0.04
    },

    materials: {
        head: {
            color: 0x8c5cff,
            aoMap: 'assets/head_sss-d8fae0ae80a4e382.jpg'
        },
        face: {
            color: 0x171b3a,
            aoMap: 'assets/face_sss-08fee22135b1ea64.jpg'
        },
        eyes: {
            color: 0x35c9ff,
            aoMap: 'assets/eyes_sss-d4ec85f4a631f091.jpg',
            emissive: 0x0b7699,
            emissiveIntensity: 0.4
        },
        glass: {
            color: 0x6035c7,
            aoMap: 'assets/glasses_sss-60c5ab8eb11601ef.jpg',
            matcapMap: METAL_MATCAP,
            roughness: 0.3,
            metalness: 0.16
        },
        goggle: {
            color: 0xa66cff,
            aoMap: 'assets/goggle_sss-e9ec45c9470a5ef8.jpg',
            matcapMap: METAL_MATCAP,
            roughness: 0.34,
            metalness: 0.12
        }
    }
};
