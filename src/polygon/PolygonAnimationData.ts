import Delaunator from 'delaunator';

/* eslint-disable @typescript-eslint/no-unused-vars */

/*
 * Constants
 */

const svgSize = 100

// Logo constants
const logoSegW = 7
const logoSegH = logoSegW * 2.83186 // Slope of logo edge

const logoOffsetX = svgSize / 2 - logoSegW * 2
const logoOffsetY = (svgSize - logoSegH) / 2

// max(size - offsetX * 2, size - offsetY * 2)
// const logoSize = svgSize - Math.min(logoOffsetX, logoOffsetY) * 2

const noiseRangeMultiplier = 0.5 // Multiplier needs to be under 1 to avoid overlap
const noiseLogoRangeMultiplier = 0.1
const noiseChance = 0.8 // Odds of adding noise on redraw; for the sake of performance, we don't add noise to all points [0, 1] 
const logoPointDistanceSquared = 10

/*
 * Types
 */

export type PointBasic = {
  readonly x: number
  readonly y: number
}

export type PointLogoTransformation = {
  readonly id: number
  readonly anchor: PointBasic
}

export type LogoLine = {
  readonly lineState: LineState
  readonly points: PointLogoTransformation[]
  readonly anchored?: boolean
}

type PointLogoInfo = {
  readonly lineState: LineState
  readonly anchor: PointBasic
  readonly anchored?: boolean
}

export type PointData = {
  readonly id: number
  readonly orig: PointBasic
  readonly delta: PointBasic
  // Indication of logo portion, if the point is a part of one of the lines
  readonly logo?: PointLogoInfo
  readonly ignore?: boolean
}

export type LineRef = {
  readonly p1Id: number
  readonly p2Id: number
  readonly ignore?: boolean
}

export type LineData = {
  readonly p1: PointBasic
  readonly p2: PointBasic
  readonly xMin: number
  readonly xMax: number
  readonly yMin: number
  readonly yMax: number
}

export type GridState = 'Initial' | LineState | 'Final'

export type LineState = 'Line1' | 'Line2' | 'Line3' | 'Line4'

type PointDelta = {
  readonly id: number
  readonly d2: number
}

type PointTransformationIntermediate = PointDelta & PointLogoTransformation

type GridPointData = {
  readonly points: PointBasic[]
  readonly info: GridInfo
}

type GridInfo = {
  readonly minDelta: number
  readonly noiseRange: number
  readonly svgSize: number
}

export type GridData = {
  readonly state: GridState
  readonly points: PointData[]
  readonly paths: LineRef[]
  // readonly lines: LineData[]
  readonly logoLines: LogoLine[]
} & GridInfo

function roundPoint(point: PointBasic): PointBasic {
  let { x, y } = point
  x = Math.round(x * 100) / 100
  y = Math.round(y * 100) / 100
  return { x, y }
}

/**
 * Given point, apply some noise
 */
function noisePoint(point: PointData, info: GridInfo): PointData {
  // Noise chance not met
  if (Math.random() > noiseChance) return { ...point, delta: { x: 0, y: 0 } }
  const dNoise = info.noiseRange * (point.logo ? noiseLogoRangeMultiplier : noiseRangeMultiplier)

  return { ...point, delta: roundPoint({ x: rnd(-dNoise, dNoise), y: rnd(-dNoise, dNoise) }) }
}

export function drawPoint(point: PointData): PointBasic {
  const base = point.logo?.anchored ? point.logo.anchor : point.orig
  if (!point.delta) return base
  return { x: base.x + point.delta.x, y: base.y + point.delta.y }
}

function lineData(data: { p1: PointBasic, p2: PointBasic }): LineData {
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

// function transformPoint(start: PointBasic, end: PointBasic, factor: number): PointBasic {
//   if (factor < 0) factor = 0
//   else if (factor > 1) factor = 1
//   const x = start.x + factor * (end.x - start.x)
//   const y = start.y + factor * (end.y - start.y)
//   return { x, y }
// }

/**
 * Checks if {@link point} can potentially transform onto {@link line}
 * 
 * True if coord is within min max bounds of line, plus some buffer
 */
function isCandidateForLine(point: PointBasic, line: LineData, info: GridInfo): boolean {
  const buffer = info.minDelta * 0.2;
  return point.x > line.xMin - buffer
    && point.x < line.xMax + buffer
    && point.y < line.yMax + buffer
    && point.y > line.yMin - buffer
}

function closestPointId(point: PointBasic, candidates: PointData[], info: GridInfo): PointDelta {
  let id = -1
  let d2 = info.svgSize * info.svgSize
  const ox = point.x
  const oy = point.y
  for (const p of candidates) {
    const { x, y } = p.orig
    if (Math.abs(x - ox) > info.minDelta + info.noiseRange * 2) continue
    if (Math.abs(y - oy) > info.minDelta + info.noiseRange * 2) continue
    const pd2 = distanceSquared(point, p.orig)
    if (pd2 < d2) {
      d2 = pd2
      id = p.id
    }
  }
  return { id, d2 }
}

/**
 * Returns anchor point on {@link line} relative to {@link point}.
 * 
 * Result is on the full line, not just the segment bounded by the line's two ends.
 * To produce a better logo, we'd like to ensure points match to the ends of the line.
 * As a result, we add some logic in the beginning if the point is close enough
 */
function anchorPoint(point: PointBasic, line: LineData, info: GridInfo): PointBasic {
  const { p1, p2 } = line
  // const threshold = info.minDelta / 2
  // if (Math.abs(p1.x - point.x) < threshold && Math.abs(p1.y - point.y) < threshold) return p1;
  // if (Math.abs(p2.x - point.x) < threshold && Math.abs(p2.y - point.y) < threshold) return p2;
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
  return roundPoint({ x, y })
}

function inLogoBounds(point: PointBasic): boolean {
  return point.x > logoOffsetX && svgSize - point.x > logoOffsetX && point.y > logoOffsetY && svgSize - point.y > logoOffsetY
}

/**
 * Transform grid into next state.
 * We will loop through states continuously.
 * 
 * Updates will do the main transformation, which involves checking against a logo line.
 * Updates will also add some noise to non logo points, to add variation. We do this for each update so keep our noise hits low
 * and to avoid a lot of transformations in any singular update
 */
export function updatePoints(data: GridData, newState: GridState | null): GridData {

  // Next state
  const state: GridState | null = newState ?? function () {
    switch (data.state) {
      case 'Initial': return 'Line1'
      case 'Line1': return 'Line2'
      case 'Line2': return 'Line3'
      case 'Line3': return 'Line4'
      // case 'Line4': return 'Initial'
      case 'Line4': return 'Final'
      case 'Final': return 'Final'
      // case 'Final': return 'Initial'
      default: return null
    }
  }()

  if (!state) return data // Should never happen
  // Ignore updates until we're at the 'permanent' final stage
  // Once final, we will still add noise
  if (data.state === state && state !== 'Final') return data

  let { points, logoLines } = data

  if (state === 'Initial') {
    // Remove all anchored flags
    logoLines = logoLines.map(line => {
      const { anchored, ...rest } = line
      return rest
    })

    points = points.map(point => {
      const { logo, ...rest } = point
      if (logo) {
        const { anchored, ...restLogo } = logo
        return { ...rest, logo: restLogo }
      }
      return point
    })
  } else {

    // Update anchor line
    logoLines = logoLines.map(line => {
      return line.lineState == state ? { ...line, anchored: true } : line
    })


    // Update anchor points used in logo
    points = points.map(point => {
      if (point.logo?.lineState === state) {
        return { ...point, logo: { ...point.logo, anchored: true } }
      }
      return point
    })
  }

  // Apply noise
  // Ignore for initial as that includes many line transformations
  if (state !== 'Initial') {
    points = points.map(point => {
      return noisePoint(point, data)
    })
  }

  return { ...data, state, logoLines, points }
}

/**
 * Generates square grid of points, where each edge is size {@link rowCount}
 */
function createPointsUniform(rowCount: number = 20): GridPointData {
  const delta = svgSize / (rowCount - 1)
  const points: PointBasic[] = []
  for (let i = 0; i < rowCount; i++) {
    for (let j = 0; j < rowCount; j++) {
      let x = i * delta
      let y = j * delta
      if (i % 2 === 0) y += delta / 2
      points.push({ x, y })
    }
  }
  const info = {
    minDelta: delta,
    noiseRange: delta * noiseRangeMultiplier,
    svgSize
  }
  return { points, info }
}

/**
 * Create points for grid data.
 * 
 * This is nothing but the point coords.
 */
function createPoints(): GridPointData {
  const data = createPointsUniform()
  // const points = rndDeletePoints(data.points)
  // return { ...data, points }
  return data
}

function rndDeletePoints(points: PointBasic[]): PointBasic[] {
  return points.filter(p => {
    return inLogoBounds(p) ? true : Math.random() > 0.3
  })
}

/**
 * Create grid to render animation.
 * 
 * This includes adding relevant metadata for UI, adding noise for variation, etc
 */
export function createGrid(): GridData {

  const pointInfo = createPoints()
  const info = pointInfo.info

  let points: PointData[] = pointInfo.points
    .map((p: PointBasic, id: number) => ({ id, orig: roundPoint(p), delta: { x: 0, y: 0 } }))
    .map(p => noisePoint(p, info))

  let paths: LineRef[] = []

  const delaunay = Delaunator.from(points, (p: PointData) => p.orig.x, (p: PointData) => p.orig.y)

  // https://mapbox.github.io/delaunator/

  function nextHalfEdge(e: number): number {
    return (e % 3 === 2) ? e - 2 : e + 1
  }

  for (let e = 0; e < delaunay.triangles.length; e++) {
    if (e > delaunay.halfedges[e]) {
      const p1Id = delaunay.triangles[e];
      const p2Id = delaunay.triangles[nextHalfEdge(e)];
      paths.push({ p1Id, p2Id })
    }
  }

  const pointEdgeIndex = new Map()
  for (let e = 0; e < delaunay.triangles.length; e++) {
    const endpoint = delaunay.triangles[nextHalfEdge(e)]
    if (!pointEdgeIndex.has(endpoint) || delaunay.halfedges[e] === -1) {
      pointEdgeIndex.set(endpoint, e)
    }
  }

  /**
   * Short form of distanceSquared, where first point is its id
   */
  function dS(id: number, p2: PointBasic): number {
    const p = points[id].orig
    return distanceSquared(p, p2)
  }

  const pointsInLogo: Map<number, PointLogoInfo> = new Map()


  /**
   * Given point id, final all adjacent points connected by edges
   */
  function neighbours(id: number): number[] {
    const neighbours = []
    const e = pointEdgeIndex.get(id)
    neighbours.push(delaunay.triangles[e])
    let incoming = delaunay.halfedges[nextHalfEdge(e)]
    while (incoming !== -1 && incoming !== e) {
      neighbours.push(delaunay.triangles[incoming])
      const outgoing = nextHalfEdge(incoming)
      incoming = delaunay.halfedges[outgoing]
    }
    return neighbours
  }

  /**
   * Given a point id, find the next point that goes towards line.p2.
   * 
   * The algorithm looks at neighbouring points based on the delaunay graph, 
   * where the point is closer to the destination compared to the source.
   * This is to avoid looping.
   * 
   * The selection algorithm selects the point that's closest to the underlying line,
   * which may not necessarily mean the closest point to the destination.
   */
  function nextTransformationPoint(source: PointTransformationIntermediate | null, line: LineData): PointTransformationIntermediate | null {
    if (source == null) return null
    const candidates = neighbours(source.id)
      // Cannot use the same point twice
      .filter(pid => !pointsInLogo.has(pid))
      // Point must be closer to destination to avoid infinite loops
      .filter(pid => {
        const pd2 = dS(pid, line.p2)
        return pd2 < source.d2
      })

    let next: PointLogoTransformation = source
    let minAnchorD2 = source.d2

    candidates.forEach((pid) => {
      const p = points[pid].orig
      const anchor = anchorPoint(p, line, info)
      const anchorD2 = distanceSquared(p, anchor)
      if (anchorD2 < minAnchorD2) {
        minAnchorD2 = anchorD2
        next = {
          id: pid,
          anchor
        }
      }
    })
    if (next.id === source.id) return null
    const d2 = dS(next.id, line.p2)
    return { ...next, d2 }
  }

  function transformationLine(lineState: LineState, line: LineData): LogoLine {
    const transformations: PointLogoTransformation[] = []
    const firstPoint = closestPointId(line.p1, points, info)

    function add(info: PointLogoTransformation) {
      transformations.push(info)
      // While path points cannot reuse the same point,
      // The starting points can, as they will both translate to the same anchor
      // Therefore, we have the possibility of clashing points,
      // and we want to prioritize the earlier line transformations.
      if (!pointsInLogo.has(info.id))
        pointsInLogo.set(info.id, { lineState, anchor: info.anchor })
    }

    let curr = {
      ...firstPoint,
      d2: dS(firstPoint.id, line.p2),
      // Anchor first point to line p1
      anchor: line.p1
    }
    let next = nextTransformationPoint(curr, line)

    while (next) {
      add({ id: curr.id, anchor: curr.anchor })
      curr = next
      next = nextTransformationPoint(curr, line)
    }

    // Anchor last point to line p2
    add({ id: curr.id, anchor: line.p2 })
    return {
      lineState,
      points: transformations
    }
  }

  const logoLineData: [LineState, { p1: PointBasic, p2: PointBasic }][] = [
    ['Line1', { p1: { x: logoOffsetX, y: logoOffsetY }, p2: { x: logoOffsetX + logoSegW, y: logoOffsetY + logoSegH } }],
    ['Line2', { p1: { x: logoOffsetX + logoSegW, y: logoOffsetY + logoSegH }, p2: { x: logoOffsetX + logoSegW * 2, y: logoOffsetY } }],
    ['Line3', { p1: { x: logoOffsetX + logoSegW * 2, y: logoOffsetY }, p2: { x: logoOffsetX + logoSegW * 3, y: logoOffsetY + logoSegH } }],
    ['Line4', { p1: { x: logoOffsetX + logoSegW * 3, y: logoOffsetY + logoSegH }, p2: { x: logoOffsetX + logoSegW * 4, y: logoOffsetY } }],
  ]

  const logoLines = logoLineData.map(([k, v]) => transformationLine(k, lineData(v)))
  // const lines = logoLineData.map(([, v]) => lineData(v))

  // Clean up; remove points and paths used in logo to avoid overdraw

  points = points.map(p => {
    const info = pointsInLogo.get(p.id)
    return info ? { ...p, logo: info } : p
  })
  paths = paths.map(p => {
    const p1LineState = pointsInLogo.get(p.p1Id)?.lineState
    const p2LineState = pointsInLogo.get(p.p2Id)?.lineState
    const ignore = p1LineState && p1LineState === p2LineState
    return ignore ? { ...p, ignore } : p
  })

  return { state: 'Initial', points, paths, logoLines, ...info }
}