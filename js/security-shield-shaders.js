export const shieldVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vModelPosition;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vModelPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const shieldFragmentShader = `
uniform sampler2D uDiffuse;
uniform sampler2D uSss;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vModelPosition;

vec3 hsvToRgb(vec3 color) {
    vec4 constants = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 channels = abs(fract(color.xxx + constants.xyz) * 6.0 - constants.www);
    return color.z * mix(constants.xxx, clamp(channels - constants.xxx, 0.0, 1.0), color.y);
}

vec3 rgbToHsv(vec3 color) {
    vec4 constants = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 first = mix(vec4(color.bg, constants.wz), vec4(color.gb, constants.xy), step(color.b, color.g));
    vec4 second = mix(vec4(first.xyw, color.r), vec4(color.r, first.yzx), step(first.x, color.r));
    float delta = second.x - min(second.w, second.y);
    return vec3(abs(second.z + (second.w - second.y) / (6.0 * delta + 1.0e-10)), delta / (second.x + 1.0e-10), second.x);
}

vec4 permute(vec4 value) {
    return mod(((value * 34.0) + 1.0) * value, 289.0);
}

vec4 inverseSqrt(vec4 value) {
    return 1.79284291400159 - 0.85373472095314 * value;
}

float simplexNoise(vec3 value) {
    const vec2 skew = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 basis = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 cell = floor(value + dot(value, skew.yyy));
    vec3 first = value - cell + dot(cell, skew.xxx);
    vec3 order = step(first.yzx, first.xyz);
    vec3 inverseOrder = 1.0 - order;
    vec3 corner1 = min(order.xyz, inverseOrder.zxy);
    vec3 corner2 = max(order.xyz, inverseOrder.zxy);
    vec3 second = first - corner1 + skew.xxx;
    vec3 third = first - corner2 + 2.0 * skew.xxx;
    vec3 fourth = first - 1.0 + 3.0 * skew.xxx;
    cell = mod(cell, 289.0);
    vec4 permutations = permute(permute(permute(
        cell.z + vec4(0.0, corner1.z, corner2.z, 1.0))
        + cell.y + vec4(0.0, corner1.y, corner2.y, 1.0))
        + cell.x + vec4(0.0, corner1.x, corner2.x, 1.0));
    float grid = 1.0 / 7.0;
    vec3 offset = grid * basis.wyz - basis.xzx;
    vec4 indices = permutations - 49.0 * floor(permutations * offset.z * offset.z);
    vec4 xIndex = floor(indices * offset.z);
    vec4 yIndex = floor(indices - 7.0 * xIndex);
    vec4 x = xIndex * offset.x + offset.yyyy;
    vec4 y = yIndex * offset.x + offset.yyyy;
    vec4 height = 1.0 - abs(x) - abs(y);
    vec4 lower = vec4(x.xy, y.xy);
    vec4 upper = vec4(x.zw, y.zw);
    vec4 lowerSign = floor(lower) * 2.0 + 1.0;
    vec4 upperSign = floor(upper) * 2.0 + 1.0;
    vec4 correction = -step(height, vec4(0.0));
    vec4 lowerGradient = lower.xzyw + lowerSign.xzyw * correction.xxyy;
    vec4 upperGradient = upper.xzyw + upperSign.xzyw * correction.zzww;
    vec3 gradient0 = vec3(lowerGradient.xy, height.x);
    vec3 gradient1 = vec3(lowerGradient.zw, height.y);
    vec3 gradient2 = vec3(upperGradient.xy, height.z);
    vec3 gradient3 = vec3(upperGradient.zw, height.w);
    vec4 normalization = inverseSqrt(vec4(
        dot(gradient0, gradient0), dot(gradient1, gradient1),
        dot(gradient2, gradient2), dot(gradient3, gradient3)
    ));
    gradient0 *= normalization.x;
    gradient1 *= normalization.y;
    gradient2 *= normalization.z;
    gradient3 *= normalization.w;
    vec4 influence = max(0.6 - vec4(
        dot(first, first), dot(second, second),
        dot(third, third), dot(fourth, fourth)
    ), 0.0);
    influence *= influence;
    return 42.0 * dot(influence * influence, vec4(
        dot(gradient0, first), dot(gradient1, second),
        dot(gradient2, third), dot(gradient3, fourth)
    ));
}

void main() {
    vec3 diffuse = texture2D(uDiffuse, vUv).rgb;
    vec3 sss = texture2D(uSss, vUv).rgb;
    vec3 color = diffuse * sss;
    float noise = simplexNoise(vModelPosition * 3.0 + 1.0) * 0.5 + 0.5;
    float fresnel = pow(1.0 - clamp(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 0.3);
    vec3 hsv = rgbToHsv(color);
    hsv.r += mix(-0.12, 0.0, smoothstep(0.0, 0.6, noise));
    color = hsvToRgb(hsv);
    color = mix(color, color + 0.5, fresnel);
    gl_FragColor = vec4(color, 1.0);
}
`;

export const securityBackdropVertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const securityAuraFragmentShader = `
uniform vec2 uCanvasSize;
varying vec2 vUv;

void main() {
    vec2 center = vec2(0.60, 0.29);
    vec2 spread = vec2(max(uCanvasSize.x * 0.31, 210.0), max(uCanvasSize.y * 0.24, 155.0));
    vec2 distance = (vUv - center) * uCanvasSize / spread;
    float radius = dot(distance, distance);
    float purple = exp(-radius * 1.65);
    float pink = exp(-radius * 5.4);
    float white = exp(-radius * 16.0);
    vec3 color = vec3(0.24, 0.17, 0.75) * purple;
    color += vec3(0.74, 0.41, 0.91) * pink * 0.68;
    color += vec3(1.0, 0.93, 1.0) * white * 0.62;
    float alpha = clamp(purple * 0.52 + pink * 0.23 + white * 0.15, 0.0, 0.82);
    gl_FragColor = vec4(color / max(alpha, 0.001), alpha);
}
`;

export const securityStarVertexShader = `
uniform vec2 uCanvasSize;
attribute vec2 aCenter;
attribute float aSize;
attribute float aOpacity;
varying vec2 vUv;
varying float vOpacity;

void main() {
    vUv = uv;
    vOpacity = aOpacity;
    vec2 positionOnCanvas = aCenter + position.xy * aSize / uCanvasSize;
    gl_Position = vec4(positionOnCanvas * 2.0 - 1.0, 0.0, 1.0);
}
`;

export const securityStarFragmentShader = `
uniform sampler2D uStarMask;
varying vec2 vUv;
varying float vOpacity;

void main() {
    float alpha = (1.0 - texture2D(uStarMask, vUv).r) * vOpacity;
    gl_FragColor = vec4(vec3(0.92, 0.85, 1.0), alpha);
}
`;
