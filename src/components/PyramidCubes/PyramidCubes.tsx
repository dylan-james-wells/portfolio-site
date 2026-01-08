'use client'

import './PyramidCubes.css'

export const PyramidCubes: React.FC = () => {
  return (
    <div className="pyramid-cubes-container">
      {/* Central Pyramid */}
      <div className="pyramid-loader">
        <div className="wrapper">
          <div className="side side1"></div>
          <div className="side side2"></div>
          <div className="side side3"></div>
          <div className="side side4"></div>
          <div className="shadow"></div>
        </div>
      </div>

      {/* Orbiting Cubes in Triangle Formation */}
      <div className="cubes-orbit">
        {/* Cube 1 - Right */}
        <div className="spinner cube-1">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>

        {/* Cube 2 - Back Left */}
        <div className="spinner cube-2">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>

        {/* Cube 3 - Front Left */}
        <div className="spinner cube-3">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </div>
  )
}
