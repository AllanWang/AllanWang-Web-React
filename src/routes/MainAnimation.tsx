import React, { useLayoutEffect, useState } from 'react';

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

function AnimationGrid(props: AnimationGridProps) {
  const [grid, setGrid] = useState(createPoints());
  return (
    <svg onClick={() => {
      setGrid(updatePoints(grid))
      console.log('asdf')
    }} viewBox={`0 0 ${svgSize} ${svgSize}`} width={props.width} height={props.height}>
      <rect x="5%" y="5%" width="90%" height="90%" fill="#ff00ff20" />
      {
        grid.points.map(p => (<Point key={p.id} {...p} />))
      }
      {
        grid.paths.map(([id1, id2]) => (<Line key={`${id1}:${id2}`} p1={grid.points[id1]} p2={grid.points[id2]} />))
      }
    </svg>
  )
}

function Point(props: PointData) {
  const point = props.draw ?? props.orig
  return (
    <circle cx={point.x} cy={point.y} r={0.1} fill={props.color ?? "#f00"} />
  )
}

function Line(props: { p1: PointData, p2: PointData, color?: string | null }) {
  const p1 = props.p1.draw ?? props.p1.orig
  const p2 = props.p2.draw ?? props.p2.orig
  const color = props.color
  return (<LineBasic {...{ p1, p2, color }} />)
}

function LineBasic(props: { p1: PointBasic, p2: PointBasic, color?: string | null }) {
  return (
    <line x1={props.p1.x} y1={props.p1.y} x2={props.p2.x} y2={props.p2.y} strokeWidth={0.05} stroke={props.color ?? "#ff00ff80"} />
  )
}

type PointBasic = {
  readonly x: number,
  readonly y: number
}

type PointData = {
  readonly id: number,
  readonly orig: PointBasic,
  readonly draw?: PointBasic | null,
  readonly color?: string | null
}

type LineData = {
  readonly p1: PointBasic,
  readonly p2: PointBasic,
  readonly xMin: number,
  readonly xMax: number,
  readonly yMin: number,
  readonly yMax: number,
}

type GridData = {
  readonly points: PointData[]
  readonly paths: number[][]
}

const svgSize = 100
const svgPointCount = 19
const noiseRange = svgSize / (svgPointCount + 1) * 0.4 // Multiplier slightly under half to avoid overlap
const logoPointDistanceSquared = 100

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

type AnchorData = PointBasic & {
  distance: number
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
function closestPoint(point: PointBasic, line: LineData): PointBasic {
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

function updatePoints(data: GridData): GridData {
  const points = data.points.map(p => {
    const newP = {
      ...p
    }
    if (newP.id == 3) {
      if (newP.draw) {
        newP.draw = null
        newP.color = null
      } else {
        newP.draw = { x: 3, y: 3 }
        newP.color = '#0f0'
      }
    }
    return newP
  })
  return { points, paths: data.paths }
}

function createPoints(): GridData {
  const xOffset = svgSize / (svgPointCount + 1)
  const yOffset = svgSize / (svgPointCount + 1)

  // Logo constants
  const logoSegW = 10
  const logoSegH = logoSegW * 2.83186 // Slope of logo edge

  const logoOffsetX = 50 - logoSegW * 2
  const logoOffsetY = (100 - logoSegH) / 2

  // Data

  const pointsGrid: PointData[][] = []
  // Flattened data, where point id represents index
  const points: PointData[] = []
  let column: PointData[] = []

  let id = 0
  for (let i = 1; i <= svgPointCount; i++) {
    for (let j = 1; j <= svgPointCount; j++) {
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

      const data = { id, orig: { x, y } }
      column.push(data)
      points.push(data)
      id++
    }
  }

  const paths: number[][] = []
  // pointsGrid.forEach(col => {
  //   for (let i = 0; i < col.length - 1; i++) {
  //     paths.push([col[i], col[i + 1]])
  //   }
  // })

  for (let i = 0; i < svgPointCount; i++) {
    for (let j = 0; j < svgPointCount; j++) {
      // direct down
      if (j != svgPointCount - 1) paths.push([pointsGrid[i][j].id, pointsGrid[i][j + 1].id])
      // cross column attachment
      if (i != svgPointCount - 1) {
        paths.push([pointsGrid[i][j].id, pointsGrid[i + 1][j].id])
        // other cross attachment
        if (i % 2 == 0) {
          if (j != svgPointCount - 1) paths.push([pointsGrid[i][j].id, pointsGrid[i + 1][j + 1].id])
        } else {
          if (j != 0) paths.push([pointsGrid[i][j].id, pointsGrid[i + 1][j - 1].id])
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

  // TODO add back without mutation
  // lines.forEach(line => {
  //   points
  //     .filter(point => {
  //       const p = point.orig
  //       return p.x > line.xMin && p.x < line.xMax && p.y > line.yMin && p.y < line.yMax
  //     })
  //     .forEach(point => {
  //       const p = point.orig
  //       const anchor = closestPoint(p, line)
  //       const distance = distanceSquared(p, anchor)
  //       if (distance > logoPointDistanceSquared) return
  //       const dest = transformPoint(p, anchor, (logoPointDistanceSquared - distance) / logoPointDistanceSquared)
  //       point.draw = dest
  //     })
  // })

  return { points, paths }
}