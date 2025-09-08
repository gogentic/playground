import { Canvas } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, PerspectiveCamera, Grid } from '@react-three/drei';
import { Scene } from './Scene';
import { useEngineStore } from '../../stores/useEngineStore';
import { ErrorBoundary } from '../ErrorBoundary';
import { useEffect, useRef, useMemo } from 'react';
import { Vector3 } from 'three';
import type { CameraView } from './ViewportLayout';

interface ViewportProps {
  viewportId?: number;
  cameraView?: CameraView;
  isActive?: boolean;
}

// Camera position presets for different views
const CAMERA_PRESETS: Record<CameraView, { position: [number, number, number]; target?: [number, number, number] }> = {
  perspective: { position: [20, 15, 20] },
  front: { position: [0, 0, 30], target: [0, 0, 0] },
  back: { position: [0, 0, -30], target: [0, 0, 0] },
  left: { position: [-30, 0, 0], target: [0, 0, 0] },
  right: { position: [30, 0, 0], target: [0, 0, 0] },
  top: { position: [0, 30, 0], target: [0, 0, 0] },
  bottom: { position: [0, -30, 0], target: [0, 0, 0] }
};

export function Viewport({ viewportId = 0, cameraView = 'perspective', isActive = true }: ViewportProps) {
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
  
  // Determine if this is an orthographic view
  const isOrthographic = cameraView !== 'perspective';
  const cameraPreset = CAMERA_PRESETS[cameraView];
  
  // Calculate orthographic camera parameters
  const orthographicScale = 20;
  
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
        shadows
        onCreated={({ gl, camera }) => {
          gl.shadowMap.enabled = true;
          // Set initial camera position based on preset
          if (cameraPreset) {
            camera.position.set(...cameraPreset.position);
            if (cameraPreset.target && controlsRef.current) {
              controlsRef.current.target.set(...cameraPreset.target);
            }
          }
        }}
        onPointerMissed={() => {
          // Clear selection when clicking on empty space
          if (!isDragging && isActive) {
            clearSelection();
          }
        }}
      >
        {/* Camera setup based on view type */}
        {isOrthographic ? (
          <OrthographicCamera
            makeDefault
            position={cameraPreset.position}
            zoom={40}
            near={0.1}
            far={1000}
          />
        ) : (
          <PerspectiveCamera
            makeDefault
            position={cameraPreset.position}
            fov={60}
            near={0.1}
            far={1000}
          />
        )}
        
        <color attach="background" args={[backgroundColor]} />
        
        <OrbitControls
          ref={controlsRef}
          enablePan={!isDragging && isActive}
          enableZoom={!isDragging && isActive}
          enableRotate={!isDragging && isActive && cameraView === 'perspective'}
          zoomSpeed={0.5}
          panSpeed={0.5}
          rotateSpeed={0.5}
          target={cameraPreset.target ? new Vector3(...cameraPreset.target) : new Vector3(0, 0, 0)}
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
