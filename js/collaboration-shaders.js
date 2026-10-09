export const collaborationScreenVertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const collaborationAuraFragmentShader = `
uniform vec2 uCanvasSize;
varying vec2 vUv;

void main() {
    vec2 center = vec2(0.5, 0.29);
    vec2 spread = vec2(max(uCanvasSize.x * 0.32, 180.0), max(uCanvasSize.y * 0.24, 125.0));
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

export const collaborationStarVertexShader = `
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

export const collaborationStarFragmentShader = `
uniform sampler2D uStarMask;
varying vec2 vUv;
varying float vOpacity;

void main() {
    float alpha = (1.0 - texture2D(uStarMask, vUv).r) * vOpacity;
    gl_FragColor = vec4(vec3(0.92, 0.85, 1.0), alpha);
}
`;
