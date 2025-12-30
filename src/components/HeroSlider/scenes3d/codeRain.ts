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
  } = options

  const scene = new THREE.Scene()
  scene.background = null // Transparent

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(0, 0, 5)
  camera.lookAt(0, 0, 0)

  // Monospace font URL
  const monoFontUrl =
    'https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Regular.ttf'

  // Create main text mesh with troika's native styling
  const textMesh = new Text()
  textMesh.text = ''
  textMesh.font = monoFontUrl
  textMesh.fontSize = 0.1 // Will be adjusted on resize
  textMesh.anchorX = 'left'
  textMesh.anchorY = 'top'
  // Use troika's native color and outline
  textMesh.color = colorStart
  textMesh.fillOpacity = opacity
  textMesh.outlineColor = outlineColor
  textMesh.outlineWidth = `${outlineWidth * 100}%`
  textMesh.outlineOpacity = opacity * 0.8
  textMesh.maxWidth = 4 // Will be updated on resize

  scene.add(textMesh)

  // Create glow layer (slightly larger, additive blending for screen/brighten effect)
  const glowMesh = new Text()
  glowMesh.text = ''
  glowMesh.font = monoFontUrl
  glowMesh.fontSize = 0.1
  glowMesh.anchorX = 'left'
  glowMesh.anchorY = 'top'
  glowMesh.color = colorEnd
  glowMesh.fillOpacity = glowOpacity
  glowMesh.maxWidth = 4
  glowMesh.position.z = 0.01 // Slightly in front of main text for glow
  glowMesh.scale.setScalar(1.03) // Slightly larger for glow effect
  // Set up additive blending for screen/brighten effect
  glowMesh.depthWrite = false
  glowMesh.material.blending = THREE.AdditiveBlending

  scene.add(glowMesh)

  // State
  let currentSnippetIndex = Math.floor(Math.random() * CODE_SNIPPETS.length)
  let currentText = ''
  let targetText = CODE_SNIPPETS[currentSnippetIndex]
  let charIndex = 0
  let currentAspect = 1
  let fillRatio = 0 // How much of the screen is filled (0-1)
  const maxFillRatio = 0.7 + Math.random() * 0.3 // Random between 0.7 and 1.0

  // Erratic typing state
  let burstCharsRemaining = 0 // chars left in current burst
  let pauseTimeRemaining = 0 // time until next burst starts
  let timeSinceLastChar = 0

  // Get random value in range
  const randomRange = (min: number, max: number) => min + Math.random() * (max - min)

  // Start a new typing burst
  const startNewBurst = () => {
    burstCharsRemaining = Math.floor(randomRange(burstMin, burstMax))
    pauseTimeRemaining = 0
  }

  // Start a pause between bursts
  const startPause = () => {
    pauseTimeRemaining = randomRange(pauseMin, pauseMax)
    burstCharsRemaining = 0
  }

  // Initialize with a burst
  startNewBurst()

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

    // Calculate font size based on desired text width percentage
    // Approximate: ~60 chars per line at textWidthPercent width
    const targetWidth = visibleWidth * textWidthPercent
    const charsPerLine = 60
    const fontSize = targetWidth / charsPerLine

    // Position at top-left with margins
    const posX = -visibleWidth / 2 + visibleWidth * marginLeft
    const posY = visibleHeight / 2 - visibleHeight * marginTop

    // Update main text mesh
    textMesh.fontSize = fontSize
    textMesh.position.x = posX
    textMesh.position.y = posY
    textMesh.position.z = 0
    textMesh.maxWidth = targetWidth

    // Update glow mesh to match (in front for additive blending)
    glowMesh.fontSize = fontSize
    glowMesh.position.x = posX
    glowMesh.position.y = posY
    glowMesh.position.z = 0.01
    glowMesh.maxWidth = targetWidth

    // Sync both meshes
    textMesh.sync()
    glowMesh.sync(() => {
      // Apply additive blending after material is ready
      if (glowMesh.material) {
        glowMesh.material.blending = THREE.AdditiveBlending
        glowMesh.material.depthWrite = false
        glowMesh.material.needsUpdate = true
      }
    })
  }

  // Pick a new random snippet
  const pickNewSnippet = () => {
    let newIndex = currentSnippetIndex
    while (newIndex === currentSnippetIndex && CODE_SNIPPETS.length > 1) {
      newIndex = Math.floor(Math.random() * CODE_SNIPPETS.length)
    }
    currentSnippetIndex = newIndex
    targetText = CODE_SNIPPETS[currentSnippetIndex]
    charIndex = 0
    currentText = ''
  }

  // Check if we've filled enough of the screen
  const checkFillRatio = () => {
    if (!textMesh.textRenderInfo) return 0

    const { visibleHeight } = getVisibleDimensions(currentAspect)
    const usableHeight = visibleHeight * (1 - marginTop - marginBottom)

    const bounds = textMesh.textRenderInfo.blockBounds
    const textHeight = bounds ? Math.abs(bounds[3] - bounds[1]) : 0

    return textHeight / usableHeight
  }

  return {
    scene,
    camera,
    update: (deltaTime: number) => {
      timeSinceLastChar += deltaTime

      const charInterval = 1 / typingSpeed

      // Handle pause between bursts
      if (pauseTimeRemaining > 0) {
        pauseTimeRemaining -= deltaTime
        if (pauseTimeRemaining <= 0) {
          startNewBurst()
        }
      } else {
        // Type characters in bursts
        while (
          timeSinceLastChar >= charInterval &&
          charIndex < targetText.length &&
          burstCharsRemaining > 0
        ) {
          timeSinceLastChar -= charInterval
          charIndex++
          burstCharsRemaining--
          currentText = targetText.slice(0, charIndex)
          textMesh.text = currentText
          glowMesh.text = currentText

          // Check fill ratio periodically
          if (charIndex % 10 === 0) {
            fillRatio = checkFillRatio()
          }
        }

        // If burst is done but more chars to type, start a pause
        if (burstCharsRemaining <= 0 && charIndex < targetText.length) {
          startPause()
        }
      }

      // If we've finished typing the current snippet
      if (charIndex >= targetText.length) {
        fillRatio = checkFillRatio()

        // If we haven't filled enough, add another snippet
        if (fillRatio < maxFillRatio) {
          // Add a newline and pick a new snippet to append
          let newIndex = currentSnippetIndex
          while (newIndex === currentSnippetIndex && CODE_SNIPPETS.length > 1) {
            newIndex = Math.floor(Math.random() * CODE_SNIPPETS.length)
          }
          currentSnippetIndex = newIndex

          targetText = currentText + '\n\n' + CODE_SNIPPETS[currentSnippetIndex]
          startNewBurst() // Start a new burst for the new snippet
        } else {
          // We've filled enough, reset after a short pause
          pickNewSnippet()
          textMesh.text = ''
          glowMesh.text = ''
          fillRatio = 0
          startNewBurst()
        }
      }

      // Sync both text meshes
      textMesh.sync()
      glowMesh.sync(() => {
        // Ensure additive blending is applied
        if (glowMesh.material) {
          glowMesh.material.blending = THREE.AdditiveBlending
          glowMesh.material.depthWrite = false
        }
      })
    },
    dispose: () => {
      textMesh.dispose()
      glowMesh.dispose()
    },
    resize: (width: number, height: number, aspect: number) => {
      currentAspect = aspect
      camera.aspect = aspect
      camera.updateProjectionMatrix()
      updateTextPosition(aspect)
    },
  }
}
