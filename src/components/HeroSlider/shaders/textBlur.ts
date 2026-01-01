export const textBlurVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

export const textBlurFragmentShader = `
  uniform sampler2D tDiffuse;
  uniform vec2 resolution;
  uniform float blurAmount;
  uniform float aberrationStrength;
  uniform float textZoom;
  uniform float opacity;
  varying vec2 vUv;

  void main() {
    // Apply zoom by scaling UV from center
    vec2 center = vec2(0.5);
    vec2 zoomedUv = center + (vUv - center) / textZoom;

    // Early out if outside texture bounds
    if (zoomedUv.x < 0.0 || zoomedUv.x > 1.0 || zoomedUv.y < 0.0 || zoomedUv.y > 1.0) {
      gl_FragColor = vec4(0.0);
      return;
    }

    vec2 texelSize = blurAmount / resolution;

    // Chromatic aberration offset based on distance from center
    vec2 dir = zoomedUv - center;
    float dist = length(dir);
    vec2 aberrationOffset = dir * aberrationStrength * dist;

    vec3 color = vec3(0.0);
    float alpha = 0.0;

    // 9-tap blur with chromatic aberration
    for(int x = -1; x <= 1; x++) {
      for(int y = -1; y <= 1; y++) {
        vec2 offset = vec2(float(x), float(y)) * texelSize;

        // Sample each channel with slight offset for aberration
        float r = texture2D(tDiffuse, zoomedUv + offset + aberrationOffset).r;
        float g = texture2D(tDiffuse, zoomedUv + offset).g;
        float b = texture2D(tDiffuse, zoomedUv + offset - aberrationOffset).b;
        float a = texture2D(tDiffuse, zoomedUv + offset).a;

        color += vec3(r, g, b);
        alpha += a;
      }
    }
    color /= 9.0;
    alpha /= 9.0;

    gl_FragColor = vec4(color, alpha * opacity);
  }
`
