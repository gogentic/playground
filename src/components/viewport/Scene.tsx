import { useFrame } from '@react-three/fiber';
import { useState, useEffect, Suspense } from 'react';
import { useEngineStore } from '../../stores/useEngineStore';
import { ParticleRenderer } from './ParticleRenderer';
import { ConstraintRenderer } from './ConstraintRenderer';
import { SafeCompositeBoundingBox } from './SafeCompositeBoundingBox';
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

  return (
    <>
      <Ground />
      {particles.map((particle) => (
        <ParticleRenderer key={particle.id} particle={particle} />
      ))}
      {constraints.map((constraint) => (
        <ConstraintRenderer key={constraint.id} constraint={constraint} />
      ))}
      {/* Render bounding boxes for all composites */}
      {showBoundingBoxes && composites && composites.size > 0 && (
        <Suspense fallback={null}>
          {Array.from(composites.values()).map((composite) => (
            <SafeCompositeBoundingBox key={composite.id} composite={composite} />
          ))}
        </Suspense>
      )}
    </>
  );
}
