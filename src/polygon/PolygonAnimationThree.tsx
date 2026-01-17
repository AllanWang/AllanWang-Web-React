import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stats, GradientTexture } from '@react-three/drei'
import { Box } from '@mui/material'
import THREE, { BufferGeometry, DynamicDrawUsage, AdditiveBlending, Vector3, NormalBufferAttributes, Points, LineSegments, Mesh, Material, MathUtils } from 'three'
import { useMemo, useRef, useLayoutEffect } from 'react';
import { useSprings, animated, useTrail } from '@react-spring/three';
import { MeshDistortMaterial } from '../drei/MeshDistortMaterial';

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
    cameraPos: new Vector3(0, 0, 30),
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

    // useLayoutEffect(() => {
    //     const timer = setInterval(() => {
    //         api.start((i) => {
    //             if (Math.random() > 0.5) return null
    //             return { x: Math.random() * 5, config: { friction: 200 } }
    //         }
    //      )
    //     }, 1000)
    // }, [])

    useFrame((_, delta) => {
        vertexPos = 0
        colorPos = 0
        numConnected = 0

        for (let i = 0; i < particleCount; i++) {
            const particle = particleData[i]
            particlePositions[i * 3] += particle.velocity.x * delta
            particlePositions[i * 3 + 1] += particle.velocity.y * delta
            particlePositions[i * 3 + 2] += particle.velocity.z * delta

            springs.forEach((s, i) => {
                particlePositions[i] = s.x.get()
            })

            // if (Math.abs(particlePositions[i * 3]) > maxX)
            //     particle.velocity.x = -particle.velocity.x;
            // if (Math.abs(particlePositions[i * 3 + 1]) > maxY)
            //     particle.velocity.y = -particle.velocity.y;
            // if (Math.abs(particlePositions[i * 3 + 2]) > maxZ)
            //     particle.velocity.z = -particle.velocity.z;

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

const points = new Float32Array([-15, 15, 0, 0, 15, 15, -13.5, 15, 0, 0, 0, 0])

function MovingPlane() {

    const sideSize = 100
    const sideCount = 20

    const meshRef = useRef<Mesh<BufferGeometry<NormalBufferAttributes>>>(null)
    const distortRef = useRef(null)

    // const [trails, api] = useTrail(
    //     sideSize * sideSize,
    //     () => ({
    //         value: 0
    //     }),
    //     []
    // )

    useLayoutEffect(() => {
        const positions = meshRef.current!.geometry.attributes.position

        let pos = 0

        let offset = (positions.getX(1) - positions.getX(0)) / 2

        for (let i = 0; i <= sideCount; i++) {
            for (let j = 0; j <= sideCount; j++) {
                pos = i * (sideCount + 1) + j
                positions.setX(pos, positions.getX(pos) + i * offset - 30 / 4)
            }
        }

        // positions.setX(0, -20)
        // positions.setX(1, -20)
        // positions.setX(2, -20)
        // positions.setX(3, -20)

        positions.needsUpdate = true

        // setInterval(() => {
        // api.start({ value: Math.random() * -10 })
        // }, 1000)
    }, [meshRef])

    let pos = 0

    // useFrame(() => {
    //     const positions = meshRef.current!.geometry.attributes.position

    //     for (let i = 0; i <= sideCount; i++) {
    //         for (let j = 0; j <= sideCount; j++) {
    //             pos = i * (sideCount + 1) + j
    //             positions.setZ(pos, trails[i + j].value.get())
    //         }
    //     }

    //     positions.needsUpdate = true
    // })

    const hovered = true

    useFrame(() => {
        const target = distortRef.current as any
        target.distort = MathUtils.lerp(target.distort, hovered ? 0.2 : 0, hovered ? 0.05 : 0.01)
    })

    return (
        <group>
            <mesh ref={meshRef}>
                <planeGeometry args={[sideSize, sideSize, sideCount, sideCount]}>
                    {/* <bufferAttribute
                        attach="attributes-position"
                        array={points}
                        count={points.length / 3}
                        usage={DynamicDrawUsage}
                        itemSize={3}
                    /> */}
                </planeGeometry>

                <MeshDistortMaterial
                    wireframe
                    speed={1}
                    distort={0.2}
                    ref={distortRef}
                    color={"green"}
                >
                    {/* <GradientTexture stops={[0, 0.8, 1]} colors={['#e63946', '#f1faee', '#a8dadc']} size={100} /> */}
                </MeshDistortMaterial>
                {/* <meshBasicMaterial wireframe color="green" /> */}
            </mesh>
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
                <ambientLight intensity={0.5} />
                <MovingPlane />
                {/* <MovingPolygon {...initData} /> */}
                <OrbitControls />
                <Stats showPanel={0} className="stats" />
            </Canvas>
        </Box>
    )
}