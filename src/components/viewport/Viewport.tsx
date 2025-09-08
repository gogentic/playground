import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { Scene } from './Scene';
import { useEngineStore } from '../../stores/useEngineStore';
import { ErrorBoundary } from '../ErrorBoundary';
import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';

export function Viewport() {
  const showGrid = useEngineStore((state) => state.showGrid);
  const isCreatingConstraint = useEngineStore((state) => state.isCreatingConstraint);
  const cancelConstraintCreation = useEngineStore((state) => state.cancelConstraintCreation);
  const isDragging = useEngineStore((state) => state.isDragging);
  const clearSelection = useEngineStore((state) => state.clearSelection);
  const selectedCompositeId = useEngineStore((state) => state.selectedCompositeId);
  const selectedParticleId = useEngineStore((state) => state.selectedParticleId);
  const selectedConstraintId = useEngineStore((state) => state.selectedConstraintId);
  const selectedParticleIds = useEngineStore((state) => state.selectedParticleIds);
  const engine = useEngineStore((state) => state.engine);
  const composites = useEngineStore((state) => state.composites);
  const selectComposite = useEngineStore((state) => state.selectComposite);
  const removeParticle = useEngineStore((state) => state.removeParticle);
  const removeConstraint = useEngineStore((state) => state.removeConstraint);
  const deleteSelectedParticles = useEngineStore((state) => state.deleteSelectedParticles);
  const transformMode = useEngineStore((state) => state.transformMode);
  const isPotentialDragTarget = useEngineStore((state) => state.isPotentialDragTarget);
  const cameraTarget = useEngineStore((state) => state.cameraTarget);
  const setCameraTarget = useEngineStore((state) => state.setCameraTarget);
  
  // Global visual settings
  const backgroundColor = useEngineStore((state) => state.backgroundColor);
  const gridColor = useEngineStore((state) => state.gridColor);
  
  const controlsRef = useRef<any>(null);


  // Handle camera target changes
  useEffect(() => {
    if (cameraTarget && controlsRef.current) {
      // Smoothly update the camera target
      controlsRef.current.target.set(
        cameraTarget.x,
        cameraTarget.y,
        cameraTarget.z
      );
      controlsRef.current.update();
      
      // Clear the camera target after applying
      setTimeout(() => setCameraTarget(null), 100);
    }
  }, [cameraTarget, setCameraTarget]);

  // Handle Escape key to clear selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Clear any selection
        if (selectedCompositeId || selectedParticleId || selectedConstraintId) {
          clearSelection();
        }
        // Also cancel constraint creation if active
        if (isCreatingConstraint) {
          cancelConstraintCreation();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCompositeId, selectedParticleId, selectedConstraintId, isCreatingConstraint, clearSelection, cancelConstraintCreation]);

  return (
    <div className="viewport">
      {/* Help text overlay */}
      {(selectedCompositeId || selectedParticleId || selectedConstraintId) && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 100,
          pointerEvents: 'none'
        }}>
          Press ESC to clear selection • Click ground to deselect
        </div>
      )}
      <Canvas
        camera={{ 
          position: [20, 15, 20], 
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        shadows
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
        }}
        onPointerMissed={() => {
          // Clear selection when clicking on empty space
          if (!isDragging) {
            clearSelection();
          }
        }}
      >
        <color attach="background" args={[backgroundColor]} />
        
        <OrbitControls
          ref={controlsRef}
          enablePan={!isDragging}
          enableZoom={!isDragging}
          enableRotate={!isDragging}
          zoomSpeed={0.5}
          panSpeed={0.5}
          rotateSpeed={0.5}
        />
        
        {showGrid && (
          <Grid
            args={[200, 200]}
            cellSize={1}
            cellThickness={0.5}
            cellColor={gridColor}
            sectionSize={10}
            sectionThickness={1}
            sectionColor={gridColor}
            fadeDistance={100}
            fadeStrength={1}
            infiniteGrid
          />
        )}
        
        <ErrorBoundary>
          <Scene />
        </ErrorBoundary>
      </Canvas>
    </div>
  );
}
