import { ModelStage } from './script.js';
import { catConfig } from './cat.js';
import { copilotConfig } from './copilot.js';
import { duckConfig } from './duck.js';

const MODEL_CONFIGS = Object.freeze({
    cat: catConfig,
    copilot: copilotConfig,
    duck: duckConfig
});

let modelStage = null;
const modelInstances = new WeakMap();
const localStages = new WeakMap();

function readActions(container) {
    return (container.dataset.modelActions || '')
        .split(/[\s,]+/)
        .filter(Boolean);
}

function readNumber(container, name) {
    const value = Number.parseFloat(container.dataset[name]);
    return Number.isFinite(value) ? value : undefined;
}

// Mounts model markers in either their own canvas or the shared renderer.
export function mountModels(root = document) {
    const containers = Array.from(root.querySelectorAll('[data-model]'))
        .filter((container) => MODEL_CONFIGS[container.dataset.model]);

    if (!containers.length) return null;
    let mountedStage = null;
    for (const container of containers) {
        if (modelInstances.has(container)) continue;
        const canvas = container.querySelector('.workflow-copilot-canvas')
            || (container.dataset.model === 'cat'
                ? container.closest('.collaboration-section')?.querySelector('.collaboration-webgl-canvas')
                : null);
        if (canvas && !localStages.has(canvas)) {
            localStages.set(canvas, new ModelStage({ canvas }));
        }
        if (!canvas && !modelStage) modelStage = new ModelStage();
        const stage = canvas ? localStages.get(canvas) : modelStage;
        const instance = stage.add(
            MODEL_CONFIGS[container.dataset.model],
            container,
            {
                actions: readActions(container),
                scale: readNumber(container, 'modelScale'),
                positionY: readNumber(container, 'modelPositionY'),
                cameraDistance: readNumber(container, 'modelCameraDistance')
            }
        );
        if (instance) modelInstances.set(container, instance);
        mountedStage = stage;
    }

    return modelStage || mountedStage;
}

// Returns the independent controller for one mounted container.
export function getModelInstance(target) {
    const container = typeof target === 'string' ? document.querySelector(target) : target;
    return container ? modelInstances.get(container) || null : null;
}

// Returns the shared renderer controller for scene-level effects.
export function getModelStage() {
    return modelStage;
}

mountModels();
