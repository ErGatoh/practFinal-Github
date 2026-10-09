// Adapted from GitHub's intro-hero-webgl shaders.
export const screenVertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const lightFragmentShader = `
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec2 uResolution;
uniform vec4 uProgress;
uniform float uCtaAnimTime;
uniform float uCtaProgress;
varying vec2 vUv;

float pointToLineDistance(float a, float b, float x, float y) {
    return abs(a * x - y + b) / sqrt(a * a + 1.0);
}
float fbm(float x, float t) {
    float y = sin(x);
    y += sin(x * 2.1 + t) * 4.5;
    y += sin(x * 1.72 + t * 1.121) * 4.0;
    y += sin(x * 2.221 + t * 0.437) * 5.0;
    y += sin(x * 3.1122 + t * 4.269) * 2.5;
    return y * 0.06;
}
void main() {
    vec2 st = gl_FragCoord.xy / uResolution - 0.5;
    st *= uResolution / uResolution.y;
    st *= 0.8;
    st.x *= 0.8;
    st.y += 0.51;
    float angle = atan(st.y, st.x);
    float radius = length(st);
    float t = uProgress.z * 4.0 + uCtaAnimTime * 0.5;
    float f1 = fbm(angle * 4.0, t) * 0.5 + 0.5;
    radius *= mix(1.1, 1.15, f1);
    float f2 = fbm(angle * 2.0, t) * 0.5 + 0.5;
    float maxRadius = mix(1.0, 1.4, f2) - (1.0 - uProgress.y);
    float f3 = fbm(angle * 2.0, uCtaAnimTime * 0.5) * 0.5 + 0.5;
    float a = mix(1.0, mix(0.8, 1.1, f3), uCtaProgress);
    float rightLight = 1.0 - smoothstep(0.0, 0.2, pointToLineDistance(a, 0.2, st.x, st.y));
    rightLight = mix(1.0, rightLight, step(st.y, st.x * a + 0.2));
    float leftLight = 1.0 - smoothstep(0.0, 0.2, pointToLineDistance(-a, 0.2, st.x, st.y));
    leftLight = mix(1.0, leftLight, step(st.y, -st.x * a + 0.2));
    float light = rightLight * leftLight;
    light *= 1.0 - smoothstep(0.0, max(maxRadius, 0.001), radius);
    vec3 color = mix(uColor1, uColor2, light * light * 1.3);
    color *= mix(1.7, 1.0, smoothstep(0.1, 0.4, radius));
    color += mix(0.2, 0.0, smoothstep(0.1, 0.4, radius));
    color += mix(0.0, 0.07, uCtaProgress);
    float alpha = min(1.0, light * uProgress.x * 1.3 * (1.0 - smoothstep(0.3, 0.8, radius)));
    gl_FragColor = vec4(color * alpha, alpha);
}
`;

export const outputFragmentShader = `
uniform sampler2D uLight;
varying vec2 vUv;
void main() {
    gl_FragColor = texture2D(uLight, vUv);
}
`;

export const starVertexShader = `
uniform float uRadius;
uniform float uOffsetY;
uniform vec4 uProgress;
uniform float uCtaAnimTime;
attribute vec3 atranslate;
attribute vec3 arandom;
varying vec2 vUv;
const float PI = 3.14159265359;
void main() {
    vUv = uv;
    float scale = mix(0.3, 1.0, arandom.x);
    float speed = mix(0.03, 0.01, arandom.y);
    float angle = atranslate.x + cos(uProgress.y * 5.0 * speed * 3.0 + PI * arandom.z) * 0.1;
    float life = fract(atranslate.y + uProgress.y * 5.0 * speed + uCtaAnimTime * speed);
    float radius = life * uRadius;
    scale *= 1.0 - pow(life * 2.0 - 1.0, 2.0);
    vec3 offset = vec3(cos(angle) * radius, sin(angle) * radius - uOffsetY, 0.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position * scale + offset, 1.0);
}
`;

export const starFragmentShader = `
uniform sampler2D uMask;
uniform vec4 uProgress;
varying vec2 vUv;
void main() {
    float alpha = (1.0 - texture2D(uMask, vUv).r) * uProgress.x;
    gl_FragColor = vec4(vec3(alpha), alpha);
}
`;
