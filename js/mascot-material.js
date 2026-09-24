import * as THREE from 'three';

const MASCOT_VERTEX_SHADER = `
uniform vec3 uTranslate;
varying vec2 vUv;
varying vec3 vViewNormal;
varying vec3 vModelPosition;

void main() {
    vUv = uv;
    vViewNormal = normalize(normalMatrix * normal);
    vModelPosition = position + uTranslate;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const MASCOT_FRAGMENT_SHADER = `
uniform sampler2D uAo;
uniform sampler2D uColorTex;
uniform sampler2D uMatcapTex;
uniform vec3 uColor;
uniform vec3 uLightDirection;

varying vec2 vUv;
varying vec3 vViewNormal;
varying vec3 vModelPosition;

vec3 blendSoftLight(vec3 base, vec3 blend) {
    return mix(
        sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend),
        2.0 * base * blend + base * base * (1.0 - 2.0 * blend),
        step(base, vec3(0.5))
    );
}

vec3 rgbToHsv(vec3 color) {
    vec4 k = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(color.bg, k.wz), vec4(color.gb, k.xy), step(color.b, color.g));
    vec4 q = mix(vec4(p.xyw, color.r), vec4(color.r, p.yzx), step(p.x, color.r));
    float difference = q.x - min(q.w, q.y);
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * difference + 1.0e-10)),
        difference / (q.x + 1.0e-10), q.x);
}

vec3 hsvToRgb(vec3 color) {
    vec4 k = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(color.xxx + k.xyz) * 6.0 - k.www);
    return color.z * mix(k.xxx, clamp(p - k.xxx, 0.0, 1.0), color.y);
}

vec4 permute(vec4 value) {
    return mod(((value * 34.0) + 1.0) * value, 289.0);
}

vec4 inverseSqrtApprox(vec4 value) {
    return 1.79284291400159 - 0.85373472095314 * value;
}

float simplexNoise(vec3 point) {
    const vec2 c = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 d = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 cell = floor(point + dot(point, c.yyy));
    vec3 corner = point - cell + dot(cell, c.xxx);
    vec3 greater = step(corner.yzx, corner.xyz);
    vec3 lesser = 1.0 - greater;
    vec3 offset1 = min(greater.xyz, lesser.zxy);
    vec3 offset2 = max(greater.xyz, lesser.zxy);
    vec3 corner1 = corner - offset1 + c.xxx;
    vec3 corner2 = corner - offset2 + 2.0 * c.xxx;
    vec3 corner3 = corner - 1.0 + 3.0 * c.xxx;
    cell = mod(cell, 289.0);
    vec4 hash = permute(permute(permute(
        cell.z + vec4(0.0, offset1.z, offset2.z, 1.0))
        + cell.y + vec4(0.0, offset1.y, offset2.y, 1.0))
        + cell.x + vec4(0.0, offset1.x, offset2.x, 1.0));
    float seventh = 1.0 / 7.0;
    vec3 normalized = seventh * d.wyz - d.xzx;
    vec4 index = hash - 49.0 * floor(hash * normalized.z * normalized.z);
    vec4 xIndex = floor(index * normalized.z);
    vec4 yIndex = floor(index - 7.0 * xIndex);
    vec4 x = xIndex * normalized.x + normalized.yyyy;
    vec4 y = yIndex * normalized.x + normalized.yyyy;
    vec4 height = 1.0 - abs(x) - abs(y);
    vec4 base0 = vec4(x.xy, y.xy);
    vec4 base1 = vec4(x.zw, y.zw);
    vec4 sign0 = floor(base0) * 2.0 + 1.0;
    vec4 sign1 = floor(base1) * 2.0 + 1.0;
    vec4 correction = -step(height, vec4(0.0));
    vec4 gradient0 = base0.xzyw + sign0.xzyw * correction.xxyy;
    vec4 gradient1 = base1.xzyw + sign1.xzyw * correction.zzww;
    vec3 point0 = vec3(gradient0.xy, height.x);
    vec3 point1 = vec3(gradient0.zw, height.y);
    vec3 point2 = vec3(gradient1.xy, height.z);
    vec3 point3 = vec3(gradient1.zw, height.w);
    vec4 normalization = inverseSqrtApprox(vec4(
        dot(point0, point0), dot(point1, point1),
        dot(point2, point2), dot(point3, point3)));
    point0 *= normalization.x;
    point1 *= normalization.y;
    point2 *= normalization.z;
    point3 *= normalization.w;
    vec4 attenuation = max(0.6 - vec4(
        dot(corner, corner), dot(corner1, corner1),
        dot(corner2, corner2), dot(corner3, corner3)), 0.0);
    attenuation *= attenuation;
    return 42.0 * dot(attenuation * attenuation, vec4(
        dot(point0, corner), dot(point1, corner1),
        dot(point2, corner2), dot(point3, corner3)));
}

void main() {
    vec3 matcapNormal = normalize(vViewNormal);
    float denominator = 2.8284271247461903 * sqrt(max(matcapNormal.z + 1.0, 0.0001));
    vec2 matcapUv = matcapNormal.xy / denominator + 0.5;
    vec3 matcap = texture2D(uMatcapTex, matcapUv).rgb;
    vec3 ao = texture2D(uAo, vUv).rgb;
    vec3 normal = normalize(vViewNormal + ao * 0.8);
    float light = dot(normal, normalize(uLightDirection)) * 0.5 + 0.5;
    light = pow(light, 12.0) * 0.5;

    vec3 color = uColor;
#ifdef USE_COLOR_TEXTURE
    color = texture2D(uColorTex, vUv).rgb;
#endif
    vec3 shaded = rgbToHsv(blendSoftLight(color, ao));

#if MASCOT_TYPE == 0
    float noise = simplexNoise(vModelPosition * 0.8 + vec3(0.0, 0.0, 1.2)) * 0.5 + 0.5;
    shaded.x += mix(-0.2, 0.1, noise);
    shaded.y += mix(0.0, 0.3, matcap.g) + 0.1;
    shaded.z += mix(-0.5, 0.7, matcap.g) + mix(0.0, 0.5, noise);
#elif MASCOT_TYPE == 1
    float noise = simplexNoise(vModelPosition * 1.6 + 0.5) * 0.5 + 0.5;
    shaded.x += mix(-0.1, 0.05, noise);
    shaded.y += mix(0.0, 0.3, matcap.g) + 0.05;
    shaded.z += mix(-0.5, 0.6, matcap.g) + mix(-0.3, 0.5, noise) + 0.1;
#elif MASCOT_TYPE == 2
    float noise = simplexNoise(vModelPosition * 0.6 + 0.5) * 0.5 + 0.5;
    shaded.x += mix(-0.1, 0.05, noise);
    shaded.y += mix(0.0, 0.3, matcap.g) + 0.05;
    shaded.z += mix(-0.3, 0.3, matcap.g) + 0.3;
#endif

    gl_FragColor = vec4(clamp(hsvToRgb(shaded) + light, 0.0, 1.0), 1.0);
}
`;

function shaderColorFromHex(hex) {
    return new THREE.Color().setRGB(
        ((hex >> 16) & 255) / 255,
        ((hex >> 8) & 255) / 255,
        (hex & 255) / 255
    );
}

// Builds the shared GitHub-style material for every mascot type.
export function createMascotMaterial({ stage, config, options, meshPosition }) {
    return new THREE.ShaderMaterial({
        vertexShader: MASCOT_VERTEX_SHADER,
        fragmentShader: MASCOT_FRAGMENT_SHADER,
        uniforms: {
            uAo: { value: stage.getTexture(options.aoMap, THREE.NoColorSpace) },
            uColorTex: { value: stage.getTexture(options.colorMap, THREE.NoColorSpace) },
            uMatcapTex: { value: stage.getTexture(options.matcapMap, THREE.NoColorSpace) },
            uColor: { value: shaderColorFromHex(options.color) },
            uLightDirection: { value: new THREE.Vector3(-1, 1, 3) },
            uTranslate: { value: meshPosition.clone() }
        },
        defines: {
            MASCOT_TYPE: config.mascotType ?? 0,
            ...(options.colorMap ? { USE_COLOR_TEXTURE: 1 } : {})
        },
        toneMapped: false
    });
}
