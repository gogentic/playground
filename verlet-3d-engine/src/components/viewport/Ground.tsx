import { useMemo } from 'react';
import { PlaneGeometry, MeshStandardMaterial } from 'three';
import { useEngineStore } from '../../stores/useEngineStore';

export function Ground() {
  const showGround = useEngineStore((state) => state.showGround);
  const engine = useEngineStore((state) => state.engine);
  
  const groundLevel = engine.getGroundLevel();
  
  // Create a large plane for the ground
  const geometry = useMemo(() => new PlaneGeometry(200, 200), []);
  const material = useMemo(() => new MeshStandardMaterial({
    color: '#2a4d3a',
    roughness: 0.9,
    metalness: 0.0,
    transparent: true,
    opacity: 0.7,
  }), []);

  if (!showGround) {
    return null;
  }

  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, groundLevel, 0]}
      receiveShadow
    />
  );
}
