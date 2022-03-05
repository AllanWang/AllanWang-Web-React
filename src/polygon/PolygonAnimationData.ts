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
const noiseChance = 0.5 // Odds of adding noise on redraw; for the sake of performance, we don't add noise to all points [0, 1] 
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
  readonly anchored: boolean
  readonly points: PointLogoTransformation[]
}

export type PointData = {
  readonly id: number
  readonly orig: PointBasic
  readonly draw?: PointBasic | null
  // Indication of logo portion, if the point is a part of one of the lines
  readonly logo?: {
    readonly lineState: LineState
    readonly anchor: PointBasic
  }
}

export type LineRef = {
  readonly p1Id: number
  readonly p2Id: number
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
  readonly lines: LineData[]
  readonly logoLines: Map<string, LogoLine>
  readonly debug?: number[][]
} & GridInfo

function transformMap<K, V, R>(map: Map<K, V>, transform: (key: K, value: V) => R): Map<K, R> {
  return new Map(Array.from(map.entries(), ([k, v]) => [k, transform(k, v)]))
}

/**
 * Given point, apply some noise
 */
function noisePoint(point: PointData, info: GridInfo): PointData {
  // Noise chance not met
  if (Math.random() > noiseChance) return point
  const dNoise = info.noiseRange * noiseRangeMultiplier
  let { x, y } = point.orig
  x += rnd(-dNoise, dNoise)
  y += rnd(-dNoise, dNoise)
  const draw = { x, y }
  return { ...point, draw }
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
    if (Math.abs(x - ox) > info.minDelta + info.noiseRange) continue
    if (Math.abs(y - oy) > info.minDelta + info.noiseRange) continue
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
  return { x, y }
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
      // case 'Final': return 'Initial'
      default: return null
    }
  }()

  if (!state) return data // Should never happen
  if (data.state === state) return data

  const points = data.points.map(point => {
    const { draw, logo, ...rest } = point // TODO update
    return noisePoint(rest, data)
  })

  if (state === 'Initial') {
    // Remove all anchors
    const logoLines = transformMap(data.logoLines, (_k, v) => ({ ...v, anchored: false }))
    return { ...data, state, logoLines, points }
  }

  const updateLine = data.logoLines.get(state)
  if (!updateLine) return { ...data, state, points }

  // Copy and update
  const logoLines = transformMap(data.logoLines, (_k, v) => v)
  logoLines.set(updateLine.lineState, { ...updateLine, anchored: true })

  return { ...data, state, logoLines, points }

  // Line to update
  // const updateLine = function () {
  //   switch (state) {
  //     case 'Line1': return data.lines[0]
  //     case 'Line2': return data.lines[1]
  //     case 'Line3': return data.lines[2]
  //     case 'Line4': return data.lines[3]
  //     default: return null
  //   }
  // }()

  // // No action
  // if (!updateLine && state === 'Final') return { ...data, state }

  // let points: PointData[]

  // if (updateLine) {
  //   // state is a line state based on updateLine logic
  //   const lineState = state as LineState

  //   /**
  //    * Attempts to transform point to new logo point.
  //    * 
  //    * If nonnull, point is used in updateLine transformation.
  //    * If null, point is either out of range or already used.
  //    */
  //   const logoPoint: (point: PointData) => PointData | null = (point) => {
  //     // Point already used
  //     if (point.lineState) return null
  //     const p = point.orig
  //     if (!isCandidateForLine(p, updateLine, data)) return null
  //     // Anchor point along logo line
  //     const anchor = anchorPoint(p, updateLine, data)
  //     const distance = distanceSquared(p, anchor)
  //     // If distance is too far, we ignore the transformation
  //     if (distance > logoPointDistanceSquared) return null
  //     const draw = anchor
  //     // Draw anchor point instead
  //     return { ...point, draw, lineState }
  //   }

  //   points = data.points.map(point => logoPoint(point) ?? noisePoint(point, data))
  // } else {
  //   // No update line -> remove lineState
  //   points = data.points.map(point => {
  //     if (point.lineState) {
  //       // Remove lineState *and* draw
  //       const { draw, lineState, ...rest } = point
  //       return noisePoint(rest, data)
  //     }
  //     // Keep draw state and add optional noise
  //     return noisePoint(point, data)
  //   })
  // }

  // return { ...data, state, points }
}

/**
 * Generates square grid of points, where each edge is size {@link rowCount}
 */
function createPointsUniform(rowCount: number = 25): GridPointData {
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

  const points: PointData[] = pointInfo.points
    .map((p: PointBasic, id: number) => ({ id, orig: p }))
    .map(p => noisePoint(p, info))

  const paths: LineRef[] = []

  const delaunay = Delaunator.from(points, (p: PointData) => p.orig.x, (p: PointData) => p.orig.y)

  // https://mapbox.github.io/delaunator/

  function nextHalfEdge(e: number): number {
    return (e % 3 === 2) ? e - 2 : e + 1
  }

  for (let e = 0; e < delaunay.triangles.length; e++) {
    if (e > delaunay.halfedges[e]) {
      const p1Id = delaunay.triangles[e];
      const p2Id = delaunay.triangles[nextHalfEdge(e)];
      paths.push({p1Id, p2Id})
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

  const debug: number[] = []


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

    let curr = {
      ...firstPoint,
      d2: dS(firstPoint.id, line.p2),
      // Anchor first point to line p1
      anchor: line.p1
    }
    let next = nextTransformationPoint(curr, line)

    while (next) {
      transformations.push({ id: curr.id, anchor: curr.anchor })
      curr = next
      next = nextTransformationPoint(curr, line)
    }

    // Anchor last point to line p2
    transformations.push({ id: curr.id, anchor: line.p2 })
    return {
      lineState,
      anchored: false,
      points: transformations
    }
  }

  const logoLineData: [LineState, { p1: PointBasic, p2: PointBasic }][] = [
    ['Line1', { p1: { x: logoOffsetX, y: logoOffsetY }, p2: { x: logoOffsetX + logoSegW, y: logoOffsetY + logoSegH } }],
    ['Line2', { p1: { x: logoOffsetX + logoSegW, y: logoOffsetY + logoSegH }, p2: { x: logoOffsetX + logoSegW * 2, y: logoOffsetY } }],
    ['Line3', { p1: { x: logoOffsetX + logoSegW * 2, y: logoOffsetY }, p2: { x: logoOffsetX + logoSegW * 3, y: logoOffsetY + logoSegH } }],
    ['Line4', { p1: { x: logoOffsetX + logoSegW * 3, y: logoOffsetY + logoSegH }, p2: { x: logoOffsetX + logoSegW * 4, y: logoOffsetY } }],
  ]

  const logoLines = new Map(logoLineData.map(([k, v]) => [k, transformationLine(k, lineData(v))]))

  return { state: 'Initial', points, paths, lines: logoLineData.map(([, v]) => lineData(v)), logoLines, ...info, debug: [debug] }
}