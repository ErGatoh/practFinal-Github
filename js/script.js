import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class InteractiveModel {
    constructor(config) {
        this.config = config;
        this.container = document.getElementById(config.containerID);

        if (!this.container) {
            console.error(`Container not found: ${config.containerID}`);
            return;
        }

        // Convert degrees to radians
        this.limitX = config.degreesHorizontal * (Math.PI / 180);
        this.limitUp = config.degreesVerticalUp * (Math.PI / 180);
        this.limitDown = config.degreesVerticalDown * (Math.PI / 180);


        this.mouseNDC = new THREE.Vector2(0, 0); // Normalized Device Coordinates
        this.model = null;

        this.initScene();
        this.loadModel();
        this.trackMouse();
        this.animate();
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 5);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        // Responsive canvas
        window.addEventListener('resize', () => {
            if (!this.container) return;
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        });
    }

    loadModel() {
        const loader = new GLTFLoader();
        const textureLoader = new THREE.TextureLoader();

        // 1. Pre-load all textures defined in the config
        const loadedTextures = {};
        if (this.config.textures) {
            for (const [meshName, textureUrl] of Object.entries(this.config.textures)) {
                loadedTextures[meshName] = textureLoader.load(textureUrl);
                loadedTextures[meshName].flipY = false; // Prevents textures from rendering upside down
            }
        }

        loader.load(this.config.modelURL, (gltf) => {
            this.model = gltf.scene;

            // 2. Traverse the model and paint each mesh
            this.model.traverse((child) => {
                if (child.isMesh) {
                    // DETECTIVE MODE: Prints the exact mesh names to your browser console
                    console.log("3D Mesh found:", child.name);

                    // Premium Vinyl/Rubber Material Base
                    const materialConfig = {
                        color: this.config.baseColor || 0xffffff,
                        roughness: 0.4,
                        metalness: 0.1,
                        clearcoat: 0.6,
                        clearcoatRoughness: 0.2
                    };

                    // Apply specific texture if mapped in the config
                    if (loadedTextures[child.name]) {
                        materialConfig.map = loadedTextures[child.name];
                    }

                    child.material = new THREE.MeshPhysicalMaterial(materialConfig);
                }
            });

            this.model.scale.set(this.config.scale, this.config.scale, this.config.scale);
            this.model.position.set(0, this.config.positionY, 0);
            this.scene.add(this.model);
        });
    }

    trackMouse() {
        document.addEventListener('mousemove', (event) => {
            const rect = this.container.getBoundingClientRect();
            
            // Creamos la variable que suma la posición real más tu offset configurado
            const ratonYFalso = event.clientY + (this.config.offsetMouseY || 0);

            this.mouseNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            // Usamos tu nueva variable aquí en lugar de event.clientY
            this.mouseNDC.y = -((ratonYFalso - rect.top) / rect.height) * 2 + 1;
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.model) {
            // 1. GET REAL HEAD POSITION:
            // Create a 3D point where the face is (offsetting from the feet)
            const headPosition3D = new THREE.Vector3(0, this.config.headHeight, 0);
            this.model.localToWorld(headPosition3D); 

            // 2. PROJECT TO 2D SCREEN:
            // Translate that exact 3D point to your monitor's 2D space
            headPosition3D.project(this.camera);

            // 3. CALCULATE REAL DISTANCE:
            // Mouse position minus face position
            const deltaX = this.mouseNDC.x - headPosition3D.x;
            const deltaY = this.mouseNDC.y - headPosition3D.y;

            // 4. CALCULATE ROTATION:
            let targetRotationY = deltaX * this.config.sensitivity; // Left/Right
            let targetRotationX = deltaY * this.config.sensitivity; // Up/Down

            // 5. INVERT AXES IF NEEDED (Fixes the bug shown in your image):
            if (this.config.invertHorizontal) targetRotationY = -targetRotationY;
            if (this.config.invertVertical) targetRotationX = -targetRotationX;

            // 6. APPLY CLAMPING (Limits):
            targetRotationY = Math.max(-this.limitX, Math.min(this.limitX, targetRotationY));
            // Intercambiamos limitUp (negativos = mirar arriba) y limitDown (positivos = mirar abajo)
            targetRotationX = Math.max(-this.limitUp, Math.min(this.limitDown, targetRotationX));

            // 7. INERTIA / DELAY (Lerp):
            this.model.rotation.y += (targetRotationY - this.model.rotation.y) * this.config.rotationSpeed;
            this.model.rotation.x += (targetRotationX - this.model.rotation.x) * this.config.rotationSpeed;
        }

        this.renderer.render(this.scene, this.camera);
        
    }
}

// ====================================================================
// 🛠️ YOUR CONFIGURABLE TEMPLATE
// ====================================================================

new InteractiveModel({
    containerID: '3d-container',
    modelURL: 'assets/cat-53c4522f687c1719.glb',
    scale: 2.0,
    positionY: -1.0, 

    // --- HEAD CALIBRATION (3D Space) ---
    // If the model pivots from the feet (0), we tell the math that the face is higher up (e.g., 0.8)
    headHeight: 0.8, 

    // --- RANGE OF MOTION ---
    degreesHorizontal: 20, // Max rotation left/right
    degreesVerticalUp: 25,   // Max rotation up
    degreesVerticalDown: 15,   // Max rotation down


    // --- BEHAVIOR ---
    sensitivity: 1.2,     // How strongly it tracks the mouse
    rotationSpeed: 0.03,  // The delay/inertia (0.03 = smooth half-second delay)

    // --- BONE CORRECTION ---
    // Fixes the issue from your image: mouse goes UP, but cat looked DOWN.
    invertHorizontal: false, 
    invertVertical: true ,  // <--- THIS fixes the vertical mismatch!
    offsetMouseY: -230,

    //COLORS AND STUFF OF THE MODEL
    baseColor: 0xd946ef,
    textures: {
        "Name_From_Console_1": "assets/head_sss-d8fae0ae80a4e382.jpg",
        "Name_From_Console_2": "assets/body_sss-81ee34ea4313f489.jpg"
    }
});