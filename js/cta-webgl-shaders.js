const colorAndNoiseFunctions = `
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec4 permute(vec4 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
}

vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise3D(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n = 1.0 / 7.0;
    vec3 ns = n * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(
        dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)
    ));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(
        dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)
    ), 0.0);
    m *= m;
    return 42.0 * dot(m * m, vec4(
        dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)
    ));
}
`;

export const mascotVertexShader = `
uniform vec3 u_translate;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vMVPosition;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = position + u_translate;
    vec4 mvPosition = viewMatrix * worldPosition;
    vMVPosition = mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
}
`;

const mascotFragmentBody = `
uniform sampler2D u_ao;
uniform sampler2D u_colorTex;
uniform sampler2D u_matcapTex;
uniform float uSpecularFactor;
uniform vec3 u_color;
uniform vec2 u_resolution;
uniform vec3 u_lightPos;
uniform vec3 uBgColor;
uniform vec4 uProgress;

varying vec3 vWorldPosition;
varying vec2 vUv;
varying vec3 vNormal;

#define PI 3.1415926535897932384626433832795

mat2 rotate2D(float r) {
    float s = sin(r);
    float c = cos(r);
    return mat2(c, s, -s, c);
}

vec3 blendSoftLight(vec3 base, vec3 blend) {
    return mix(
        sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend),
        2.0 * base * blend + base * base * (1.0 - 2.0 * blend),
        step(base, vec3(0.5))
    );
}

void main() {
    vec3 r = vNormal;
    float m = 2.8284271247461903 * sqrt(r.z + 1.0);
    vec2 matcapUv = r.xy / m + 0.5;
    matcapUv = rotate2D(0.0) * (matcapUv - 0.5) + 0.5;
    vec2 matcapUv2 = r.xy / m + 0.5;
    matcapUv2 = rotate2D(PI) * (matcapUv2 - 0.5) + 0.5;
    vec3 matcap = texture2D(u_matcapTex, matcapUv).rgb;
    vec3 matcap2 = texture2D(u_matcapTex, matcapUv2).rgb;
    float matcapHighlight = smoothstep(0.2, 1.0, matcap2.g) * 0.7;
    vec3 ao3 = texture2D(u_ao, vUv).rgb;
    vec3 normal = normalize(vNormal);
    float lightIntensity = max(0.0, dot(normal, normalize(u_lightPos)));
    float specular = pow(lightIntensity, 12.0) * uSpecularFactor;
    vec3 color = u_color;
    float gray = (color.r + color.g + color.b) * 0.333;

    #ifdef USE_COLORTEX
        color = texture2D(u_colorTex, vUv).rgb;
    #endif

    color = blendSoftLight(color, ao3 * ao3);
    vec3 colorAo = rgb2hsv(color);

    #if MASCOT_TYPE == 0
        float noise = snoise3D(vWorldPosition + vec3(0.0, 0.0, 2.85)) * 0.5 + 0.5;
        colorAo.r += mix(-0.15, 0.15, noise) + mix(-0.15, 0.0, ao3.g);
        colorAo.g += mix(0.0, -0.3, matcap.g);
        colorAo.b += mix(-0.2, 0.7, matcap.g);
    #endif

    #if MASCOT_TYPE == 1
        float noise = snoise3D(vWorldPosition * 1.5 + vec3(0.0, -0.15, 0.0)) * 0.5 + 0.5;
        noise = smoothstep(0.1, 0.6, noise);
        noise = mix(noise, lightIntensity * noise, noise);
        colorAo.r += mix(-0.01, 0.07, noise) + mix(-0.05, 0.05, ao3.g);
        colorAo.g += mix(0.0, -0.3, matcap.g) + mix(0.0, 0.1, noise);
        colorAo.b += mix(-0.4, 0.7, matcap.g) + mix(-0.1, 0.2, ao3.g);
    #endif

    #if MASCOT_TYPE == 2
        float noise = snoise3D(vWorldPosition * 1.7 + vec3(0.0, 0.0, 1.7)) * 0.5 + 0.5;
        colorAo.r += mix(-0.1, 0.02, noise);
        colorAo.g += mix(0.0, 0.3, matcap.g) + mix(-0.1, 0.15, noise);
        colorAo.b += mix(0.1, 0.8, matcap.g);
    #endif

    colorAo = clamp(hsv2rgb(colorAo), vec3(0.0), vec3(1.0));
    colorAo = mix(pow(colorAo, vec3(1.4)), colorAo, smoothstep(0.0, 0.1, gray));
    color = clamp(colorAo + matcapHighlight + specular, vec3(0.0), vec3(1.0));
    color = mix(uBgColor, color, uProgress.x);
    gl_FragColor = vec4(color, 1.0);
}
`;

const blackFragmentBody = `
uniform sampler2D u_matcapTex;
uniform vec3 uBgColor;
uniform vec4 uProgress;
varying vec3 vNormal;

mat2 rotate2D(float r) {
    float s = sin(r);
    float c = cos(r);
    return mat2(c, s, -s, c);
}

void main() {
    vec2 matcapUv = (vNormal.xy + 1.0) / 2.0;
    matcapUv = rotate2D(0.8) * (matcapUv - 0.5) + 0.5;
    vec3 matcap = texture2D(u_matcapTex, matcapUv).rgb;
    vec3 hsv = rgb2hsv(matcap);
    hsv.g -= 0.2;
    vec3 color = mix(uBgColor, hsv2rgb(hsv), uProgress.x);
    gl_FragColor = vec4(color, 1.0);
}
`;

export const mascotFragmentShader = colorAndNoiseFunctions + mascotFragmentBody;
export const blackMascotFragmentShader = colorAndNoiseFunctions + blackFragmentBody;

export const backgroundVertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position.xyz, 1.0);
}
`;

export const backgroundFragmentShader = colorAndNoiseFunctions + `
uniform vec3 uColor;
uniform vec4 uProgress;
varying vec2 vUv;

float parabola(float x) {
    return 4.0 * x * (1.0 - x);
}

void main() {
    float p = parabola(uProgress.z);
    float distanceFromCenter = length(vUv - 0.5);
    float alpha = smoothstep(
        0.5 * uProgress.x + p * 0.13,
        p * 0.13,
        distanceFromCenter
    );
    vec3 hsv = rgb2hsv(uColor);
    hsv.r += mix(0.05, 0.0, smoothstep(0.0, 0.2, alpha));
    hsv.g += p * 0.1;
    hsv.b += p * 0.6;
    alpha *= uProgress.y;
    gl_FragColor = vec4(hsv2rgb(hsv), alpha);
}
`;
