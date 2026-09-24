import { createMascotMaterial } from './mascot-material.js';

// Cat appearance and pointer response.
export const catConfig = {
    modelURL: 'assets/cat-53c4522f687c1719.glb',
    createMaterial: createMascotMaterial,
    mascotType: 0,
    useLights: false,
    castShadow: false,
    receiveShadow: false,
    scale: 2.0,
    positionY: -1.0,
    headHeight: 0.8,
    degreesHorizontal: 20,
    degreesVerticalUp: 20,
    degreesVerticalDown: 15,
    sensitivity: 1.2,
    rotationSpeed: 0.03,
    invertHorizontal: false,
    invertVertical: true,
    offsetMouseY: -230,

    exposure: 1.5,

    defaultMaterial: {
        color: 0xffffff,
        roughness: 0.65,
        metalness: 0,
        clearcoat: 0
    },

    materials: {
        head: {
            color: 0xf763c1,
            aoMap: 'assets/head_sss-29270cf59da664ea.jpg',
            matcapMap: 'assets/mascot-7c495cf9822e0d5c.jpg'
        },
        face: {
            color: 0xff8fd6,
            aoMap: 'assets/head_sss-29270cf59da664ea.jpg',
            matcapMap: 'assets/mascot-7c495cf9822e0d5c.jpg'
        },
        eyeball: {
            color: 0xffffff,
            aoMap: 'assets/head_sss-29270cf59da664ea.jpg',
            matcapMap: 'assets/mascot-7c495cf9822e0d5c.jpg'
        },
        eye: {
            color: 0x000000,
            aoMap: 'assets/eye_sss-8e43fcedfb9ddaf9.jpg',
            colorMap: 'assets/eye_color-bb27e609004c77cc.jpg',
            matcapMap: 'assets/cat_eye-75fdf7af6c5dc157.jpg'
        },
        nose: {
            color: 0x000000,
            aoMap: 'assets/head_sss-29270cf59da664ea.jpg',
            matcapMap: 'assets/mascot-7c495cf9822e0d5c.jpg'
        }
    }
};
