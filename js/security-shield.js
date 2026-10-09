import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
    securityAuraFragmentShader,
    securityBackdropVertexShader,
    securityStarFragmentShader,
    securityStarVertexShader,
    shieldFragmentShader,
    shieldVertexShader
} from './security-shield-shaders.js';

const section = document.querySelector('.security-section');
const shieldAnchor = section?.querySelector('.security-shield');
const canvas = section?.querySelector('.security-shield-canvas');

if (section && shieldAnchor && canvas) {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 10);
    camera.position.z = 3;
    const canvasSize = new THREE.Vector2(1, 1);

    function createStars(mask) {
        const plane = new THREE.PlaneGeometry(1, 1);
        const geometry = new THREE.InstancedBufferGeometry();
        geometry.index = plane.index;
        geometry.setAttribute('position', plane.attributes.position);
        geometry.setAttribute('uv', plane.attributes.uv);

        const count = 110;
        const centers = new Float32Array(count * 2);
        const sizes = new Float32Array(count);
        const opacities = new Float32Array(count);
        let seed = 74019;
        const random = () => {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            return seed / 4294967296;
        };

        for (let index = 0; index < count; index++) {
            centers[index * 2] = 0.57 + (random() + random() - 1) * 0.24;
            centers[index * 2 + 1] = 0.34 + (random() + random() - 1) * 0.31;
            sizes[index] = 2 + random() * 8;
            opacities[index] = 0.24 + random() * 0.52;
        }

        geometry.instanceCount = count;
        geometry.setAttribute('aCenter', new THREE.InstancedBufferAttribute(centers, 2));
        geometry.setAttribute('aSize', new THREE.InstancedBufferAttribute(sizes, 1));
        geometry.setAttribute('aOpacity', new THREE.InstancedBufferAttribute(opacities, 1));

        const material = new THREE.ShaderMaterial({
            vertexShader: securityStarVertexShader,
            fragmentShader: securityStarFragmentShader,
            uniforms: {
                uCanvasSize: { value: canvasSize },
                uStarMask: { value: mask }
            },
            transparent: true,
            depthTest: false,
            depthWrite: false
        });
        const stars = new THREE.Mesh(geometry, material);
        stars.frustumCulled = false;
        stars.renderOrder = 1;
        scene.add(stars);
    }

    async function loadShield() {
        try {
            const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
            renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
            renderer.setClearColor(0x000000, 0);

            const textureLoader = new THREE.TextureLoader();
            const [gltf, diffuse, sss, starMask] = await Promise.all([
                new GLTFLoader().loadAsync('assets/shield-99c76cd962f04df2.glb'),
                textureLoader.loadAsync('assets/shield_diffuse-41b84e036ea43614.jpg'),
                textureLoader.loadAsync('assets/shield_sss-b8d96cf3572b780d.jpg'),
                textureLoader.loadAsync('assets/star-9663b0f4de9d12b1.jpg')
            ]);

            diffuse.colorSpace = THREE.NoColorSpace;
            sss.colorSpace = THREE.NoColorSpace;
            starMask.colorSpace = THREE.NoColorSpace;
            diffuse.flipY = false;
            sss.flipY = false;

            const aura = new THREE.Mesh(
                new THREE.PlaneGeometry(2, 2),
                new THREE.ShaderMaterial({
                    vertexShader: securityBackdropVertexShader,
                    fragmentShader: securityAuraFragmentShader,
                    uniforms: { uCanvasSize: { value: canvasSize } },
                    transparent: true,
                    depthTest: false,
                    depthWrite: false
                })
            );
            aura.frustumCulled = false;
            aura.renderOrder = 0;
            scene.add(aura);
            createStars(starMask);

            const material = new THREE.ShaderMaterial({
                vertexShader: shieldVertexShader,
                fragmentShader: shieldFragmentShader,
                uniforms: {
                    uDiffuse: { value: diffuse },
                    uSss: { value: sss }
                },
                transparent: true,
                side: THREE.DoubleSide
            });

            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    child.material = material;
                    child.renderOrder = 2;
                }
            });
            gltf.scene.scale.setScalar(13);
            scene.add(gltf.scene);

            const resize = () => {
                const width = canvas.clientWidth;
                const height = canvas.clientHeight;
                if (!width || !height) return;

                canvasSize.set(width, height);
                camera.left = -width / 100;
                camera.right = width / 100;
                camera.top = height / 100;
                camera.bottom = -height / 100;
                camera.updateProjectionMatrix();

                const anchorBounds = shieldAnchor.getBoundingClientRect();
                const canvasBounds = canvas.getBoundingClientRect();
                gltf.scene.position.set(
                    (anchorBounds.left + anchorBounds.width / 2 - canvasBounds.left - width / 2) / 50,
                    (height / 2 - anchorBounds.top - anchorBounds.height / 2 + canvasBounds.top) / 50,
                    0
                );

                renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
                renderer.setSize(width, height, false);
                renderer.render(scene, camera);
            };

            const resizeObserver = new ResizeObserver(resize);
            resizeObserver.observe(section);
            resizeObserver.observe(canvas);
            resize();
        } catch (error) {
            console.error('Security shield could not be loaded.', error);
        }
    }

    loadShield();
}
