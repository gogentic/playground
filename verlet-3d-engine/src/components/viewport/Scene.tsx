import { useFrame } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import { useEngineStore } from '../../stores/useEngineStore';
import { ParticleRenderer } from './ParticleRenderer';
import { ConstraintRenderer } from './ConstraintRenderer';
import { Ground } from './Ground';
import { Particle } from '../../core/primitives/Particle';
import { Constraint } from '../../core/primitives/Constraint';

export function Scene() {
  const engine = useEngineStore((state) => state.engine);
  const isPlaying = useEngineStore((state) => state.isPlaying);
  const isEditMode = useEngineStore((state) => state.isEditMode);
  const isDragging = useEngineStore((state) => state.isDragging);
  const lastTimeRef = useRef(0);
  
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

  return (
    <>
      <Ground />
      {particles.map((particle) => (
        <ParticleRenderer key={particle.id} particle={particle} />
      ))}
      {constraints.map((constraint) => (
        <ConstraintRenderer key={constraint.id} constraint={constraint} />
      ))}
    </>
  );
}
