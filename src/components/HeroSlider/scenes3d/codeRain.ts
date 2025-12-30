import * as THREE from 'three'
// @ts-ignore
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
  marginLeft?: number // percentage of viewport width (0-1)
  marginTop?: number // percentage of viewport height (0-1)
  marginBottom?: number // percentage of viewport height (0-1)
  containerWidthPercent?: number // width of container as percentage of viewport (0-1)
  fontSizePercent?: number // font size as percentage of container width (0-1)
  outlineColor?: number // outline color for readability
  outlineWidth?: number // outline width as percentage of font size
}

// State for typing animation
interface TextState {
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
}

// Color transition state
interface ColorState {
  currentScheme: number // 0 = pink primary, 1 = teal primary
  targetScheme: number
  colorStart: THREE.Color // pink
  colorEnd: THREE.Color // teal
  currentTextColor: THREE.Color
  currentGlowColor: THREE.Color
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
    containerWidthPercent = 0.5,
    fontSizePercent = 0.025,
    outlineColor = 0x000000,
    outlineWidth = 0.08,
  } = options

  console.log('opacity', options.opacity)

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

  // Create main text mesh
  const textMesh = new Text()
  textMesh.text = ''
  textMesh.font = monoFontUrl
  textMesh.fontSize = 0.1
  textMesh.anchorX = 'left'
  textMesh.anchorY = 'middle'
  textMesh.color = colorStart
  textMesh.fillOpacity = opacity
  textMesh.outlineColor = outlineColor
  textMesh.outlineWidth = `${outlineWidth * 100}%`
  textMesh.outlineOpacity = opacity * 0.8
  textMesh.maxWidth = 4

  scene.add(textMesh)

  // Create glow mesh
  const glowMesh = new Text()
  glowMesh.text = ''
  glowMesh.font = monoFontUrl
  glowMesh.fontSize = 0.1
  glowMesh.anchorX = 'left'
  glowMesh.anchorY = 'middle'
  glowMesh.color = colorEnd
  glowMesh.fillOpacity = glowOpacity
  glowMesh.maxWidth = 4
  glowMesh.position.z = 0.01
  glowMesh.scale.setScalar(1.03)
  glowMesh.depthWrite = false

  scene.add(glowMesh)

  // Initialize state
  const snippetIndex = Math.floor(Math.random() * CODE_SNIPPETS.length)
  const state: TextState = {
    textMesh,
    glowMesh,
    debugBorder: null,
    currentSnippetIndex: snippetIndex,
    currentText: '',
    targetText: CODE_SNIPPETS[snippetIndex],
    charIndex: 0,
    fillRatio: 0,
    maxFillRatio: 0.7 + Math.random() * 0.3,
    burstCharsRemaining: Math.floor(randomRange(burstMin, burstMax)),
    pauseTimeRemaining: 0,
    timeSinceLastChar: 0,
  }

  // Initialize color state for smooth transitions
  const colorState: ColorState = {
    currentScheme: 0,
    targetScheme: 0,
    colorStart: new THREE.Color(colorStart), // pink
    colorEnd: new THREE.Color(colorEnd), // teal
    currentTextColor: new THREE.Color(colorStart),
    currentGlowColor: new THREE.Color(colorEnd),
  }

  // Speed of color transition (1 = instant, lower = slower)
  const COLOR_LERP_SPEED = 3

  // Update colors based on scheme (0 = pink text/teal glow, 1 = teal text/pink glow)
  const updateColors = (deltaTime: number) => {
    // Smoothly interpolate current scheme towards target
    const diff = colorState.targetScheme - colorState.currentScheme
    if (Math.abs(diff) > 0.001) {
      colorState.currentScheme += diff * Math.min(1, deltaTime * COLOR_LERP_SPEED)
    } else {
      colorState.currentScheme = colorState.targetScheme
    }

    const t = colorState.currentScheme

    // Interpolate text color: pink (0) -> teal (1)
    colorState.currentTextColor.copy(colorState.colorStart).lerp(colorState.colorEnd, t)

    // Interpolate glow color: teal (0) -> pink (1)
    colorState.currentGlowColor.copy(colorState.colorEnd).lerp(colorState.colorStart, t)

    // Apply colors to meshes
    state.textMesh.color = colorState.currentTextColor.getHex()
    state.glowMesh.color = colorState.currentGlowColor.getHex()
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

    // Container width as percentage of viewport
    const containerWidth = visibleWidth * containerWidthPercent

    // Font size as percentage of container width
    const fontSize = containerWidth * fontSizePercent

    // Position at left margin, centered vertically
    const posX = -visibleWidth / 2 + visibleWidth * marginLeft
    const posY = 0

    // Usable height for text
    const usableHeight = visibleHeight * (1 - marginTop - marginBottom)

    // Update main text mesh
    state.textMesh.fontSize = fontSize
    state.textMesh.position.x = posX
    state.textMesh.position.y = posY
    state.textMesh.maxWidth = containerWidth

    // Update glow mesh
    state.glowMesh.fontSize = fontSize
    state.glowMesh.position.x = posX
    state.glowMesh.position.y = posY
    state.glowMesh.maxWidth = containerWidth

    // Sync meshes
    state.textMesh.sync()
    state.glowMesh.sync(() => {
      if (state.glowMesh.material) {
        state.glowMesh.material.blending = THREE.AdditiveBlending
        state.glowMesh.material.depthWrite = false
        state.glowMesh.material.needsUpdate = true
      }
    })
  }

  // Check fill ratio
  const checkFillRatio = () => {
    if (!state.textMesh.textRenderInfo) return 0

    const { visibleHeight } = getVisibleDimensions(currentAspect)
    const usableHeight = visibleHeight * (1 - marginTop - marginBottom)

    const bounds = state.textMesh.textRenderInfo.blockBounds
    const textHeight = bounds ? Math.abs(bounds[3] - bounds[1]) : 0

    return textHeight / usableHeight
  }

  // Update typing animation
  const updateTyping = (deltaTime: number) => {
    state.timeSinceLastChar += deltaTime

    const charInterval = 1 / typingSpeed

    // Handle pause between bursts
    if (state.pauseTimeRemaining > 0) {
      state.pauseTimeRemaining -= deltaTime
      if (state.pauseTimeRemaining <= 0) {
        state.burstCharsRemaining = Math.floor(randomRange(burstMin, burstMax))
      }
    } else {
      // Type characters in bursts
      while (
        state.timeSinceLastChar >= charInterval &&
        state.charIndex < state.targetText.length &&
        state.burstCharsRemaining > 0
      ) {
        state.timeSinceLastChar -= charInterval
        state.charIndex++
        state.burstCharsRemaining--
        state.currentText = state.targetText.slice(0, state.charIndex)
        state.textMesh.text = state.currentText
        state.glowMesh.text = state.currentText

        if (state.charIndex % 10 === 0) {
          state.fillRatio = checkFillRatio()
        }
      }

      // If burst is done but more chars to type, start a pause
      if (state.burstCharsRemaining <= 0 && state.charIndex < state.targetText.length) {
        state.pauseTimeRemaining = randomRange(pauseMin, pauseMax)
        state.burstCharsRemaining = 0
      }
    }

    // If finished typing current snippet
    if (state.charIndex >= state.targetText.length) {
      state.fillRatio = checkFillRatio()

      if (state.fillRatio < state.maxFillRatio) {
        // Add another snippet
        let newIndex = state.currentSnippetIndex
        while (newIndex === state.currentSnippetIndex && CODE_SNIPPETS.length > 1) {
          newIndex = Math.floor(Math.random() * CODE_SNIPPETS.length)
        }
        state.currentSnippetIndex = newIndex
        state.targetText = state.currentText + '\n\n' + CODE_SNIPPETS[newIndex]
        state.burstCharsRemaining = Math.floor(randomRange(burstMin, burstMax))
      } else {
        // Reset
        let newIndex = state.currentSnippetIndex
        while (newIndex === state.currentSnippetIndex && CODE_SNIPPETS.length > 1) {
          newIndex = Math.floor(Math.random() * CODE_SNIPPETS.length)
        }
        state.currentSnippetIndex = newIndex
        state.targetText = CODE_SNIPPETS[newIndex]
        state.charIndex = 0
        state.currentText = ''
        state.textMesh.text = ''
        state.glowMesh.text = ''
        state.fillRatio = 0
        state.maxFillRatio = 0.7 + Math.random() * 0.3
        state.burstCharsRemaining = Math.floor(randomRange(burstMin, burstMax))
      }
    }

    // Sync meshes
    state.textMesh.sync()
    state.glowMesh.sync(() => {
      if (state.glowMesh.material) {
        state.glowMesh.material.blending = THREE.AdditiveBlending
        state.glowMesh.material.depthWrite = false
      }
    })
  }

  return {
    scene,
    camera,
    update: (deltaTime: number) => {
      updateTyping(deltaTime)
      updateColors(deltaTime)
    },
    dispose: () => {
      state.textMesh.dispose()
      state.glowMesh.dispose()
    },
    resize: (width: number, height: number, aspect: number) => {
      currentAspect = aspect
      camera.aspect = aspect
      camera.updateProjectionMatrix()
      updateTextPosition(aspect)
    },
    setColorScheme: (scheme: number) => {
      colorState.targetScheme = Math.max(0, Math.min(1, scheme))
    },
  }
}
