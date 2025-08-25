import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Mesh, SphereGeometry, MeshStandardMaterial, Vector3 as ThreeVector3, Raycaster, Plane, Vector2 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Particle } from '../../core/primitives/Particle';
import { useEngineStore } from '../../stores/useEngineStore';

interface ParticleRendererProps {
  particle: Particle;
}

export function ParticleRenderer({ particle }: ParticleRendererProps) {
  const meshRef = useRef<Mesh>(null);
  const { camera, gl } = useThree();
  
  // Engine store state
  const selectedParticleId = useEngineStore((state) => state.selectedParticleId);
  const selectedCompositeId = useEngineStore((state) => state.selectedCompositeId);
  const selectParticle = useEngineStore((state) => state.selectParticle);
  const selectComposite = useEngineStore((state) => state.selectComposite);
  
  const getCompositeByParticleId = useEngineStore((state) => state.getCompositeByParticleId);
  const isCreatingConstraint = useEngineStore((state) => state.isCreatingConstraint);
  const constraintStartParticleId = useEngineStore((state) => state.constraintStartParticleId);
  const startConstraintCreation = useEngineStore((state) => state.startConstraintCreation);
  const finishConstraintCreation = useEngineStore((state) => state.finishConstraintCreation);
  const cancelConstraintCreation = useEngineStore((state) => state.cancelConstraintCreation);
  
  // Edit mode state
  const isEditMode = useEngineStore((state) => state.isEditMode);
  const isDragging = useEngineStore((state) => state.isDragging);
  const draggedParticleId = useEngineStore((state) => state.draggedParticleId);
  const startDragging = useEngineStore((state) => state.startDragging);
  const stopDragging = useEngineStore((state) => state.stopDragging);
  const updateParticlePosition = useEngineStore((state) => state.updateParticlePosition);
  const updateMultipleParticlePositions = useEngineStore((state) => state.updateMultipleParticlePositions);
  
  // Multiple selection state
  const selectedParticleIds = useEngineStore((state) => state.selectedParticleIds);
  const toggleParticleSelection = useEngineStore((state) => state.toggleParticleSelection);
  
  // Local drag state
  const [dragPlane] = useState(() => new Plane());
  const [dragOffset] = useState(() => new ThreeVector3());
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const [lastDragPosition, setLastDragPosition] = useState<ThreeVector3 | null>(null);
  
  const isSelected = selectedParticleId === particle.id;
  const isMultiSelected = selectedParticleIds.has(particle.id);
  const isConstraintStart = constraintStartParticleId === particle.id;
  const canFinishConstraint = isCreatingConstraint && constraintStartParticleId !== particle.id;
  const isBeingDragged = draggedParticleId === particle.id;
  
  // Check if particle belongs to selected composite
  const belongsToComposite = particle.metadata?.compositeId;
  const isPartOfSelectedComposite = belongsToComposite && selectedCompositeId === particle.metadata?.compositeId;
  
  // Debug: Track when this component re-renders with new selectedCompositeId
  useEffect(() => {
    if (particle.metadata?.compositeId) {
      console.log(`[Particle ${particle.id}] Re-render with selectedCompositeId:`, selectedCompositeId, 
        'My compositeId:', particle.metadata.compositeId,
        'Match:', selectedCompositeId === particle.metadata.compositeId);
    }
  }, [selectedCompositeId, particle.id, particle.metadata?.compositeId]);
  
  // Debug: Log only when composite is selected
  if (particle.metadata?.compositeId && selectedCompositeId) {
    console.log(`Particle ${particle.id} render check:`, {
      particleCompositeId: particle.metadata.compositeId,
      selectedCompositeId: selectedCompositeId,
      isPartOfSelectedComposite: isPartOfSelectedComposite,
      shouldBeHighlighted: isPartOfSelectedComposite
    });
  }
  
  // Memoize geometry and material to prevent recreating on every render
  // Use unit sphere and scale it for better performance
  const geometry = useMemo(() => new SphereGeometry(1, 16, 16), []);
  // Temporarily remove memoization to debug
  let emissiveColor = '#000000';
  let emissiveIntensity = 0;
  let metalness = 0.3;
  let roughness = 0.7;
  
  if (isBeingDragged) {
    emissiveColor = '#00ffff'; // Cyan for being dragged
    emissiveIntensity = 0.6;
    metalness = 0.1;
    roughness = 0.3;
  } else if (isConstraintStart) {
    emissiveColor = '#00ff00'; // Green for constraint start
    emissiveIntensity = 0.5;
  } else if (canFinishConstraint) {
    emissiveColor = '#ffff00'; // Yellow for potential constraint end
    emissiveIntensity = 0.3;
  } else if (isPartOfSelectedComposite) {
    emissiveColor = '#9b59b6'; // Purple for composite selection
    emissiveIntensity = 0.35;
    metalness = 0.25;
  } else if (isMultiSelected) {
    emissiveColor = '#ff9500'; // Orange for multi-selected
    emissiveIntensity = 0.4;
    metalness = 0.2;
  } else if (isSelected) {
    emissiveColor = '#ff6b6b'; // Red for selected
    emissiveIntensity = 0.3;
  } else if (isEditMode) {
    // Subtle highlight in edit mode to show particles are draggable
    emissiveColor = '#ffffff';
    emissiveIntensity = 0.1;
  }
  
  // Override color entirely when part of selected composite for debugging
  const finalColor = isPartOfSelectedComposite ? '#ff00ff' : particle.color;
  
  const material = new MeshStandardMaterial({
    color: finalColor,
    emissive: emissiveColor,
    emissiveIntensity: emissiveIntensity,
    metalness: metalness,
    roughness: roughness,
  });
  
  // Log material creation for debugging
  if (isPartOfSelectedComposite) {
    console.log(`Creating PURPLE material for particle ${particle.id}`);
  }
  

  // Drag handling functions
  const handlePointerDown = useCallback((e: any) => {
    if (!isEditMode || isCreatingConstraint) return;
    
    e.stopPropagation();
    
    // Record mouse down position
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    setHasMoved(false);
    
    // Set up drag plane perpendicular to camera view
    const cameraDirection = new ThreeVector3();
    camera.getWorldDirection(cameraDirection);
    dragPlane.setFromNormalAndCoplanarPoint(cameraDirection, new ThreeVector3(particle.position.x, particle.position.y, particle.position.z));
    
    // Calculate offset from particle center to mouse position on plane
    const rect = gl.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    const raycaster = new Raycaster();
    raycaster.setFromCamera(new Vector2(x, y), camera);
    
    const intersectPoint = new ThreeVector3();
    raycaster.ray.intersectPlane(dragPlane, intersectPoint);
    
    if (intersectPoint) {
      dragOffset.subVectors(intersectPoint, new ThreeVector3(particle.position.x, particle.position.y, particle.position.z));
    }
  }, [isEditMode, isCreatingConstraint, camera, gl, particle, dragPlane, dragOffset]);

  // Global mouse move handler for dragging
  useEffect(() => {
    if (!mouseDownPos || !isEditMode) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Check if we've moved enough to start dragging
      const moveDistance = Math.sqrt(
        Math.pow(e.clientX - mouseDownPos.x, 2) + 
        Math.pow(e.clientY - mouseDownPos.y, 2)
      );
      
      if (moveDistance > 5 && !isBeingDragged) {
        // Start dragging
        setHasMoved(true);
        startDragging(particle.id);
      }
      
      if (isBeingDragged) {
        // Calculate new position based on mouse movement
        const rect = gl.domElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        
        const raycaster = new Raycaster();
        raycaster.setFromCamera(new Vector2(x, y), camera);
        
        const intersectPoint = new ThreeVector3();
        raycaster.ray.intersectPlane(dragPlane, intersectPoint);
        
        if (intersectPoint) {
          const newPosition = intersectPoint.sub(dragOffset);
          
          // Calculate delta movement for group dragging
          if (lastDragPosition) {
            const deltaPosition = {
              x: newPosition.x - lastDragPosition.x,
              y: newPosition.y - lastDragPosition.y,
              z: newPosition.z - lastDragPosition.z
            };
            
            // Use group dragging method
            updateMultipleParticlePositions(particle.id, deltaPosition);
          } else {
            // First movement - set initial position
            updateParticlePosition(particle.id, {
              x: newPosition.x,
              y: newPosition.y,
              z: newPosition.z
            });
          }
          
          // Update last drag position for next delta calculation
          setLastDragPosition(newPosition.clone());
        }
      }
    };

    const handleGlobalMouseUp = () => {
      if (isBeingDragged) {
        stopDragging();
      }
      setMouseDownPos(null);
      setHasMoved(false);
      setLastDragPosition(null);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [mouseDownPos, isEditMode, isBeingDragged, camera, gl, particle.id, dragPlane, dragOffset, updateParticlePosition, updateMultipleParticlePositions, startDragging, stopDragging, lastDragPosition]);



  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(
        particle.position.x,
        particle.position.y,
        particle.position.z
      );
      
      // Update scale if radius changed
      const scale = particle.radius;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  const handleClick = (e: any) => {
    console.log('=== SINGLE CLICK ===', particle.id);
    
    // Don't handle clicks if we're dragging or if we moved the mouse
    if (isDragging || hasMoved) {
      return;
    }
    
    e.stopPropagation();
    
    console.log('Processing single click for particle:', particle.id);
    
    if (isCreatingConstraint) {
      if (constraintStartParticleId === particle.id) {
        // Clicking the same particle cancels constraint creation
        cancelConstraintCreation();
      } else {
        // Clicking a different particle finishes constraint creation
        finishConstraintCreation(particle.id);
      }
    } else if (isEditMode) {
      // In edit mode: Shift+click for multiple selection
      if (e.shiftKey) {
        toggleParticleSelection(particle.id);
      } else {
        // Regular click in edit mode - single selection (clear multi-selection)
        selectParticle(particle.id);
        // selectParticle already clears composite selection
      }
    } else {
      // For any particle that belongs to a composite, select the whole composite
      if (particle.metadata?.compositeId) {
        console.log('Particle belongs to composite:', particle.metadata.compositeId);
        const composite = getCompositeByParticleId(particle.id);
        console.log('Found composite:', composite);
        
        if (composite) {
          console.log('Calling selectComposite with:', composite.id);
          selectComposite(composite.id);
          selectParticle(null);
        } else {
          console.log('Composite not found in store, selecting particle instead');
          selectParticle(particle.id);
          // selectParticle already clears composite selection
        }
      } else {
        // Single click selects particle and shows property panel
        console.log('Selecting particle:', particle.id);
        selectParticle(particle.id);
        // Don't call selectComposite(null) as it will clear the particle selection!
        console.log('Called selectParticle with:', particle.id);
      }
    }
  };

  const handleDoubleClick = (e: any) => {
    console.log('=== DOUBLE CLICK ===', particle.id);
    e.stopPropagation();
    
    // Double-click now also selects the particle and shows properties
    if (!isEditMode) {
      selectParticle(particle.id);
      // selectParticle already clears composite selection
      
      // Also start constraint creation
      if (!isCreatingConstraint) {
        startConstraintCreation(particle.id);
      }
    }
  };

  const handlePointerOver = () => {
    if (isEditMode && !isCreatingConstraint) {
      document.body.style.cursor = 'grab';
    } else if (isCreatingConstraint && constraintStartParticleId !== particle.id) {
      document.body.style.cursor = 'crosshair';
    } else {
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    if (!isBeingDragged) {
      document.body.style.cursor = 'default';
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={[particle.position.x, particle.position.y, particle.position.z]}
      scale={[particle.radius, particle.radius, particle.radius]}
      geometry={geometry}
      material={material}
      castShadow
      receiveShadow
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onPointerDown={handlePointerDown}
    />
  );
}
