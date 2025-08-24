import { useRef, useMemo } from 'react';
import { BufferGeometry, LineBasicMaterial, Line, BufferAttribute } from 'three';
import { useFrame } from '@react-three/fiber';
import { Constraint } from '../../core/primitives/Constraint';
import { useEngineStore } from '../../stores/useEngineStore';

interface ConstraintRendererProps {
  constraint: Constraint;
}

export function ConstraintRenderer({ constraint }: ConstraintRendererProps) {
  const lineRef = useRef<Line>(null);
  const selectedConstraintId = useEngineStore((state) => state.selectedConstraintId);
  const selectConstraint = useEngineStore((state) => state.selectConstraint);
  
  const isSelected = selectedConstraintId === constraint.id;
  const isBroken = constraint.isBroken();
  
  // Create geometry with two points
  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    const positions = new Float32Array(6); // 2 vertices * 3 components
    geo.setAttribute('position', new BufferAttribute(positions, 3));
    return geo;
  }, []);
  
  // Material changes based on state
  const material = useMemo(() => {
    let color = '#4dabf7'; // Default blue
    let opacity = 0.8;
    
    if (isBroken) {
      color = '#868e96';
      opacity = 0.3;
    } else {
      // Color based on stress
      const stress = constraint.getStressRatio();
      if (stress > 1.5) {
        color = '#ff6b6b'; // Red for high stress
      } else if (stress > 1.2) {
        color = '#ffd43b'; // Yellow for medium stress
      } else if (stress < 0.8) {
        color = '#51cf66'; // Green for compression
      }
    }
    
    if (isSelected) {
      color = '#ff6b6b';
      opacity = 1;
    }
    
    return new LineBasicMaterial({
      color,
      opacity,
      transparent: true,
      linewidth: isSelected ? 3 : 1,
    });
  }, [isSelected, isBroken, constraint]);

  useFrame(() => {
    if (lineRef.current && geometry.attributes.position) {
      const positions = geometry.attributes.position.array as Float32Array;
      
      // Update line endpoints
      positions[0] = constraint.particleA.position.x;
      positions[1] = constraint.particleA.position.y;
      positions[2] = constraint.particleA.position.z;
      positions[3] = constraint.particleB.position.x;
      positions[4] = constraint.particleB.position.y;
      positions[5] = constraint.particleB.position.z;
      
      geometry.attributes.position.needsUpdate = true;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectConstraint(constraint.id);
  };

  const handlePointerOver = () => {
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'default';
  };

  if (isBroken && !isSelected) {
    return null; // Don't render broken constraints unless selected
  }

  return (
    <line
      ref={lineRef}
      geometry={geometry}
      material={material}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    />
  );
}
