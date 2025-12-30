import * as THREE from 'three'
import { Text } from 'troika-three-text'
import type { Scene3D } from './types'

// Code snippets in various languages
const CODE_SNIPPETS = [
  // PHP
  `<?php
function fetchUserData($id) {
    $conn = new PDO($dsn, $user, $pass);
    $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}`,
  `$router->get('/api/users/{id}', function($req, $res) {
    $user = User::find($req->params['id']);
    return $res->json($user->toArray());
});`,
  // TypeScript
  `interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

async function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  const res = await fetch(url);
  return res.json();
}`,
  `const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};`,
  // Bash
  `#!/bin/bash
for file in *.log; do
    if [ -f "$file" ]; then
        gzip "$file"
        mv "$file.gz" /var/archive/
    fi
done
echo "Archive complete"`,
  `docker build -t myapp:latest . && \\
docker push registry.io/myapp:latest && \\
kubectl rollout restart deployment/myapp`,
  // Python
  `@app.route('/webhook', methods=['POST'])
def handle_webhook():
    payload = request.get_json()
    signature = request.headers.get('X-Signature')
    if verify_signature(payload, signature):
        process_event.delay(payload)
        return jsonify({'status': 'ok'}), 200
    return jsonify({'error': 'invalid'}), 401`,
  // SQL
  `SELECT u.name, COUNT(o.id) as order_count,
       SUM(o.total) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.id
HAVING COUNT(o.id) > 5;`,
  // Go
  `func (s *Server) handleRequest(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
    defer cancel()

    result, err := s.db.QueryContext(ctx, query)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    json.NewEncoder(w).Encode(result)
}`,
  // Rust
  `impl<T: Clone> Cache<T> {
    pub fn get_or_insert(&mut self, key: &str, f: impl FnOnce() -> T) -> &T {
        if !self.data.contains_key(key) {
            self.data.insert(key.to_string(), f());
        }
        self.data.get(key).unwrap()
    }
}`,
  // JavaScript/Node
  `const rateLimit = (fn, limit) => {
  const queue = [];
  let running = 0;

  return async (...args) => {
    if (running >= limit) {
      await new Promise(r => queue.push(r));
    }
    running++;
    try { return await fn(...args); }
    finally { running--; queue.shift()?.(); }
  };
};`,
  // YAML/Config
  `apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: app
          image: myapp:latest
          resources:
            limits:
              memory: "512Mi"
              cpu: "500m"`,
]

export interface CodeRainOptions {
  colorStart?: number
  colorEnd?: number
  opacity?: number
  glowOpacity?: number
  typingSpeed?: number // base characters per second
  burstMin?: number // minimum chars per burst
  burstMax?: number // maximum chars per burst
  pauseMin?: number // minimum pause between bursts (seconds)
  pauseMax?: number // maximum pause between bursts (seconds)
  marginLeft?: number // percentage of viewport width
  marginTop?: number // percentage of viewport height
  marginBottom?: number // percentage of viewport height
  textWidthPercent?: number // percentage of viewport width for text
  outlineColor?: number // outline color for readability
  outlineWidth?: number // outline width as percentage of font size
  layerCount?: number // number of layers (default 3)
  layerGap?: number // gap between layers as % of viewport width, can be negative for overlap (default 0)
  layerScaleFactor?: number // font size multiplier per layer (default 0.75)
  layerHeightFactor?: number // max height multiplier per layer (default 0.7)
}

// Layer state for independent typing animation
interface LayerState {
  textMesh: Text
  glowMesh: Text
  debugBorder: THREE.LineLoop | null
  currentSnippetIndex: number
  currentText: string
  targetText: string
  charIndex: number
  fillRatio: number
  maxFillRatio: number
  burstCharsRemaining: number
  pauseTimeRemaining: number
  timeSinceLastChar: number
  fontScale: number
  layerIndex: number // which layer this is (0 = front)
  maxHeightRatio: number // max height as fraction of base usable height
  blurAmount: number
}

export function create(options: CodeRainOptions = {}): Scene3D {
  const {
    colorStart = 0xff6b6b,
    colorEnd = 0x4ecdc4,
    opacity = 0.25,
    glowOpacity = 0.15,
    typingSpeed = 200,
    burstMin = 3,
    burstMax = 15,
    pauseMin = 0.02,
    pauseMax = 0.15,
    marginLeft = 0.05,
    marginTop = 0.1,
    marginBottom = 0.1,
    textWidthPercent = 0.6,
    outlineColor = 0x000000,
    outlineWidth = 0.08,
    layerCount = 3,
    layerGap = 0,
    layerScaleFactor = 0.75,
    layerHeightFactor = 0.7,
  } = options

  const scene = new THREE.Scene()
  scene.background = null // Transparent

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(0, 0, 5)
  camera.lookAt(0, 0, 0)

  // Monospace font URL
  const monoFontUrl =
    'https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Regular.ttf'

  // Get random value in range
  const randomRange = (min: number, max: number) => min + Math.random() * (max - min)

  // Create layers (back to front, so furthest layer is rendered first)
  const layers: LayerState[] = []

  for (let i = layerCount - 1; i >= 0; i--) {
    const fontScale = Math.pow(layerScaleFactor, i)
    const maxHeightRatio = Math.pow(layerHeightFactor, i) // smaller max height for back layers
    const layerOpacity = opacity * Math.pow(0.8, i) // slightly fade back layers
    const layerGlowOpacity = glowOpacity * Math.pow(0.7, i)
    const blurAmount = i * 0.015 // progressive blur for back layers

    // Create main text mesh (anchor at center for vertical centering)
    const textMesh = new Text()
    textMesh.text = ''
    textMesh.font = monoFontUrl
    textMesh.fontSize = 0.1
    textMesh.anchorX = 'left'
    textMesh.anchorY = 'middle'
    textMesh.color = colorStart
    textMesh.fillOpacity = layerOpacity
    textMesh.outlineColor = outlineColor
    textMesh.outlineWidth = `${outlineWidth * 100}%`
    textMesh.outlineOpacity = layerOpacity * 0.8
    textMesh.maxWidth = 4
    textMesh.position.z = -i * 0.1 // Push back layers further

    scene.add(textMesh)

    // Create glow mesh
    const glowMesh = new Text()
    glowMesh.text = ''
    glowMesh.font = monoFontUrl
    glowMesh.fontSize = 0.1
    glowMesh.anchorX = 'left'
    glowMesh.anchorY = 'middle'
    glowMesh.color = colorEnd
    glowMesh.fillOpacity = layerGlowOpacity
    glowMesh.maxWidth = 4
    glowMesh.position.z = -i * 0.1 + 0.01
    glowMesh.scale.setScalar(1.03)
    glowMesh.depthWrite = false

    scene.add(glowMesh)

    // Create debug border (temporary visualization)
    const borderGeometry = new THREE.BufferGeometry()
    const borderMaterial = new THREE.LineBasicMaterial({
      color: i === 0 ? 0xff0000 : i === 1 ? 0x00ff00 : 0x0000ff, // Different color per layer
      opacity: 0.8,
      transparent: true,
    })
    const debugBorder = new THREE.LineLoop(borderGeometry, borderMaterial)
    debugBorder.position.z = -i * 0.1 + 0.02
    scene.add(debugBorder)

    // Initialize layer state with random starting snippet
    const snippetIndex = Math.floor(Math.random() * CODE_SNIPPETS.length)
    layers.push({
      textMesh,
      glowMesh,
      debugBorder,
      currentSnippetIndex: snippetIndex,
      currentText: '',
      targetText: CODE_SNIPPETS[snippetIndex],
      charIndex: 0,
      fillRatio: 0,
      maxFillRatio: 0.7 + Math.random() * 0.3, // Fill ratio relative to layer's own max height
      burstCharsRemaining: Math.floor(randomRange(burstMin, burstMax)),
      pauseTimeRemaining: 0,
      timeSinceLastChar: 0,
      fontScale,
      layerIndex: i,
      maxHeightRatio,
      blurAmount,
    })
  }

  let currentAspect = 1

  // Calculate visible dimensions at z=0
  const getVisibleDimensions = (aspect: number) => {
    const distance = camera.position.z
    const vFov = (camera.fov * Math.PI) / 180
    const visibleHeight = 2 * Math.tan(vFov / 2) * distance
    const visibleWidth = visibleHeight * aspect
    return { visibleWidth, visibleHeight }
  }

  // Position text with margins and calculate font size
  const updateTextPosition = (aspect: number) => {
    const { visibleWidth, visibleHeight } = getVisibleDimensions(aspect)

    // Calculate base font size - based on textWidthPercent for sizing reference
    const baseTextWidth = visibleWidth * textWidthPercent
    const charsPerLine = 60
    const baseFontSize = baseTextWidth / charsPerLine

    // Base usable height for text
    const usableHeight = visibleHeight * (1 - marginTop - marginBottom)

    // Gap in world units
    const gapWidth = visibleWidth * layerGap

    // Calculate x positions: each layer starts at the right edge of the previous + gap
    // Layer 0 (front) starts at marginLeft
    // Layer 1 starts at marginLeft + layer0Width + gap
    // etc.

    for (const layer of layers) {
      const fontSize = baseFontSize * layer.fontScale
      // Each layer's maxWidth scales with font size to maintain similar character count
      const layerMaxWidth = fontSize * charsPerLine

      // Calculate cumulative offset: sum of all previous layer widths + gaps
      let cumulativeOffset = 0
      for (let j = 0; j < layer.layerIndex; j++) {
        const prevFontSize = baseFontSize * Math.pow(layerScaleFactor, j)
        const prevWidth = prevFontSize * charsPerLine
        cumulativeOffset += prevWidth + gapWidth
      }

      const posX = -visibleWidth / 2 + visibleWidth * marginLeft + cumulativeOffset

      // Center vertically
      const centerY = 0
      const posY = centerY

      // Update main text mesh
      layer.textMesh.fontSize = fontSize
      layer.textMesh.position.x = posX
      layer.textMesh.position.y = posY
      layer.textMesh.maxWidth = layerMaxWidth

      // Update glow mesh
      layer.glowMesh.fontSize = fontSize
      layer.glowMesh.position.x = posX
      layer.glowMesh.position.y = posY
      layer.glowMesh.maxWidth = layerMaxWidth

      // Update debug border - show max width and max height for this layer
      const layerMaxHeight = usableHeight * layer.maxHeightRatio
      const halfHeight = layerMaxHeight / 2
      const borderVertices = new Float32Array([
        posX,
        -halfHeight,
        0, // bottom-left
        posX + layerMaxWidth,
        -halfHeight,
        0, // bottom-right
        posX + layerMaxWidth,
        halfHeight,
        0, // top-right
        posX,
        halfHeight,
        0, // top-left
      ])
      layer.debugBorder?.geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(borderVertices, 3),
      )

      // Sync meshes
      layer.textMesh.sync()
      layer.glowMesh.sync(() => {
        if (layer.glowMesh.material) {
          layer.glowMesh.material.blending = THREE.AdditiveBlending
          layer.glowMesh.material.depthWrite = false
          layer.glowMesh.material.needsUpdate = true
        }
      })
    }
  }

  // Check fill ratio for a layer (relative to its own max height)
  const checkFillRatio = (layer: LayerState) => {
    if (!layer.textMesh.textRenderInfo) return 0

    const { visibleHeight } = getVisibleDimensions(currentAspect)
    const usableHeight = visibleHeight * (1 - marginTop - marginBottom)
    // Layer's max height is scaled by its maxHeightRatio
    const layerMaxHeight = usableHeight * layer.maxHeightRatio

    const bounds = layer.textMesh.textRenderInfo.blockBounds
    const textHeight = bounds ? Math.abs(bounds[3] - bounds[1]) : 0

    return textHeight / layerMaxHeight
  }

  // Update a single layer's typing animation
  const updateLayer = (layer: LayerState, deltaTime: number) => {
    layer.timeSinceLastChar += deltaTime

    const charInterval = 1 / typingSpeed

    // Handle pause between bursts
    if (layer.pauseTimeRemaining > 0) {
      layer.pauseTimeRemaining -= deltaTime
      if (layer.pauseTimeRemaining <= 0) {
        layer.burstCharsRemaining = Math.floor(randomRange(burstMin, burstMax))
      }
    } else {
      // Type characters in bursts
      while (
        layer.timeSinceLastChar >= charInterval &&
        layer.charIndex < layer.targetText.length &&
        layer.burstCharsRemaining > 0
      ) {
        layer.timeSinceLastChar -= charInterval
        layer.charIndex++
        layer.burstCharsRemaining--
        layer.currentText = layer.targetText.slice(0, layer.charIndex)
        layer.textMesh.text = layer.currentText
        layer.glowMesh.text = layer.currentText

        if (layer.charIndex % 10 === 0) {
          layer.fillRatio = checkFillRatio(layer)
        }
      }

      // If burst is done but more chars to type, start a pause
      if (layer.burstCharsRemaining <= 0 && layer.charIndex < layer.targetText.length) {
        layer.pauseTimeRemaining = randomRange(pauseMin, pauseMax)
        layer.burstCharsRemaining = 0
      }
    }

    // If finished typing current snippet
    if (layer.charIndex >= layer.targetText.length) {
      layer.fillRatio = checkFillRatio(layer)

      if (layer.fillRatio < layer.maxFillRatio) {
        // Add another snippet
        let newIndex = layer.currentSnippetIndex
        while (newIndex === layer.currentSnippetIndex && CODE_SNIPPETS.length > 1) {
          newIndex = Math.floor(Math.random() * CODE_SNIPPETS.length)
        }
        layer.currentSnippetIndex = newIndex
        layer.targetText = layer.currentText + '\n\n' + CODE_SNIPPETS[newIndex]
        layer.burstCharsRemaining = Math.floor(randomRange(burstMin, burstMax))
      } else {
        // Reset
        let newIndex = layer.currentSnippetIndex
        while (newIndex === layer.currentSnippetIndex && CODE_SNIPPETS.length > 1) {
          newIndex = Math.floor(Math.random() * CODE_SNIPPETS.length)
        }
        layer.currentSnippetIndex = newIndex
        layer.targetText = CODE_SNIPPETS[newIndex]
        layer.charIndex = 0
        layer.currentText = ''
        layer.textMesh.text = ''
        layer.glowMesh.text = ''
        layer.fillRatio = 0
        layer.maxFillRatio = 0.7 + Math.random() * 0.3
        layer.burstCharsRemaining = Math.floor(randomRange(burstMin, burstMax))
      }
    }

    // Sync meshes
    layer.textMesh.sync()
    layer.glowMesh.sync(() => {
      if (layer.glowMesh.material) {
        layer.glowMesh.material.blending = THREE.AdditiveBlending
        layer.glowMesh.material.depthWrite = false
      }
    })
  }

  return {
    scene,
    camera,
    update: (deltaTime: number) => {
      for (const layer of layers) {
        updateLayer(layer, deltaTime)
      }
    },
    dispose: () => {
      for (const layer of layers) {
        layer.textMesh.dispose()
        layer.glowMesh.dispose()
        if (layer.debugBorder) {
          layer.debugBorder.geometry.dispose()
          ;(layer.debugBorder.material as THREE.Material).dispose()
        }
      }
    },
    resize: (width: number, height: number, aspect: number) => {
      currentAspect = aspect
      camera.aspect = aspect
      camera.updateProjectionMatrix()
      updateTextPosition(aspect)
    },
  }
}
