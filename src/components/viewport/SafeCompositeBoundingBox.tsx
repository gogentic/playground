import { useRef, useMemo, useState, useEffect } from 'react';
import { Box3, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { useEngineStore } from '../../stores/useEngineStore';
import { Composite } from '../../core/primitives/Composite';

interface CompositeBoundingBoxProps {
  composite: Composite;
}

export function SafeCompositeBoundingBox({ composite }: CompositeBoundingBoxProps) {
  const selectComposite = useEngineStore((state) => state.selectComposite);
  const selectedCompositeId = useEngineStore((state) => state.selectedCompositeId);
  const [hovered, setHovered] = useState(false);
  
  const isSelected = selectedCompositeId === composite.id;
  
  // Calculate initial bounds
  const [bounds, setBounds] = useState({ center: [0, 0, 0], size: [1, 1, 1] });
  
  // Update bounds less frequently to avoid performance issues
  useEffect(() => {
    const updateBounds = () => {
      try {
        if (!composite || !composite.getParticles) return;
        
        const particles = composite.getParticles();
        if (!particles || particles.length === 0) return;
        
        const box = new Box3();
        const firstParticle = particles[0];
        if (!firstParticle || !firstParticle.position) return;
        
        const firstPos = new Vector3(
          firstParticle.position.x,
          firstParticle.position.y,
          firstParticle.position.z
        );
        box.setFromCenterAndSize(
          firstPos,
          new Vector3(firstParticle.radius * 2, firstParticle.radius * 2, firstParticle.radius * 2)
        );
        
        particles.slice(1).forEach(particle => {
          if (particle && particle.position) {
            const pos = new Vector3(particle.position.x, particle.position.y, particle.position.z);
            const particleBox = new Box3();
            particleBox.setFromCenterAndSize(
              pos,
              new Vector3(particle.radius * 2, particle.radius * 2, particle.radius * 2)
            );
            box.union(particleBox);
          }
        });
        
        const center = new Vector3();
        const size = new Vector3();
        box.getCenter(center);
        box.getSize(size);
        
        size.multiplyScalar(1.1);
        size.x = Math.max(size.x, 0.1);
        size.y = Math.max(size.y, 0.1);
        size.z = Math.max(size.z, 0.1);
        
        setBounds({ 
          center: [center.x, center.y, center.z], 
          size: [size.x, size.y, size.z] 
        });
      } catch (error) {
        console.error('[SafeCompositeBoundingBox] Error updating bounds:', error);
      }
    };
    
    // Update bounds initially
    updateBounds();
    
    // Update periodically
    const interval = setInterval(updateBounds, 100);
    return () => clearInterval(interval);
  }, [composite]);
  
  const handleClick = (e: any) => {
    e.stopPropagation();
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
  
  // Simple check for validity
  try {
    if (!composite || !composite.getParticles || composite.getParticles().length === 0) {
      return null;
    }
  } catch {
    return null;
  }
  
  const color = isSelected ? '#ff6b6b' : (hovered ? '#4dabf7' : '#666666');
  const opacity = isSelected ? 1 : (hovered ? 0.8 : 0.4);
  
  return (
    <group position={bounds.center}>
      {/* Simple box wireframe */}
      <lineSegments
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={bounds.size} />
        <lineBasicMaterial color={color} transparent opacity={opacity} />
      </lineSegments>
      
      {/* Invisible click target */}
      <mesh
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        visible={false}
      >
        <boxGeometry args={bounds.size} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}