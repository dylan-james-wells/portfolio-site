import * as THREE from 'three'
import type { CubeState, HybridWave } from './types'
import {
  SPREAD_DROPOFF,
  WAVE_SPEED,
  COLOR_FADE_DURATION,
  WAVE_WIDTH,
  COLOR_INTENSITY,
  RIPPLE_COLORS,
} from './constants'

export function createWave(row: number, col: number, currentTime: number): HybridWave {
  const tileKey = `${row},${col}`
  const randomColor = RIPPLE_COLORS[Math.floor(Math.random() * RIPPLE_COLORS.length)]

  const affectedTiles = new Map<string, { color: THREE.Color; activatedTime: number }>()
  affectedTiles.set(tileKey, { color: randomColor.clone(), activatedTime: currentTime })

  return {
    originRow: row,
    originCol: col,
    startTime: currentTime,
    affectedTiles,
    processedDistances: new Set([0]),
  }
}

export function processWaves(
  activeHybridWaves: HybridWave[],
  cubeStates: CubeState[],
  currentTime: number,
  gridSize: number,
  emissiveAttribute: THREE.InstancedBufferAttribute,
): void {
  // Reset all cube ripple intensities
  for (const cubeState of cubeStates) {
    cubeState.rippleIntensity = 0
    cubeState.rippleColor = null
  }

  // Process each active hybrid wave
  for (let w = activeHybridWaves.length - 1; w >= 0; w--) {
    const wave = activeHybridWaves[w]
    const waveAge = currentTime - wave.startTime
    const currentWaveRadius = waveAge * WAVE_SPEED

    // Process new distance rings as the wave expands
    const maxPossibleDist = Math.ceil(currentWaveRadius) + 1
    for (let dist = 0; dist <= maxPossibleDist && dist < gridSize * 2; dist++) {
      if (wave.processedDistances.has(dist)) continue

      // Only process this ring if the wave has reached it
      if (currentWaveRadius < dist) continue

      wave.processedDistances.add(dist)

      // Find all tiles at this distance and apply probability
      for (const cubeState of cubeStates) {
        const dx = cubeState.col - wave.originCol
        const dy = cubeState.row - wave.originRow
        const tileDist = Math.sqrt(dx * dx + dy * dy)

        // Check if this tile is approximately at this distance ring
        if (Math.abs(tileDist - dist) < 0.5) {
          const tileKey = `${cubeState.row},${cubeState.col}`
          if (wave.affectedTiles.has(tileKey)) continue

          // Probability decreases with distance
          const spreadProbability = Math.pow(SPREAD_DROPOFF, dist)

          if (Math.random() < spreadProbability) {
            const randomColor = RIPPLE_COLORS[Math.floor(Math.random() * RIPPLE_COLORS.length)]
            wave.affectedTiles.set(tileKey, {
              color: randomColor.clone(),
              activatedTime: currentTime,
            })
          }
        }
      }
    }

    // Apply wave effect to affected tiles
    for (const [tileKey, tileData] of wave.affectedTiles) {
      const [rowStr, colStr] = tileKey.split(',')
      const row = parseInt(rowStr)
      const col = parseInt(colStr)

      // Cubes are created row-major, so index directly instead of scanning
      const cubeState = cubeStates[row * gridSize + col]
      if (!cubeState) continue

      const dx = col - wave.originCol
      const dy = row - wave.originRow
      const tileDist = Math.sqrt(dx * dx + dy * dy)

      // Calculate intensity based on wave position
      const distFromWaveFront = Math.abs(tileDist - currentWaveRadius)
      const waveIntensity = distFromWaveFront < WAVE_WIDTH ? 1 - distFromWaveFront / WAVE_WIDTH : 0

      // Also fade based on time since activation
      const timeSinceActivation = currentTime - tileData.activatedTime
      const timeFade = Math.max(0, 1 - timeSinceActivation / COLOR_FADE_DURATION)

      // Combine: strong when wave passes, then fades over time
      const intensity = Math.max(waveIntensity * 0.8, timeFade * 0.5)

      if (intensity > cubeState.rippleIntensity) {
        cubeState.rippleIntensity = intensity
        cubeState.rippleColor = tileData.color
      }
    }

    // Remove wave if it's completely faded
    const maxWaveDist = gridSize * 1.5
    if (waveAge > maxWaveDist / WAVE_SPEED + COLOR_FADE_DURATION) {
      activeHybridWaves.splice(w, 1)
    }
  }

  // Write premultiplied emissive colors into the per-instance attribute
  const emissive = emissiveAttribute.array as Float32Array
  for (let i = 0; i < cubeStates.length; i++) {
    const cubeState = cubeStates[i]
    if (cubeState.rippleIntensity > 0 && cubeState.rippleColor) {
      const intensity = cubeState.rippleIntensity * COLOR_INTENSITY
      emissive[i * 3 + 0] = cubeState.rippleColor.r * intensity
      emissive[i * 3 + 1] = cubeState.rippleColor.g * intensity
      emissive[i * 3 + 2] = cubeState.rippleColor.b * intensity
    } else {
      emissive[i * 3 + 0] = 0
      emissive[i * 3 + 1] = 0
      emissive[i * 3 + 2] = 0
    }
  }
  emissiveAttribute.needsUpdate = true
}
