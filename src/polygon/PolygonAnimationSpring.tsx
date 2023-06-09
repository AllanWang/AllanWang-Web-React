import { Box } from "@mui/system";
import { MouseEvent, MouseEventHandler, useEffect, useReducer, useRef, useState } from "react";
import { animated, useSprings, AnimationProps } from 'react-spring'
import { createGrid, updatePoints } from "./PolygonAnimationData";

export default function PolygonAnimation() {

    return (
        <Box sx={{
            width: '100vw',
            height: '100vh',
            position: 'relative',
            background: 'blue',
            overflow: 'hidden',
        }}>
            <AnimationGrid />
        </Box >
    )
}

const autoProgress = false
const springAnimDuration = 600
const svgSize = 100
// const springAnimDuration = 1200

function AnimationGrid() {
    const [grid, dispatchGrid] = useReducer(updatePoints, null, createGrid)
    const mouseRef = useRef<HTMLElement>(null);
    const [svgMouse, setSvgMouse] = useState({})

    useEffect(() => {
        if (!autoProgress) return
        // Interval used as final state results in no state change
        // We still want timer to cancel in case user requests an animation restart
        const timer = setInterval(() => {
            dispatchGrid(null)
        }, springAnimDuration * 2);
        return () => clearTimeout(timer);
    }, [grid.state])

    function svgAnimatedProps(index: number): SvgAnimatedProps {
        // Point animation
        const point = grid.points[index]
        const p = point.draw ?? point.orig
        return {
            cx: p.x,
            cy: p.y,
            // fillOpacity: lineStateOpacity(point.lineState),
        }
    }

    // https://react-spring.io/common/props
    function springContents(index: number): SvgAnimatedProps & AnimationProps {
        return {
            ...svgAnimatedProps(index),
            // delay: 500,
            config: { duration: springAnimDuration * 4 }
        }
    }

    const springCount = grid.points.length // + grid.paths.length

    const [springs, api] = useSprings<SvgAnimatedProps>(springCount, springContents, [grid])

    const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
        // 👇 Get mouse position relative to element
        const target = mouseRef.current
        if (!target) return

        const localX = (event.clientX - target.offsetLeft) / target.offsetWidth * svgSize
        const localY = (event.clientY - target.offsetTop) / target.offsetHeight * svgSize

        setSvgMouse({ x: localX, y: localY });
    };
    
    return (
        <Box ref={mouseRef} sx={{
            height: '100vmax',
            width: '100vmax',
            position: 'absolute',
            left: '50%',
            top: '50%',
            margin: '-50vmax 0 0 -50vmax',
        }} onMouseMove={handleMouseMove}>
            <animated.svg height="100%" width="100%" className="svg-grid" viewBox={`0 0 ${svgSize} ${svgSize}`}>
                <path d={`M0 0 L${svgSize} ${svgSize} M0 ${svgSize} L${svgSize} 0`} stroke="green" opacity={0.2} />
                {
                    springs.map((styles, i) => <animated.circle key={i} {...styles} r={0.2} fill="red" />)
                }
            </animated.svg>
        </Box>
    )
}

/**
 * Animated elements for point
 */
type PointAnimatedProps = {
    cx: number
    cy: number
    // fillOpacity: number
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