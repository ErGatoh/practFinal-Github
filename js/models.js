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

function readActions(container) {
    return (container.dataset.modelActions || '')
        .split(/[\s,]+/)
        .filter(Boolean);
}

function readNumber(container, name) {
    const value = Number.parseFloat(container.dataset[name]);
    return Number.isFinite(value) ? value : undefined;
}

// Mounts every model marker while keeping one shared WebGL renderer.
export function mountModels(root = document) {
    const containers = Array.from(root.querySelectorAll('[data-model]'))
        .filter((container) => MODEL_CONFIGS[container.dataset.model]);

    if (!containers.length) return null;
    if (!modelStage) modelStage = new ModelStage();

    for (const container of containers) {
        const instance = modelStage.add(
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
    }

    return modelStage;
}

// Returns the independent controller for one mounted container.
export function getModelInstance(target) {
    const container = typeof target === 'string' ? document.querySelector(target) : target;
    return container ? modelInstances.get(container) || null : null;
}

mountModels();
