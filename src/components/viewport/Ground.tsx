import { useMemo, useRef, useEffect } from 'react';
import { PlaneGeometry, MeshStandardMaterial } from 'three';
import { useEngineStore } from '../../stores/useEngineStore';

export function Ground() {
  const showGround = useEngineStore((state) => state.showGround);
  const engine = useEngineStore((state) => state.engine);
  const clearSelection = useEngineStore((state) => state.clearSelection);
  const isDragging = useEngineStore((state) => state.isDragging);
  
  const groundLevel = engine.getGroundLevel();
  const justStoppedDragging = useRef(false);
  
  // Track when dragging stops
  useEffect(() => {
    if (!isDragging && justStoppedDragging.current === false) {
      // Dragging just stopped
      justStoppedDragging.current = true;
      // Reset flag after a short delay
      const timeout = setTimeout(() => {
        justStoppedDragging.current = false;
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [isDragging]);
  
  // Create a large plane for the ground
  const geometry = useMemo(() => new PlaneGeometry(200, 200), []);
  const material = useMemo(() => new MeshStandardMaterial({
    color: '#2a4d3a',
    roughness: 0.9,
    metalness: 0.0,
    transparent: true,
    opacity: 0.7,
  }), []);

  if (!showGround) {
    return null;
  }

  const handleClick = (e: any) => {
    e.stopPropagation();
    // Don't clear selection if we're currently dragging or just finished dragging
    if (!isDragging && !justStoppedDragging.current) {
      clearSelection();
    }
  };

  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, groundLevel, 0]}
      receiveShadow
      onClick={handleClick}
    />
  );
}
