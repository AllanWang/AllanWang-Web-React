import { useLayoutEffect, useState } from 'react';
import { animated, useSprings, AnimationProps } from 'react-spring'
import { hexToRgb, useTheme } from '@mui/material/styles';
import { Box } from '@mui/material';
import { useRef } from 'react';
import './PolygonAnimation.scss';
import { AnimationGridProps, createGrid, lineStateOpacity, SvgAnimatedProps, svgSize, updatePoints } from './PolygonAnimationData';

const springAnimDuration = 300

type WindowSize = {
  width: number,
  height: number
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

  const svgSize = Math.max(refWidth, refHeight)
  const marginX = (refWidth - svgSize) / 2
  const marginY = (refHeight - svgSize) / 2

  const animationGridProps: AnimationGridProps = {
    width: `${svgSize}px`, height: `${svgSize}px`, color: rgb(theme.palette.primary.main)
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
        width: `${svgSize}px`,
        height: `${svgSize}px`
      }}>
        <AnimationGrid {...animationGridProps} />
      </Box>
    </Box>
  )
}

function AnimationGrid(props: AnimationGridProps) {
  const [grid, setGrid] = useState(createGrid)

  function svgAnimatedProps(index: number): SvgAnimatedProps {
    if (index < grid.points.length) {
      // Point animation
      const point = grid.points[index]
      const p = point.draw ?? point.orig
      return {
        cx: p.x,
        cy: p.y,
        fillOpacity: lineStateOpacity(point.lineState),
      }
    }
    // Line animation
    const [p1Id, p2Id] = grid.paths[index - grid.points.length]
    const point1 = grid.points[p1Id]
    const point2 = grid.points[p2Id]
    const lineState = point1.lineState === point2.lineState ? point1.lineState : null
    return {
      strokeOpacity: lineStateOpacity(lineState),
    }
  }

  // https://react-spring.io/common/props
  function springContents(index: number): SvgAnimatedProps & AnimationProps {
    return {
      ...svgAnimatedProps(index),
      // delay: 500,
      config: { duration: springAnimDuration }
    }
  }

  const springCount = grid.points.length + grid.paths.length

  // Create a spri;ng for every point and line
  const [springs,  /* api */] = useSprings<SvgAnimatedProps>(springCount, springContents, [grid])

  return (
    <animated.svg style={{ ['--svg-color' as any]: props.color }} className="svg-grid" viewBox={`0 0 ${svgSize} ${svgSize}`} onClick={() => {
      setGrid(updatePoints(grid))
    }}>
      {
        springs.map((styles, i) => {
          if (i < grid.points.length) return <animated.circle key={i} {...styles} />
          const [p1Id, p2Id] = grid.paths[i - grid.points.length]
          const p1 = springs[p1Id]
          const p2 = springs[p2Id]

          const lineStyles = { ...styles, x1: p1.cx, y1: p1.cy, x2: p2.cx, y2: p2.cy }

          return <animated.line key={i} {...lineStyles} />
        })
      }
    </animated.svg>
  )
}