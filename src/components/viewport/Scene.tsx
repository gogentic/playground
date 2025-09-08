import { useFrame } from '@react-three/fiber';
import { useState, useEffect, Suspense } from 'react';
import { Vector3 } from 'three';
import { useEngineStore } from '../../stores/useEngineStore';
import { ParticleRenderer } from './ParticleRenderer';
import { ConstraintRenderer } from './ConstraintRenderer';
import { CompositeBoundingBox } from './CompositeBoundingBox';
import { TransformGizmo } from './TransformGizmo';
import { Ground } from './Ground';
import { Particle } from '../../core/primitives/Particle';
import { Constraint } from '../../core/primitives/Constraint';

export function Scene() {
  const engine = useEngineStore((state) => state.engine);
  const isPlaying = useEngineStore((state) => state.isPlaying);
  const isEditMode = useEngineStore((state) => state.isEditMode);
  const isDragging = useEngineStore((state) => state.isDragging);
  const composites = useEngineStore((state) => state.composites);
  const showBoundingBoxes = useEngineStore((state) => state.showBoundingBoxes);
  const dynamicsSystem = useEngineStore((state) => state.dynamicsSystem);
  const selectedParticleId = useEngineStore((state) => state.selectedParticleId);
  const selectedParticleIds = useEngineStore((state) => state.selectedParticleIds);
  const transformMode = useEngineStore((state) => state.transformMode);
  
  // Global visual settings
  const showParticles = useEngineStore((state) => state.showParticles);
  const showTransformGizmo = useEngineStore((state) => state.showTransformGizmo);
  const showFog = useEngineStore((state) => state.showFog);
  const fogDensity = useEngineStore((state) => state.fogDensity);
  const fogColor = useEngineStore((state) => state.fogColor);
  const showSceneLight = useEngineStore((state) => state.showSceneLight);
  
  // State to force re-renders when particles/constraints change
  const [particles, setParticles] = useState<Particle[]>([]);
  const [constraints, setConstraints] = useState<Constraint[]>([]);

  // Global cursor management for edit mode
  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'grabbing';
    } else if (isEditMode) {
      document.body.style.cursor = 'default';
    } else {
      document.body.style.cursor = 'default';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.cursor = 'default';
    };
  }, [isEditMode, isDragging]);

  // Update particles and constraints list on every frame
  useFrame((state, delta) => {
    if (isPlaying) {
      // Limit delta to prevent instability with large time steps
      const clampedDelta = Math.min(delta, 0.033); // Cap at ~30 FPS
      
      // Apply dynamics before physics update
      const currentParticles = engine.getParticles();
      dynamicsSystem.applyDynamics(currentParticles, clampedDelta);
      
      engine.update(clampedDelta);
    }
    
    // Always update the lists (even when paused) to show new particles immediately
    const currentParticles = engine.getParticles();
    const currentConstraints = engine.getConstraints();
    
    // Only update state if the arrays have changed length (performance optimization)
    if (currentParticles.length !== particles.length) {
      setParticles([...currentParticles]);
    }
    if (currentConstraints.length !== constraints.length) {
      setConstraints([...currentConstraints]);
    }
  });

  // Removed verbose debug logging to prevent performance issues

  // Calculate center position for multi-selected particles or single selected particle
  // This will update every frame to follow the particles
  const [gizmoPosition, setGizmoPosition] = useState<Vector3 | null>(null);
  
  // Update gizmo position every frame to follow selected particles
  useFrame(() => {
    const selectedIds = new Set<string>();
    
    // Collect all selected particle IDs
    if (selectedParticleIds.size > 0) {
      selectedParticleIds.forEach(id => selectedIds.add(id));
    } else if (selectedParticleId) {
      selectedIds.add(selectedParticleId);
    }
    
    if (selectedIds.size === 0) {
      setGizmoPosition(null);
      return;
    }
    
    // Calculate center position of all selected particles
    let centerX = 0, centerY = 0, centerZ = 0;
    let count = 0;
    
    const currentParticles = engine.getParticles();
    selectedIds.forEach(id => {
      const particle = currentParticles.find(p => p.id === id);
      if (particle) {
        centerX += particle.position.x;
        centerY += particle.position.y;
        centerZ += particle.position.z;
        count++;
      }
    });
    
    if (count > 0) {
      setGizmoPosition(new Vector3(centerX / count, centerY / count, centerZ / count));
    } else {
      setGizmoPosition(null);
    }
  });

  return (
    <>
      {/* Scene lighting */}
      {showSceneLight && (
        <>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
        </>
      )}
      
      {/* Fog effect */}
      {showFog && <fog attach="fog" args={[fogColor, 5, 100 / fogDensity]} />}
      
      <Ground />
      
      {/* Render particles only if visible */}
      {showParticles && particles.map((particle) => (
        <ParticleRenderer key={particle.id} particle={particle} />
      ))}
      
      {constraints.map((constraint) => (
        <ConstraintRenderer key={constraint.id} constraint={constraint} />
      ))}
      
      {/* Render transform gizmo for selected particles */}
      {showTransformGizmo && transformMode && gizmoPosition && (
        <TransformGizmo position={gizmoPosition} />
      )}
      
      {/* Render bounding boxes for all composites */}
      {showBoundingBoxes && composites && composites.size > 0 && (
        <Suspense fallback={null}>
          {Array.from(composites.values()).map((composite) => (
            <CompositeBoundingBox key={composite.id} composite={composite} />
          ))}
        </Suspense>
      )}
    </>
  );
}
