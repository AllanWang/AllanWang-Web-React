import React, { useLayoutEffect, useState } from 'react';
import { useSpring, animated } from 'react-spring'

type WindowSize = {
  width: number,
  height: number
}

function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    function updateSize() {
      {/* TODO figure out why width is too large */ }
      setSize({ width: window.innerWidth - 20, height: window.innerHeight });
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return size;
}

export default function MainAnimation() {
  const size: WindowSize = useWindowSize();

  return (
    <div>
      <p>{size.width}px / {size.height}px</p>
      <AnimationGrid width={`${size.width}px`} height={`${size.width}px`} />
    </div>
  )
}

type AnimationGridProps = {
  width: string,
  height: string
}

/*
 * A full component is needed as we need to be able to get the latest state in our callback, as opposed to the last one at the time of the pure component render
 */
class AnimationGrid extends React.Component<AnimationGridProps, GridData> {

  updateState: () => void

  constructor(props: AnimationGridProps) {
    super(props);
    this.state = createPoints();
    this.updateState = () => { this.setState(updatePoints(this.state, this.updateState)) }
  }

  componentDidMount() {
    // https://stackoverflow.com/a/56767883/4407321
    // Relevant in pure function, but equivalent is done here with components
    setTimeout(this.updateState, 2000)
  }

  render() {
    const props = this.props
    const grid = this.state
    return (
      <animated.svg onClick={() => {
        this.updateState()
        console.log('asdf')
      }} viewBox={`0 0 ${svgSize} ${svgSize}`} width={props.width} height={props.height}>
        <rect x="5%" y="5%" width="90%" height="90%" fill="#ff00ff20" />
        {
          grid.points.map(p => (<Point key={p.id} {...p} onRest={grid.onRest} />))
        }
        {
          grid.paths.map(([id1, id2]) => (<Line key={`${id1}:${id2}`} p1={grid.points[id1]} p2={grid.points[id2]} onRest={grid.onRest} />))
        }
      </animated.svg>
    )
  }
}

function Point(props: PointData & AnimCallback) {
  const point = props.draw ?? props.orig
  const animatedProps = useSpring({
    cx: point.x,
    cy: point.y,
    fill: props.color ?? '#ff0000ff',
    config: { duration: props.duration ?? springAnimDuration },
    onRest: () => props.onRest?.(props.id.toString())
  })
  return (
    <animated.circle {...animatedProps} r={0.1} />
  )
}

function Line(props: LineData & AnimCallback) {
  const p1 = props.p1.draw ?? props.p1.orig
  const p2 = props.p2.draw ?? props.p2.orig

  const animatedProps = useSpring({
    x1: p1.x,
    y1: p1.y,
    x2: p2.x,
    y2: p2.y,
    stroke: props.color ?? '#ff00ff80',
    config: { duration: props.duration ?? springAnimDuration },
    onRest: () => props.onRest?.(`${props.p1.id}:${props.p2.id}`)
  })

  return (
    <animated.line {...animatedProps} strokeWidth={0.05} />
  )
}

type AnimCallback = {
  readonly onRest?: (id: string) => void
}

type SvgStyle = {
  readonly duration?: number | null
  readonly color?: string | null
}

type PointBasic = {
  readonly x: number,
  readonly y: number
}

type PointData = {
  readonly id: number,
  readonly orig: PointBasic,
  readonly draw?: PointBasic | null
} & SvgStyle

type LineBasic = {
  readonly p1: PointBasic,
  readonly p2: PointBasic,
  readonly xMin: number,
  readonly xMax: number,
  readonly yMin: number,
  readonly yMax: number,
}

type LineData = {
  readonly p1: PointData,
  readonly p2: PointData,
} & SvgStyle

type GridState = 'Initial' | 'Line1' | 'Line2' | 'Line3' | 'Line4' | 'Final'

type GridData = {
  readonly state: GridState
  readonly points: PointData[]
  readonly paths: number[][]
  readonly lines: LineBasic[]
} & AnimCallback

const svgSize = 100
const svgPointCount = 19
const noiseRange = svgSize / (svgPointCount + 1) * 0.4 // Multiplier slightly under half to avoid overlap
const logoPointDistanceSquared = 100
const springAnimDuration = 300

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

function rnd(min: number, max: number): number {
  return Math.random() * (max - min) + min;
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

function updatePoints(fullData: GridData, updateState: () => void): GridData {

  // Don't use fullData after this
  // We do not intend on propagating anim callbacks
  const { onRest, ...data } = fullData

  // Next state
  const state: GridState = function () {
    switch (data.state) {
      case 'Initial': return 'Line1'
      case 'Line1': return 'Line2'
      case 'Line2': return 'Line3'
      case 'Line3': return 'Line4'
      case 'Line4': return 'Final'
      default: return 'Initial'
    }
  }()

  if (data.state == state) return data

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

  if (!updateLine) return { ...data, state }

  const points: PointData[] = data.points.map(point => {
    const p = point.orig
    // We only modify points within the range of the line's min and max coords
    if (p.x < updateLine.xMin || p.x > updateLine.xMax || p.y < updateLine.yMin || p.y > updateLine.yMax) return point
    const anchor = closestPoint(p, updateLine)
    const distance = distanceSquared(p, anchor)
    if (distance > logoPointDistanceSquared) return point
    const draw = transformPoint(p, anchor, (logoPointDistanceSquared - distance) / logoPointDistanceSquared)
    return { ...point, draw }
  })

  let onRestCalled = false

  // Basic animation callback
  // We should really get a count (n) of mutated elements, and act once onRest is called n times.
  // However, as all durations are currently the same, we will settle for the first callback and make this idempotent.
  const animCallback: AnimCallback = {
    onRest: () => {
      if (onRestCalled) return
      onRestCalled = true
      setTimeout(updateState, 500)
    }
  }

  return { ...data, state, points, ...animCallback }
}

function createPoints(): GridData {
  console.log('create points', Date.now())
  const xOffset = svgSize / (svgPointCount + 1)
  const yOffset = svgSize / (svgPointCount + 1)

  // Logo constants
  const logoSegW = 10
  const logoSegH = logoSegW * 2.83186 // Slope of logo edge

  const logoOffsetX = 50 - logoSegW * 2
  const logoOffsetY = (100 - logoSegH) / 2

  // Data

  // Grid data; temporary for easier path assignment
  const pointsGrid: PointData[][] = []
  // Flattened data, where point id represents index
  const points: PointData[] = []
  // Temp data for column
  let column: PointData[] = []

  let id = 0
  for (let i = 1; i <= svgPointCount; i++) {
    for (let j = 1; j <= svgPointCount; j++) {
      // Start columns on new j
      if (j == 1) {
        column = []
        pointsGrid.push(column)
      }
      let x = i * xOffset;
      let y = j * yOffset;
      if (i % 2 == 1) y += yOffset / 2;
      // Noise
      let dNoise = noiseRange

      if (x > logoOffsetX && x < svgSize - logoOffsetX && y > logoOffsetY && y < svgSize - logoOffsetY) {
        // Less noise within logo range
        dNoise *= 0.2
      }

      x += rnd(-dNoise, dNoise)
      y += rnd(-dNoise, dNoise)

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
    paths.push([p1.id, p2.id])
  }

  for (let i = 0; i < svgPointCount; i++) {
    for (let j = 0; j < svgPointCount; j++) {
      // direct down
      if (j != svgPointCount - 1) addPath(pointsGrid[i][j], pointsGrid[i][j + 1])
      // cross column attachment
      if (i != svgPointCount - 1) {
        addPath(pointsGrid[i][j], pointsGrid[i + 1][j])
        // other cross attachment
        if (i % 2 == 0) {
          if (j != svgPointCount - 1) addPath(pointsGrid[i][j], pointsGrid[i + 1][j + 1])
        } else {
          if (j != 0) addPath(pointsGrid[i][j], pointsGrid[i + 1][j - 1])
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

  console.log('create points done', Date.now())

  return { state: 'Initial', points, paths, lines }
}