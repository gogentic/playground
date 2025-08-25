import { useRef, useMemo, useState } from 'react';
import { Box3, Vector3, BoxGeometry } from 'three';
import { useFrame } from '@react-three/fiber';
import { useEngineStore } from '../../stores/useEngineStore';
import { Composite } from '../../core/primitives/Composite';

interface CompositeBoundingBoxProps {
  composite: Composite;
}

export function CompositeBoundingBox({ composite }: CompositeBoundingBoxProps) {
  const selectComposite = useEngineStore((state) => state.selectComposite);
  const selectedCompositeId = useEngineStore((state) => state.selectedCompositeId);
  const [hovered, setHovered] = useState(false);
  
  const isSelected = selectedCompositeId === composite.id;
  
  // Recalculate bounding box every frame to track particle movements
  const [bounds, setBounds] = useState({ center: new Vector3(0, 0, 0), size: new Vector3(1, 1, 1) });
  
  useFrame(() => {
    try {
      if (!composite || !composite.getParticles) {
        return;
      }
      
      const particles = composite.getParticles();
      
      if (!particles || particles.length === 0) {
        return;
      }
      
      const box = new Box3();
      
      // Initialize box with first particle
      const firstParticle = particles[0];
      if (!firstParticle || !firstParticle.position) {
        return;
      }
      
      const firstPos = new Vector3(
        firstParticle.position.x,
        firstParticle.position.y,
        firstParticle.position.z
      );
      box.setFromCenterAndSize(
        firstPos,
        new Vector3(
          firstParticle.radius * 2,
          firstParticle.radius * 2,
          firstParticle.radius * 2
        )
      );
      
      // Expand box to include all particles
      particles.slice(1).forEach(particle => {
        if (particle && particle.position) {
          const particleBox = new Box3();
          const pos = new Vector3(
            particle.position.x,
            particle.position.y,
            particle.position.z
          );
          particleBox.setFromCenterAndSize(
            pos,
            new Vector3(
              particle.radius * 2,
              particle.radius * 2,
              particle.radius * 2
            )
          );
          box.union(particleBox);
        }
      });
      
      const center = new Vector3();
      const size = new Vector3();
      box.getCenter(center);
      box.getSize(size);
      
      // Add some padding to the bounding box
      size.multiplyScalar(1.1);
      
      // Ensure minimum size
      size.x = Math.max(size.x, 0.1);
      size.y = Math.max(size.y, 0.1);
      size.z = Math.max(size.z, 0.1);
      
      setBounds({ center, size });
    } catch (error) {
      console.error('[CompositeBoundingBox] Error in useFrame:', error);
    }
  });
  
  const handleClick = (e: any) => {
    e.stopPropagation();
    console.log('Bounding box clicked for composite:', composite.id);
    console.log('Composite has particles:', composite.getParticles().length);
    console.log('Composite has constraints:', composite.getConstraints().length);
    selectComposite(composite.id);
  };
  
  const handlePointerOver = () => {
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };
  
  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'default';
  };
  
  // Don't render if composite has no particles
  try {
    if (!composite || !composite.getParticles || composite.getParticles().length === 0) {
      return null;
    }
  } catch (error) {
    console.error('[CompositeBoundingBox] Error checking particles:', error);
    return null;
  }
  
  return (
    <group position={[bounds.center.x, bounds.center.y, bounds.center.z]}>
      {/* Wireframe box for selection */}
      <lineSegments
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <edgesGeometry attach="geometry" args={[new BoxGeometry(bounds.size.x, bounds.size.y, bounds.size.z)]} />
        <lineBasicMaterial 
          attach="material"
          color={isSelected ? '#ff6b6b' : (hovered ? '#4dabf7' : '#666666')}
          transparent
          opacity={isSelected ? 1 : (hovered ? 0.8 : 0.4)}
        />
      </lineSegments>
      
      {/* Invisible box for easier clicking on edges */}
      <mesh
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        visible={false}
      >
        <boxGeometry args={[bounds.size.x, bounds.size.y, bounds.size.z]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {/* Corner indicators when selected or hovered */}
      {(isSelected || hovered) && bounds.size && (
        <>
          {[
            [-1, -1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1]
          ].map((corner, index) => (
            <mesh
              key={index}
              position={[
                corner[0] * bounds.size.x * 0.5,
                corner[1] * bounds.size.y * 0.5,
                corner[2] * bounds.size.z * 0.5
              ]}
            >
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshBasicMaterial 
                color={isSelected ? '#ff6b6b' : '#4dabf7'}
              />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

