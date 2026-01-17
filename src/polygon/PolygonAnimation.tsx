import { useEffect, useLayoutEffect, useReducer, useState } from 'react';
import { hexToRgb, useTheme } from '@mui/material/styles';
import { Box } from '@mui/material';
import { useRef } from 'react';
import './PolygonAnimation.scss';
import { createGrid, LineRef, LogoLine, PointBasic, PointData, updatePoints } from './PolygonAnimationData';

const autoProgress = true
const springAnimDuration = 1200

type WindowSize = {
  readonly width: number,
  readonly height: number
}

type AnimationGridProps = {
  readonly marginXRatio: number,
  readonly marginYRatio: number,
  readonly width: string
  readonly height: string
  readonly color: string
  readonly colorAccent: string
}

function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    function updateSize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return size;
}

/**
 * Convert hex to rgb if it starts with `#`
 * 
 * Mui function has no sanity checks for inputs, and I'm not convined that theme colors are always hex values.
 * 
 * https://github.com/mui/material-ui/blob/master/packages/mui-system/src/colorManipulator.js
 * https://github.com/mui/material-ui/blob/master/packages/mui-system/src/colorManipulator.test.js
 */
function rgb(hex: string): string {
  if (hex.startsWith('#')) return hexToRgb(hex)
  return hex
}

function drawPoint(point: PointData): PointBasic {
  const { logo } = point
  if (logo) {
    if (logo.anchored) {
      return logo.anchor
    }
  }
  // return point.draw ?? point.orig
  return point.orig
}

/**
 * Wrapper around svg animation.
 * 
 * Note that the svg is drawn in a 1:1 view box.
 * Our intention here is to have this fill the viewport, which means that we'll scale the svg
 * to the largest of width/height, then trim the necessary sides to shrink it to the view box size
 */
export default function PolygonAnimation() {
  const containerRef = useRef<HTMLInputElement>(null);
  const size: WindowSize = useWindowSize();
  const theme = useTheme();

  const el = containerRef.current

  // Ref width should be window.innerWidth - offsets - scrollbar
  // However, since that's more work, we'll just let the html element expand to match parent
  // and use its client width
  const refWidth = el?.clientWidth ?? 0
  // const refWidth = size.width - (el?.offsetLeft ?? 0) - 20
  const refHeight = size.height - (el?.offsetTop ?? 0)

  const svgSizePx = Math.max(refWidth, refHeight)
  const marginX = (refWidth - svgSizePx) / 2
  const marginY = (refHeight - svgSizePx) / 2

  const animationGridProps: AnimationGridProps = {
    marginXRatio: -marginX / svgSizePx,
    marginYRatio: -marginY / svgSizePx,
    width: `${svgSizePx}px`,
    height: `${svgSizePx}px`,
    color: rgb(theme.palette.text.secondary),
    colorAccent: rgb(theme.palette.primary.main)
  }

  return (
    <Box component="div" ref={containerRef} sx={{
      // width: `${refWidth}px`,
      height: `${refHeight}px`,
      overflow: 'hidden'
    }}>
      {/* <p>ViewPort {size.width}px / {size.height}px; Container {refWidth}px / {refHeight}px</p> */}
      <Box component="div" sx={{
        marginX: `${marginX}px`,
        marginY: `${marginY}px`,
        width: `${svgSizePx}px`,
        height: `${svgSizePx}px`
      }}>
        <AnimationGrid {...animationGridProps} />
      </Box>
    </Box>
  )
}

function AnimationGrid(props: AnimationGridProps) {

  const [grid, dispatchGrid] = useReducer(updatePoints, null, createGrid)

  useEffect(() => {
    if (!autoProgress) return
    // Interval used as final state results in no state change
    // We still want timer to cancel in case user requests an animation restart
    const timer = setInterval(() => {
      dispatchGrid(null)
    }, springAnimDuration * 2);
    return () => clearTimeout(timer);
  }, [grid.state])

  const style: {} = {
    '--svg-color': props.color,
    '--svg-accent-color': props.colorAccent,
    '--svg-anim-duration': `${springAnimDuration / 1000}s`
  }

  const marginBoundX = props.marginXRatio * grid.svgSize - 5
  const marginBoundY = props.marginYRatio * grid.svgSize - 5

  function shouldDraw(point: PointBasic): boolean {
    return point.x > marginBoundX
      && grid.svgSize - point.x > marginBoundX
      && point.y > marginBoundY
      && grid.svgSize - point.y > marginBoundY
  }

  function Path(id: string, points: PointBasic[], className?: string) {
    let d = ""
    for (const p of points) {
      if (d.length === 0) d = `M${p.x} ${p.y}`
      else d = `${d} L${p.x} ${p.y}`
    }

    const key = `path-${id}`

    const lineProps = {
      key,
      className: key.concat(className ? ' ' + className : ''),
      d
    }

    // return null
    return <path {...lineProps} />
  }

  function Point(point: PointData) {
    if (point.ignore) return null

    const p = drawPoint(point)

    if (!shouldDraw(p)) return null

    const key = `circle-${point.id}`

    const circleProps = {
      key,
      className: key.concat(point.logo?.anchored ? ' anchored' : ''),
      cx: p.x,
      cy: p.y,
    }

    return <circle {...circleProps} />
  }

  function Line(line: LineRef) {
    if (line.ignore) return null

    const { p1Id, p2Id } = line
    const point1 = grid.points[p1Id]
    const point2 = grid.points[p2Id]
    const p1 = drawPoint(point1)
    const p2 = drawPoint(point2)

    if (!shouldDraw(p1) && !shouldDraw(p2)) return null

    const key = `line-${p1Id}-${p2Id}`

    const lineProps = {
      key,
      className: key,
      d: `M${p1.x} ${p1.y} L${p2.x} ${p2.y}`,
    }

    return <path {...lineProps} />
  }

  function LogoLine(logoLine: LogoLine) {
    const { lineState, anchored, points } = logoLine
    const path = points.map(p => anchored ? p.anchor : drawPoint(grid.points[p.id]))
    return Path(`logo-${lineState}`, path, lineState.concat(anchored ? ' anchored' : ''))
  }

  return (
    <svg style={style} className="svg-grid" viewBox={`0 0 ${grid.svgSize} ${grid.svgSize}`} onClick={(e) => {
      if (grid.state === 'Final' && e.detail === 1) {
        dispatchGrid('Initial')
      } else if (!autoProgress) {
        dispatchGrid(null)
      }
    }}>
      {
        grid.points.map(Point)
      }
      {
        grid.paths.map(Line)
      }
      {
        Array.from(grid.logoLines.values(), LogoLine)
      }
    </svg>
  )
}