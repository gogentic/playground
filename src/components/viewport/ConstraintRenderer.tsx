import { useRef, useMemo, useState, useEffect } from 'react';
import { BufferGeometry, LineBasicMaterial, Line, BufferAttribute, CylinderGeometry, MeshBasicMaterial, Mesh, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { Constraint } from '../../core/primitives/Constraint';
import { useEngineStore } from '../../stores/useEngineStore';

interface ConstraintRendererProps {
  constraint: Constraint;
}

export function ConstraintRenderer({ constraint }: ConstraintRendererProps) {
  const meshRef = useRef<Mesh>(null);
  const selectedConstraintId = useEngineStore((state) => state.selectedConstraintId);
  const selectConstraint = useEngineStore((state) => state.selectConstraint);
  
  const isSelected = selectedConstraintId === constraint.id;
  const isBroken = constraint.isBroken();
  
  // Force re-render when strokeWeight changes
  const [strokeWeight, setStrokeWeight] = useState(constraint.strokeWeight || 1);
  
  useEffect(() => {
    const checkStrokeWeight = () => {
      if (constraint.strokeWeight !== strokeWeight) {
        setStrokeWeight(constraint.strokeWeight || 1);
      }
    };
    
    // Check for changes periodically
    const interval = setInterval(checkStrokeWeight, 100);
    return () => clearInterval(interval);
  }, [constraint, strokeWeight]);
  
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
    
    return new MeshBasicMaterial({
      color,
      opacity,
      transparent: true,
    });
  }, [isSelected, isBroken, constraint]);

  // Create geometry that updates with strokeWeight
  const radius = strokeWeight * 0.02; // Increased scale for better visibility
  const geometry = useMemo(() => {
    return new CylinderGeometry(radius, radius, 1, 8); // More segments for smoother appearance
  }, [radius]);

  useFrame(() => {
    if (meshRef.current) {
      // Get particle positions
      const posA = constraint.particleA.position;
      const posB = constraint.particleB.position;
      
      // Calculate midpoint
      const midpoint = new Vector3(
        (posA.x + posB.x) / 2,
        (posA.y + posB.y) / 2,
        (posA.z + posB.z) / 2
      );
      
      // Set position
      meshRef.current.position.set(midpoint.x, midpoint.y, midpoint.z);
      
      // Calculate direction and distance
      const direction = new Vector3(
        posB.x - posA.x,
        posB.y - posA.y,
        posB.z - posA.z
      );
      const distance = direction.length();
      
      // Scale to match distance
      meshRef.current.scale.set(1, distance, 1);
      
      // Rotate to align with constraint direction
      if (distance > 0) {
        direction.normalize();
        const up = new Vector3(0, 1, 0);
        
        // Calculate rotation axis and angle
        const axis = new Vector3().crossVectors(up, direction);
        const angle = Math.acos(Math.min(1, Math.max(-1, up.dot(direction))));
        
        // Apply rotation
        meshRef.current.rotation.set(0, 0, 0);
        if (axis.length() > 0.001) {
          axis.normalize();
          meshRef.current.rotateOnAxis(axis, angle);
        } else if (up.dot(direction) < 0) {
          // Handle the case where the constraint points straight down
          meshRef.current.rotateOnAxis(new Vector3(1, 0, 0), Math.PI);
        }
      }
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
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    />
  );
}