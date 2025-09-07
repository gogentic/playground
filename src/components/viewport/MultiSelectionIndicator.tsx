import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { Vector3 } from 'three';
import { useEngineStore } from '../../stores/useEngineStore';

export function MultiSelectionIndicator() {
  const selectedParticleIds = useEngineStore((state) => state.selectedParticleIds);
  const engine = useEngineStore((state) => state.engine);
  
  // Calculate convex hull or bounding box of selected particles
  const points = useMemo(() => {
    if (selectedParticleIds.size <= 1) return [];
    
    const particles = engine.getParticles();
    const selectedParticles = particles.filter(p => selectedParticleIds.has(p.id));
    
    if (selectedParticles.length <= 1) return [];
    
    // Calculate center
    let centerX = 0, centerY = 0, centerZ = 0;
    selectedParticles.forEach(p => {
      centerX += p.position.x;
      centerY += p.position.y;
      centerZ += p.position.z;
    });
    centerX /= selectedParticles.length;
    centerY /= selectedParticles.length;
    centerZ /= selectedParticles.length;
    
    // Create a simple star pattern from center to each particle
    const linePoints: Vector3[] = [];
    selectedParticles.forEach(p => {
      linePoints.push(new Vector3(centerX, centerY, centerZ));
      linePoints.push(new Vector3(p.position.x, p.position.y, p.position.z));
    });
    
    return linePoints;
  }, [selectedParticleIds, engine]);
  
  if (points.length === 0) return null;
  
  return (
    <Line
      points={points}
      color="#ffd700"
      lineWidth={1}
      opacity={0.3}
      transparent
      dashed
      dashSize={0.5}
      gapSize={0.5}
    />
  );
}