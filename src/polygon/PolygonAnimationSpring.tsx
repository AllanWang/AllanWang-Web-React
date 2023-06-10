import { Box } from "@mui/system";
import { createRef, MouseEvent, MouseEventHandler, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { animated, useSprings, AnimationProps } from 'react-spring'
import { createGrid, drawPoint, updatePoints } from "./PolygonAnimationData";
import { useMove } from '@use-gesture/react'

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

const autoProgress = true
const springAnimDuration = 1200
const svgSize = 100
// const springAnimDuration = 1200

function AnimationGrid() {
    const [grid, dispatchGrid] = useReducer(updatePoints, null, createGrid)

    console.log(grid.state)

    const mouseRef = createRef()

    useEffect(() => {
        if (!autoProgress) return
        // Interval used as final state results in no state change
        // We still want timer to cancel in case user requests an animation restart
        const timer = setInterval(() => {
            dispatchGrid(null)
        }, springAnimDuration * 2);
        return () => clearTimeout(timer);
    }, [grid.state])

    function pointProps(index: number): PointAnimatedProps {
        // Point animation
        const point = grid.points[index]
        const dp = drawPoint(point)

        return {
            cx: dp.x,
            cy: dp.y,
            // fillOpacity: lineStateOpacity(point.lineState),
        }
    }

    function logoProps(index: number): LineAnimatedProps {
        const logoLine = grid.logoLines[index]
        return { strokeOpacity: 1 }
    }

    function springProps(index: number): SvgAnimatedProps & AnimationProps {
        if (index < grid.points.length) return pointProps(index)
        return logoProps(index - grid.points.length)
    }

    // https://react-spring.io/common/props
    function springContents(index: number): SvgAnimatedProps & AnimationProps {
        return {
            ...springProps(index),
            // delay: 500,
            config: { mass: 10, tension: 50, friction: 20 }
        }
    }

    const springCount = grid.points.length + grid.logoLines.entries.length

    const [springs, api] = useSprings<SvgAnimatedProps>(springCount, springContents, [grid])

    // useEffect(() => {
    //     if (!autoProgress) return
    //     // Interval used as final state results in no state change
    //     // We still want timer to cancel in case user requests an animation restart
    //     const timer = setInterval(() => {
    //         // api.start((_, values) => ({
    //         //     cx: 2,
    //         //     cy: 2,
    //         //     config: { mass: 500, tension: 50, friction: 20 }
    //         // }));
    //     });
    //     return () => clearTimeout(timer);
    // }, [grid.state])

    const bind = useMove(({ active, xy }) => {
        const target = mouseRef.current as HTMLElement
        if (!target) return
        const [x, y] = xy

        // console.log(y, target.clientTop, target.offsetTop, target.scrollTop)

        // console.log({
        //     x: (x - target.clientLeft) / target.offsetWidth, y: (y - target.clientTop) / target.offsetHeight
        // })
    });

    return (
        <Box sx={{
            height: '100vmax',
            width: '100vmax',
            position: 'absolute',
            left: '50%',
            top: '50%',
            margin: '-50vmax 0 0 -50vmax',
        }} ref={mouseRef} {...bind()}>
            <animated.svg height="100%" width="100%" className="svg-grid" viewBox={`0 0 ${svgSize} ${svgSize}`}>
                <path d={`M0 0 L${svgSize} ${svgSize} M0 ${svgSize} L${svgSize} 0`} stroke="green" opacity={0.2} />
                {
                    springs.map((styles, i) => <animated.circle key={i} {...styles} r={0.2} fill="red" />)
                }
            </animated.svg>
        </Box>
    )
}