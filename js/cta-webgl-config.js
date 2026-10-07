export const CTA_MODEL_URLS = Object.freeze({
    cat: 'assets/cat-f3f7c174dd40ee38.glb',
    copilot: 'assets/copilot-637acc5067d6bd48.glb',
    duck: 'assets/duck-fd3edc799900f236.glb'
});

export const CTA_TEXTURE_URLS = Object.freeze({
    matcap_mascot: 'assets/mascot-7c495cf9822e0d5c.jpg',
    matcap_cateye: 'assets/cat_eye-75fdf7af6c5dc157.jpg',
    matcap_metal: 'assets/metal-3c8c628f34ff880e.jpg',
    cat_nose_ao: 'assets/nose_sss-6afeebf8847550e0.jpg',
    cat_head_ao: 'assets/head_sss-d8fae0ae80a4e382.jpg',
    cat_face_ao: 'assets/face_sss-3e1df8b333b17007.jpg',
    cat_eye_ao: 'assets/eyes_sss-50a88b260278a821.jpg',
    cat_eyeball_ao: 'assets/eyeballs_sss-7d5e1ff2485a86b4.jpg',
    cat_eye_color: 'assets/eye_color-bb27e609004c77cc.jpg',
    duck_body_ao: 'assets/body_sss-81ee34ea4313f489.jpg',
    duck_beak_ao: 'assets/beak_sss-9bedb47fe065d769.jpg',
    duck_eyes_ao: 'assets/eyes_sss-1cf5a161036fa333.jpg',
    duck_eyeballs_ao: 'assets/eyeballs_sss-d377e4858a74c681.jpg',
    copilot_eyes_ao: 'assets/eyes_sss-d4ec85f4a631f091.jpg',
    copilot_face_ao: 'assets/face_sss-08fee22135b1ea64.jpg',
    copilot_ears_ao: 'assets/ears_sss-0621d17ee690e98e.jpg',
    copilot_glasses_ao: 'assets/glasses_sss-60c5ab8eb11601ef.jpg',
    copilot_goggle_ao: 'assets/goggle_sss-e9ec45c9470a5ef8.jpg',
    copilot_head_ao: 'assets/head_sss-20df98de3477bdf9.jpg',
    copilot_neck_ao: 'assets/neck_sss-96e4807b0f548768.jpg'
});

const blackMaterial = (ao) => ({
    ao,
    color: 0x000000,
    matcap: 'matcap_metal',
    noiseRange: [-0.03, 0.03],
    fogRangeZ: [-1, -0.3],
    specularFactor: 0.6,
    blackObject: true
});

const mascotMaterial = (ao, color, options = {}) => ({
    ao,
    color,
    matcap: 'matcap_mascot',
    noiseRange: options.noiseRange || [-0.03, 0.03],
    fogRangeZ: options.fogRangeZ || [-1, -0.3],
    specularFactor: options.specularFactor ?? 0.2,
    blackObject: false
});

export const CTA_MASCOT_CONFIGS = Object.freeze({
    cat: {
        type: 0,
        delay: 250,
        lightPosition: [1, 1, 1.5],
        position: [0, -0.05, 0.1],
        scale: [3, 3, 3],
        rotation: [0, 0, 0],
        rotationOrder: 'ZYX',
        materials: {
            nose: blackMaterial('cat_nose_ao'),
            eye: blackMaterial('cat_eye_ao'),
            face: mascotMaterial('cat_face_ao', 0xff69c8, {
                noiseRange: [-0.1, 0.1],
                fogRangeZ: [-1, -0.5],
                specularFactor: 0.05
            }),
            head: mascotMaterial('cat_head_ao', 0xf046b2, {
                noiseRange: [-0.1, 0.1],
                fogRangeZ: [-1, -0.5],
                specularFactor: 0.3
            }),
            eyeball: mascotMaterial('cat_eyeball_ao', 0xffa3dd, {
                specularFactor: 0.3
            })
        }
    },
    copilot: {
        type: 1,
        delay: 0,
        lightPosition: [1, 1, 1],
        position: [-0.8, 0, -0.3],
        scale: [2.8, 2.8, 2.8],
        rotation: [-0.1, -0.3, 0],
        rotationOrder: 'XZY',
        materials: {
            eyes: mascotMaterial('copilot_eyes_ao', 0x1946d4),
            face: mascotMaterial('copilot_face_ao', 0x0000a3, {
                specularFactor: 0.3
            }),
            glasses: mascotMaterial('copilot_glasses_ao', 0x1f0a94, {
                specularFactor: 0.3
            }),
            goggle: mascotMaterial('copilot_goggle_ao', 0x6143e6),
            head: mascotMaterial('copilot_head_ao', 0x6143e6, {
                specularFactor: 0.4
            }),
            neck: mascotMaterial('copilot_neck_ao', 0x6143e6, {
                specularFactor: 0
            }),
            ears: mascotMaterial('copilot_ears_ao', 0x6143e6, {
                specularFactor: 0.4
            })
        }
    },
    duck: {
        type: 2,
        delay: 500,
        lightPosition: [1, 1, 1],
        position: [0.8, -0.2, 0.6],
        scale: [4, 4, 4],
        rotation: [-0.2, -0.15, 0],
        rotationOrder: 'XZY',
        materials: {
            body: mascotMaterial('duck_body_ao', 0xf6b545),
            beak: mascotMaterial('duck_beak_ao', 0xf6b545),
            eyes: blackMaterial('duck_eyes_ao'),
            eyeballs: blackMaterial('duck_eyeballs_ao')
        }
    }
});
