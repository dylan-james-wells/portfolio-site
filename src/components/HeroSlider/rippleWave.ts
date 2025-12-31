import * as THREE from 'three'
import type { CubeData, HybridWave } from './types'
import {
  GRID_SIZE,
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
  cubeDataList: CubeData[],
  currentTime: number,
): void {
  // Reset all cube ripple intensities
  for (const cubeData of cubeDataList) {
    cubeData.rippleIntensity = 0
    cubeData.rippleColor = null
  }

  // Process each active hybrid wave
  for (let w = activeHybridWaves.length - 1; w >= 0; w--) {
    const wave = activeHybridWaves[w]
    const waveAge = currentTime - wave.startTime
    const currentWaveRadius = waveAge * WAVE_SPEED

    // Process new distance rings as the wave expands
    const maxPossibleDist = Math.ceil(currentWaveRadius) + 1
    for (let dist = 0; dist <= maxPossibleDist && dist < GRID_SIZE * 2; dist++) {
      if (wave.processedDistances.has(dist)) continue

      // Only process this ring if the wave has reached it
      if (currentWaveRadius < dist) continue

      wave.processedDistances.add(dist)

      // Find all tiles at this distance and apply probability
      for (const cubeData of cubeDataList) {
        const dx = cubeData.col - wave.originCol
        const dy = cubeData.row - wave.originRow
        const tileDist = Math.sqrt(dx * dx + dy * dy)

        // Check if this tile is approximately at this distance ring
        if (Math.abs(tileDist - dist) < 0.5) {
          const tileKey = `${cubeData.row},${cubeData.col}`
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

      const cubeData = cubeDataList.find((c) => c.row === row && c.col === col)
      if (!cubeData) continue

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

      if (intensity > cubeData.rippleIntensity) {
        cubeData.rippleIntensity = intensity
        cubeData.rippleColor = tileData.color
      }
    }

    // Remove wave if it's completely faded
    const maxWaveDist = GRID_SIZE * 1.5
    if (waveAge > maxWaveDist / WAVE_SPEED + COLOR_FADE_DURATION) {
      activeHybridWaves.splice(w, 1)
    }
  }

  // Apply colors to materials
  for (const cubeData of cubeDataList) {
    if (cubeData.rippleIntensity > 0 && cubeData.rippleColor) {
      const intensity = cubeData.rippleIntensity
      for (const mat of cubeData.faceMaterials) {
        mat.emissive.copy(cubeData.rippleColor)
        mat.emissiveIntensity = intensity * COLOR_INTENSITY
      }
    } else {
      // Reset to default (no emissive)
      for (const mat of cubeData.faceMaterials) {
        mat.emissive.setHex(0x000000)
        mat.emissiveIntensity = 0
      }
    }
  }
}
