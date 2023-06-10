import { Canvas } from '@react-three/fiber'
import { OrbitControls, PointMaterial, Points, Stats } from '@react-three/drei'
import { Box } from '@mui/material'
import { BufferGeometry, DynamicDrawUsage, AdditiveBlending, Vector3 } from 'three'
import { useMemo } from 'react';

type ParticleData = {
    velocity: Vector3
}

type PolygonThreeData = {
    particleCount: number
    particlePositions: Float32Array  // Size particleCount * 3
    particleData: ParticleData[]  // Size particleCount
    linePositions: Float32Array  // Size particleCount * particleCount * 3
}

function createPolygonData(count: number): PolygonThreeData {
    const particleCount = count * count

    const particlePositions = function () {
        const positions = []
        for (let xi = 0; xi < count; xi++) {
            for (let zi = 0; zi < count; zi++) {
                const x = 2 * (xi - count / 2);
                const z = -20;
                const y = 2 * (zi - count / 2);
                positions.push(x, y, z);
            }
        }
        return new Float32Array(positions)
    }()

    const particleData = function () {
        const data: ParticleData[] = []
        for (let i = 0; i < particleCount; i++) {
            data.push({
                velocity: new Vector3(- 1 + Math.random() * 2, -1 + Math.random() * 2, -1 + Math.random() * 2),
            });
        }
        return data
    }()

    const linePositions = new Float32Array(particleCount * particleCount * 3)

    return {
        particleCount, particlePositions, particleData, linePositions
    }
}

export default function PolygonAnimation() {

    const count = 10

    const data = useMemo(() => createPolygonData(count), [count])

    return (
        <Box component="div" sx={{
            height: "100vh",
            width: "100vw"
        }}>
            <Canvas>
                <group>
                    <ambientLight intensity={0.5} />

                    <points>
                        <pointsMaterial transparent blending={AdditiveBlending}
                            vertexColors size={3} sizeAttenuation={false} depthWrite={false} />
                        <bufferGeometry>
                            <bufferAttribute
                                attach="attributes-position"
                                array={data.particlePositions}
                                count={data.particlePositions.length / 3}
                                usage={DynamicDrawUsage}
                                itemSize={3}
                            />
                        </bufferGeometry>
                    </points>
                    <lineSegments>
                        <bufferGeometry>
                            <bufferAttribute
                                attach="attributes-position"
                                array={data.linePositions}
                                count={data.linePositions.length / 3}
                                usage={DynamicDrawUsage}
                                itemSize={3}
                            />
                        </bufferGeometry>
                        <lineBasicMaterial transparent vertexColors blending={AdditiveBlending} />
                    </lineSegments>
                    <OrbitControls />
                    <Stats showPanel={0} className="stats" />
                </group>
            </Canvas>
        </Box>
    )
}