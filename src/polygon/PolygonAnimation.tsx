import { useEffect, useLayoutEffect, useState } from 'react';
import { hexToRgb, useTheme } from '@mui/material/styles';
import { Box } from '@mui/material';
import { useRef } from 'react';
import './PolygonAnimation.scss';
import { createGrid, svgSize, updatePoints } from './PolygonAnimationData';

const autoProgress = false
const springAnimDuration = 2000
// const springAnimDuration = 600

type WindowSize = {
  width: number,
  height: number
}

type AnimationGridProps = {
  width: string
  height: string
  color: string
  colorAccent: string
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
    width: `${svgSize}px`,
    height: `${svgSize}px`,
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

  useEffect(() => {
    if (!autoProgress) return
    const timer = setTimeout(() => {
      setGrid(updatePoints(grid))
    }, springAnimDuration * 3);
    return () => clearTimeout(timer);
  }, [grid])

  const style: {} = {
    '--svg-color': props.color,
    '--svg-accent-color': props.colorAccent,
    '--svg-anim-duration': `${springAnimDuration / 1000}s`
  }

  return (
    <svg style={style} className="svg-grid" viewBox={`0 0 ${svgSize} ${svgSize}`} onClick={(e) => {
      if (grid.state === 'Final' && e.detail === 1) {
        setGrid(updatePoints(grid, 'Initial'))
      } else if (!autoProgress) {
        setGrid(updatePoints(grid))
      }
    }}>
      {
        grid.points.map((point, i) => {
          const p = point.draw ?? point.orig
          const circleProps = {
            key: `circle${i}`,
            className: point.lineState ?? undefined,
            cx: p.x,
            cy: p.y,
          }

          return <circle {...circleProps} />
        })
      }
      {
        grid.paths.map((line, i) => {
          const [p1Id, p2Id] = line
          const point1 = grid.points[p1Id]
          const point2 = grid.points[p2Id]
          const p1 = point1.draw ?? point1.orig
          const p2 = point2.draw ?? point2.orig
          const lineState = point1.lineState === point2.lineState ? point1.lineState : null

          const lineProps = {
            key: `line${i}`,
            className: lineState ?? undefined,
            d: `M${p1.x} ${p1.y} L${p2.x} ${p2.y}`,
          }

          return <path {...lineProps} />
        })
      }
    </svg>
  )
}