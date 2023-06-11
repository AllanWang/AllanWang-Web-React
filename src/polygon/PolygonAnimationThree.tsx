import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PointMaterial, Stats } from '@react-three/drei'
import { Box } from '@mui/material'
import { BufferGeometry, DynamicDrawUsage, AdditiveBlending, Vector3, NormalBufferAttributes, Points, LineSegments } from 'three'
import { useMemo, useRef, useLayoutEffect } from 'react';
import { useSprings } from 'react-spring';

type ParticleData = {
    velocity: Vector3
}

type PolygonThreeInitData = {
    cameraPos: Vector3
    particleCount: number
    velocityFactor: number
    minDistanceForLine: number
    maxX: number
    maxY: number
    maxZ: number
}

type PolygonThreeData = {
    particleCount: number
    particlePositions: Float32Array  // Size particleCount * 3
    particleData: ParticleData[]  // Size particleCount
    linePositions: Float32Array  // Size particleCount * particleCount * 3
    lineColors: Float32Array  // Size particleCount * particleCount * 3
    maxX: number
    maxY: number
    maxZ: number
    minDistanceForLine: number
}

function createPolygonData(data: PolygonThreeInitData): PolygonThreeData {
    const { particleCount, maxX, maxY, maxZ, velocityFactor, minDistanceForLine } = data

    const maxX2 = maxX * 2
    const maxY2 = maxY * 2
    const maxZ2 = maxZ * 2

    const particlePositions = new Float32Array(particleCount * 3)
    const particleData: ParticleData[] = []

    for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * maxX2 - maxX;
        const y = Math.random() * maxY2 - maxY;
        const z = Math.random() * maxZ2 - maxZ;

        particlePositions[i * 3] = x
        particlePositions[i * 3 + 1] = y
        particlePositions[i * 3 + 2] = z

        particleData.push({
            velocity: new Vector3(- 1 + Math.random() * 2, -1 + Math.random() * 2, 0).multiplyScalar(velocityFactor),
        });

    }

    const linePositions = new Float32Array(particleCount * particleCount * 3)
    const lineColors = new Float32Array(particleCount * particleCount * 3)

    return {
        particleCount, particlePositions, particleData, linePositions, lineColors, maxX, maxY, maxZ, minDistanceForLine
    }
}

const initData: PolygonThreeInitData = {
    cameraPos: new Vector3(0, 0, -30),
    particleCount: 200,
    velocityFactor: 2,
    minDistanceForLine: 10,
    maxX: 30,
    maxY: 30,
    maxZ: 10,
}

function MovingPolygon(props: PolygonThreeInitData) {
    const { particleCount, particleData, particlePositions, linePositions, lineColors, maxX, maxY, maxZ, minDistanceForLine } = useMemo(() => createPolygonData(initData), [initData])
    const pointsRef = useRef<Points<BufferGeometry<NormalBufferAttributes>>>(null)
    const linesRef = useRef<LineSegments<BufferGeometry<NormalBufferAttributes>>>(null)

    useLayoutEffect(() => {
        pointsRef.current!.visible = false
    }, [pointsRef])

    let vertexPos, colorPos, numConnected = 0

    const [springs, api] = useSprings(particlePositions.length, (i) => ({ x: particlePositions[i] }), [initData])

    useFrame((_, delta) => {
        vertexPos = 0
        colorPos = 0
        numConnected = 0

        for (let i = 0; i < particleCount; i++) {
            const particle = particleData[i]
            particlePositions[i * 3] += particle.velocity.x * delta
            particlePositions[i * 3 + 1] += particle.velocity.y * delta
            particlePositions[i * 3 + 2] += particle.velocity.z * delta

            // springs.forEach(({x}, i) => {
            //     // particlePositions[i] = 
            // })

            if (Math.abs(particlePositions[i * 3]) > maxX)
                particle.velocity.x = -particle.velocity.x;
            if (Math.abs(particlePositions[i * 3 + 1]) > maxY)
                particle.velocity.y = -particle.velocity.y;
            if (Math.abs(particlePositions[i * 3 + 2]) > maxZ)
                particle.velocity.z = -particle.velocity.z;

            for (let j = i + 1; j < particleCount; j++) {
                const otherParticle = particleData[j]
                const dx = particlePositions[i * 3] - particlePositions[j * 3]
                const dy = particlePositions[i * 3 + 1] - particlePositions[j * 3 + 1]
                const dz = particlePositions[i * 3 + 2] - particlePositions[j * 3 + 2]
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

                if (dist < minDistanceForLine) {
                    const alpha = (1.0 - dist / minDistanceForLine) * 0.5 + 0.5

                    linePositions[vertexPos++] = particlePositions[i * 3]
                    linePositions[vertexPos++] = particlePositions[i * 3 + 1]
                    linePositions[vertexPos++] = particlePositions[i * 3 + 2]
                    linePositions[vertexPos++] = particlePositions[j * 3]
                    linePositions[vertexPos++] = particlePositions[j * 3 + 1]
                    linePositions[vertexPos++] = particlePositions[j * 3 + 2]

                    lineColors[colorPos++] = alpha;
                    lineColors[colorPos++] = alpha;
                    lineColors[colorPos++] = alpha;

                    lineColors[colorPos++] = alpha;
                    lineColors[colorPos++] = alpha;
                    lineColors[colorPos++] = alpha;

                    numConnected++
                }
            }
        }

        pointsRef.current!.geometry.attributes.position.needsUpdate = true
        linesRef.current!.geometry.setDrawRange(0, numConnected * 2)
        linesRef.current!.geometry.attributes.position.needsUpdate = true
        linesRef.current!.geometry.attributes.color.needsUpdate = true
    })
    return (
        <group>
            <points ref={pointsRef}>
                <pointsMaterial transparent blending={AdditiveBlending}
                    vertexColors size={3} sizeAttenuation={false} depthWrite={false} />
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        array={particlePositions}
                        count={particlePositions.length / 3}
                        usage={DynamicDrawUsage}
                        itemSize={3}
                    />
                </bufferGeometry>
            </points>
            <lineSegments ref={linesRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        array={linePositions}
                        count={linePositions.length / 3}
                        usage={DynamicDrawUsage}
                        itemSize={3}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        array={lineColors}
                        count={lineColors.length / 3}
                        usage={DynamicDrawUsage}
                        itemSize={3}
                    />
                </bufferGeometry>
                <lineBasicMaterial transparent vertexColors blending={AdditiveBlending} />
            </lineSegments>
        </group>
    )
}

export default function PolygonAnimation() {

    return (
        <Box component="div" sx={{
            height: "100vh",
            width: "100vw"
        }}>
            <Canvas camera={{ position: initData.cameraPos }}>
                {/* <ambientLight intensity={0.5} /> */}
                <MovingPolygon {...initData} />
                <OrbitControls />
                <Stats showPanel={0} className="stats" />
            </Canvas>
        </Box>
    )
}