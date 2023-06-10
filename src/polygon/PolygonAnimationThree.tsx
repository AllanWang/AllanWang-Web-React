import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

export default function PolygonAnimation() {
    return (
        <Canvas>
            <ambientLight intensity={0.1} />

            <mesh>
                <boxGeometry />
                <meshStandardMaterial />
            </mesh>

            <OrbitControls />
        </Canvas>
    )
}