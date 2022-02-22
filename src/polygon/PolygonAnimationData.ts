/*
 * Constants
 */

export const svgSize = 100
const svgPointCount = 20 // Since logo is center aligned, this number should be even so that points aren't shared between middle two lines
const noiseRange = svgSize / (svgPointCount - 1) * 0.2 // Multiplier needs to be under 0.5 to avoid overlap
const noiseChance = 0.3 // Odds of adding noise on redraw; for the sake of performance, we don't add noise to all points [0, 1] 
const logoNoiseFactor = 0.5 // Factor to reduce noise when in logo range [0, 1]
const logoPointDistanceSquared = 100
const logoTransformGravity = 0.8 // How close logo transformations should go to anchor points [0, 1] 

// Logo constants
const logoSegW = 10
const logoSegH = logoSegW * 2.83186 // Slope of logo edge

const logoOffsetX = svgSize / 2 - logoSegW * 2
const logoOffsetY = (svgSize - logoSegH) / 2

const opacityLow = 0.25
const opacityMed = 0.35
const opacityHigh = 1

/*
 * Types
 */

export type AnimationGridProps = {
  width: string
  height: string
  color: string
}

/**
 * Animated elements for point
 */
 type PointAnimatedProps = {
  cx: number
  cy: number
  fillOpacity: number
}

/**
 * Partial animated elements from line
 * 
 * Note that positional info is available in the point animated props, 
 * so we don't have to recompute them
 */
 type LineAnimatedProps = {
  strokeOpacity: number
}

export type SvgAnimatedProps = PointAnimatedProps | LineAnimatedProps

 type PointBasic = {
  readonly x: number,
  readonly y: number
}

 type PointData = {
  readonly id: number,
  readonly orig: PointBasic,
  readonly draw?: PointBasic | null
  // Indication of logo portion, if the point is a part of one of the lines
  readonly lineState?: LineState
}

 type LineBasic = {
  readonly p1: PointBasic,
  readonly p2: PointBasic,
  readonly xMin: number,
  readonly xMax: number,
  readonly yMin: number,
  readonly yMax: number,
}

 type GridState = 'Initial' | LineState | 'Final'

 type LineState = 'Line1' | 'Line2' | 'Line3' | 'Line4'

 type GridData = {
  readonly state: GridState
  readonly points: PointData[]
  readonly paths: number[][]
  readonly lines: LineBasic[]
}


export function lineStateOpacity(lineState?: LineState | null): number {
  switch (lineState) {
    case 'Line2':
    case 'Line3':
      return opacityHigh
    case 'Line1':
    case 'Line4':
      return opacityMed
    default: return opacityLow
  }
}

/**
 * Given point, apply some noise
 */
 function noisePoint(point: PointData): PointData {
  // No modifications if part of logo
  if (point.lineState) return point
  // Noise chance not met
  if (Math.random() > noiseChance) return point
  let dNoise = noiseRange

  let { x, y } = point.orig

  if (x > logoOffsetX && x < svgSize - logoOffsetX && y > logoOffsetY && y < svgSize - logoOffsetY) {
    // Less noise within logo range
    dNoise *= logoNoiseFactor
  }

  x += rnd(-dNoise, dNoise)
  y += rnd(-dNoise, dNoise)
  const draw = { x, y }
  return { ...point, draw }
}


function lineData(data: { p1: PointBasic, p2: PointBasic }): LineBasic {
  const { p1, p2 } = data
  const x1 = p1.x
  const y1 = p1.y
  const x2 = p2.x
  const y2 = p2.y
  const xMin = Math.min(x1, x2)
  const xMax = Math.max(x1, x2)
  const yMin = Math.min(y1, y2)
  const yMax = Math.max(y1, y2)

  return {
    p1, p2, xMin, xMax, yMin, yMax
  }
}

function distanceSquared(p1: PointBasic, p2: PointBasic): number {
  const dx = p1.x - p2.x
  const dy = p1.y - p2.y
  return dx * dx + dy * dy
}

/**
 * Given {@link value} (from 0 to 1), transform linearly within the range of {@link min} to {@link max}
 */
function transformNum(value: number, min: number, max: number): number {
  return value * (max - min) + min
}

function rnd(min: number, max: number): number {
  return transformNum(Math.random(), min, max)
}

function transformPoint(start: PointBasic, end: PointBasic, factor: number): PointBasic {
  if (factor < 0) factor = 0
  else if (factor > 1) factor = 1
  const x = start.x + factor * (end.x - start.x)
  const y = start.y + factor * (end.y - start.y)
  return { x, y }
}

/**
 * Returns closest point on {@link line} relative to {@link point}.
 * 
 * Result is on the full line, not just the segment bounded by the line's two ends.
 */
function closestPoint(point: PointBasic, line: LineBasic): PointBasic {
  const { p1, p2 } = line
  const x1 = p1.x
  const y1 = p1.y
  const x2 = p2.x
  const y2 = p2.y
  const x3 = point.x
  const y3 = point.y
  const dx = x2 - x1
  const dy = y2 - y1
  const det = dx * dx + dy * dy
  const a = (dy * (y3 - y1) + dx * (x3 - x1)) / det
  let x = x1 + a * dx
  let y = y1 + a * dy
  return { x, y }
}

/**
 * Transform grid into next state.
 * We will loop through states continuously.
 * 
 * Updates will do the main transformation, which involves checking against a logo line.
 * Updates will also add some noise to non logo points, to add variation. We do this for each update so keep our noise hits low
 * and to avoid a lot of transformations in any singular update
 */
export function updatePoints(data: GridData, newState?: GridState): GridData {

  // Next state
  const state: GridState | null = newState ?? function () {
    switch (data.state) {
      case 'Initial': return 'Line1'
      case 'Line1': return 'Line2'
      case 'Line2': return 'Line3'
      case 'Line3': return 'Line4'
      case 'Line4': return 'Initial'
      // case 'Line4': return 'Final'
      // case 'Final': return 'Initial'
      default: return null
    }
  }()

  if (!state) return data // Should never happen
  if (data.state === state) return data

  // Line to update
  const updateLine = function () {
    switch (state) {
      case 'Line1': return data.lines[0]
      case 'Line2': return data.lines[1]
      case 'Line3': return data.lines[2]
      case 'Line4': return data.lines[3]
      default: return null
    }
  }()

  // No action
  if (!updateLine && state === 'Final') return { ...data, state }

  let points: PointData[]

  if (updateLine) {
    // state is a line state based on updateLine logic
    const lineState = state as LineState

    /**
     * Attempts to transform point to new logo point.
     * 
     * If nonnull, point is used in updateLine transformation.
     * If null, point is either out of range or already used.
     */
    const logoPoint: (point: PointData) => PointData | null = (point) => {
      // Point already used
      if (point.lineState) return null
      // For the sake of variation, we allow the use of draw points
      // We purposely reduce noise for potential logo points so it doesn't look too bad
      const p = point.draw ?? point.orig;
      // We only modify points within the range of the line's min and max coords
      if (p.x < updateLine.xMin || p.x > updateLine.xMax || p.y < updateLine.yMin || p.y > updateLine.yMax) return null
      // Anchor point along logo line
      const anchor = closestPoint(p, updateLine)
      const distance = distanceSquared(p, anchor)
      // If distance is too far, we ignore the transformation
      if (distance > logoPointDistanceSquared) return null
      let factor = (logoPointDistanceSquared - distance) / logoPointDistanceSquared
      factor = transformNum(factor, logoTransformGravity, 1)
      const draw = transformPoint(p, anchor, factor)
      // Draw anchor point instead
      return { ...point, draw, lineState }
    }

    points = data.points.map(point => logoPoint(point) ?? noisePoint(point))
  } else {
    // No update line -> remove lineState
    points = data.points.map(point => {
      if (point.lineState) {
        // Remove lineState *and* draw
        const { draw, lineState, ...rest } = point
        return noisePoint(rest)
      }
      // Keep draw state and add optional noise
      return noisePoint(point)
    })
  }

  return { ...data, state, points }
}

export function createPoints(): GridData {
  const xOffset = svgSize / (svgPointCount - 1)
  const yOffset = svgSize / (svgPointCount - 1)

  // Data

  // Grid data; temporary for easier path assignment
  const pointsGrid: PointData[][] = []
  // Flattened data, where point id represents index
  const points: PointData[] = []
  // Temp data for column
  let column: PointData[] = []

  let id = 0
  for (let i = 0; i < svgPointCount; i++) {
    for (let j = 0; j < svgPointCount; j++) {
      // Start columns on new j
      if (j === 0) {
        column = []
        pointsGrid.push(column)
      }
      let x = i * xOffset;
      let y = j * yOffset;
      if (i % 2 === 1) y += yOffset / 2;
      // Noise
      if (Math.random() < noiseChance) {
        let dNoise = noiseRange
        if (x > logoOffsetX && x < svgSize - logoOffsetX && y > logoOffsetY && y < svgSize - logoOffsetY) {
          // Less noise within logo range
          dNoise *= logoNoiseFactor
        }

        x += rnd(-dNoise, dNoise)
        y += rnd(-dNoise, dNoise)
      }

      // Create and add data
      const data = { id, orig: { x, y } }
      column.push(data)
      points.push(data)
      id++
    }
  }

  // Define paths by data indices so that it's immutable and independent of point data mutation
  const paths: number[][] = []

  function addPath(p1: PointData, p2: PointData) {
    paths.push([p1.id, p2.id, id])
    id++
  }

  for (let i = 0; i < svgPointCount; i++) {
    for (let j = 0; j < svgPointCount; j++) {
      // direct down
      if (j !== svgPointCount - 1) addPath(pointsGrid[i][j], pointsGrid[i][j + 1])
      // cross column attachment
      if (i !== svgPointCount - 1) {
        addPath(pointsGrid[i][j], pointsGrid[i + 1][j])
        // other cross attachment
        if (i % 2 === 0) {
          if (j !== 0) addPath(pointsGrid[i][j], pointsGrid[i + 1][j - 1])
        } else {
          if (j !== svgPointCount - 1) addPath(pointsGrid[i][j], pointsGrid[i + 1][j + 1])
        }
      }
    }
  }

  const lines = [
    lineData({ p1: { x: logoOffsetX, y: logoOffsetY }, p2: { x: logoOffsetX + logoSegW, y: logoOffsetY + logoSegH } }),
    lineData({ p1: { x: logoOffsetX + logoSegW, y: logoOffsetY + logoSegH }, p2: { x: logoOffsetX + logoSegW * 2, y: logoOffsetY } }),
    lineData({ p1: { x: logoOffsetX + logoSegW * 2, y: logoOffsetY }, p2: { x: logoOffsetX + logoSegW * 3, y: logoOffsetY + logoSegH } }),
    lineData({ p1: { x: logoOffsetX + logoSegW * 3, y: logoOffsetY + logoSegH }, p2: { x: logoOffsetX + logoSegW * 4, y: logoOffsetY } }),
  ]

  return { state: 'Initial', points, paths, lines }
}