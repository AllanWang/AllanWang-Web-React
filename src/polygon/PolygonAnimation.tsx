import { useEffect, useLayoutEffect, useReducer, useState } from 'react';
import { hexToRgb, useTheme } from '@mui/material/styles';
import { Box } from '@mui/material';
import { useRef } from 'react';
import './PolygonAnimation.scss';
import { useSprings, animated, AnimationProps } from 'react-spring'
import { createGrid, LineRef, LogoLine, PointBasic, PointData, updatePoints } from './PolygonAnimationData';

const autoProgress = true
const springAnimDuration = 3000
const logoSpringAnimDuration = 1000 // should be smaller than springAnimDuration

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
  return point.draw ?? point.orig
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
    <Box ref={containerRef} sx={{
      // width: `${refWidth}px`,
      height: `${refHeight}px`,
      overflow: 'hidden'
    }}>
      {/* <p>ViewPort {size.width}px / {size.height}px; Container {refWidth}px / {refHeight}px</p> */}
      <Box sx={{
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
    }, springAnimDuration);
    return () => clearTimeout(timer);
  }, [grid.state])

  function pointSpring(index: number): PointBasic & AnimationProps {
    const point = grid.points[index]
    const p = drawPoint(point)
    return {
      x: p.x,
      y: p.y,
      config: {
        duration: point.logo ? logoSpringAnimDuration : springAnimDuration,
        round: 0.01
      }
    }
  }

  const [springs] = useSprings(
    grid.points.length,
    pointSpring,
    [grid]
  )

  function pathD(points: PointBasic[]): string {
    let d = ""
    for (const p of points) {
      if (d.length === 0) d = `M${p.x} ${p.y}`
      else d = `${d} L${p.x} ${p.y}`
    }
    return d
  }

  const logoLineValues = Array.from(grid.logoLines.values())

  type LogoLineSpring = {
    d: string,
    strokeWidth: number,
    stroke: string,
    opacity: number,
  }

  function logoLineSpring(index: number): LogoLineSpring & AnimationProps {
    const logoLine = logoLineValues[index]
    const { lineState, anchored, points } = logoLine
    const path = points.map(p => anchored ? p.anchor : drawPoint(grid.points[p.id]))
    return {
      d: pathD(path),
      strokeWidth: anchored ? 0.8 : 0.1,
      stroke: anchored && (lineState === 'Line2' || lineState === 'Line3') ? props.colorAccent : props.color,
      opacity: anchored ? 0.5 : 0.1,
      config: {
        duration: logoSpringAnimDuration,
        round: 0.01
      }
    }
  }

  const [logoSprings] = useSprings(
    logoLineValues.length,
    logoLineSpring,
    [grid]
  )

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

  function Line(line: LineRef) {
    if (line.ignore) return null

    const { p1Id, p2Id } = line

    const p1 = springs[p1Id]
    const p2 = springs[p2Id]
    if (!shouldDraw({ x: p1.x.get(), y: p1.y.get() }) && !shouldDraw({ x: p2.x.get(), y: p2.y.get() })) return null

    const key = `line-${p1Id}-${p2Id}`

    const lineProps = {
      key,
      className: key,
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
    }

    return <animated.line {...lineProps} />
  }

  function LogoLine(logoLine: LogoLine, i: number) {
    const s = logoSprings[i]
    const { lineState, anchored } = logoLine

    const key = `logo-${lineState}`

    const pathProps = {
      key,
      className: key.concat(anchored ? ' anchored' : ''),
      d: s.d,
      strokeWidth: s.strokeWidth,
      stroke: s.stroke,
      opacity: s.opacity,
    }

    return <animated.path {...pathProps} />
  }

  return (
    <animated.svg style={style} className="svg-grid" viewBox={`0 0 ${grid.svgSize} ${grid.svgSize}`} onClick={(e) => {
      if (grid.state === 'Final' && e.detail === 1) {
        dispatchGrid('Initial')
      } else if (!autoProgress) {
        dispatchGrid(null)
      }
    }}>
      {
        grid.paths.map(Line)
      }
      {
        Array.from(grid.logoLines.values(), LogoLine)
      }

    </animated.svg>
  )
}