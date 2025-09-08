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
  
  // Global visual settings
  const particleRadiusMultiplier = useEngineStore((state) => state.particleRadiusMultiplier);
  
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
  
  // Transform mode
  const transformMode = useEngineStore((state) => state.transformMode);
  const updateParticleProperties = useEngineStore((state) => state.updateParticleProperties);
  
  // Local drag state
  const [dragPlane] = useState(() => new Plane());
  const [dragOffset] = useState(() => new ThreeVector3());
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const [lastDragPosition, setLastDragPosition] = useState<ThreeVector3 | null>(null);
  const [initialMousePos, setInitialMousePos] = useState<Vector2 | null>(null);
  const [initialRadius, setInitialRadius] = useState<number>(particle.radius);
  const [transformCenter, setTransformCenter] = useState<ThreeVector3 | null>(null);
  const [initialPositions, setInitialPositions] = useState<Map<string, ThreeVector3> | null>(null);
  const [initialRadii, setInitialRadii] = useState<Map<string, number> | null>(null);
  
  const isSelected = selectedParticleId === particle.id;
  const isMultiSelected = selectedParticleIds.has(particle.id);
  const isConstraintStart = constraintStartParticleId === particle.id;
  const canFinishConstraint = isCreatingConstraint && constraintStartParticleId !== particle.id;
  const isBeingDragged = draggedParticleId === particle.id;
  
  // Check if particle belongs to selected composite
  const belongsToComposite = particle.metadata?.compositeId;
  const isPartOfSelectedComposite = belongsToComposite && selectedCompositeId === particle.metadata?.compositeId;
  
  
  // Memoize geometry and material to prevent recreating on every render
  // Use unit sphere and scale it for better performance
  const geometry = useMemo(() => new SphereGeometry(1, 16, 16), []);
  
  // Create material with proper memoization including color dependency
  const material = useMemo(() => {
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
    
    const mat = new MeshStandardMaterial({
      color: particle.color,
      emissive: emissiveColor,
      emissiveIntensity: emissiveIntensity,
      metalness: metalness,
      roughness: roughness,
    });
    
    return mat;
  }, [
    particle.color, // Add color as dependency so material updates when color changes
    isBeingDragged,
    isConstraintStart,
    canFinishConstraint,
    isPartOfSelectedComposite,
    isMultiSelected,
    isSelected,
    isEditMode,
    particle.id
  ]);
  
  // Clean up material on unmount or when it changes
  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);
  

  // Drag handling functions
  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation();
    
    console.log('PointerDown event:', { 
      shiftKey: e.shiftKey,
      particleId: particle.id 
    });
    
    // Handle shift+click for multi-selection
    if (e.shiftKey && !isCreatingConstraint) {
      // Don't start drag on shift+click, just toggle selection
      // Let the click event handle this for better compatibility
      console.log('Shift detected in pointerDown, returning early');
      return;
    }
    
    // Only allow dragging in translate mode
    if (transformMode !== 'translate' || isCreatingConstraint) {
      return;
    }
    
    // If not selected, select it first (for normal drag)
    if (!isSelected && !isMultiSelected && !isCreatingConstraint) {
      selectParticle(particle.id);
      // Continue to allow immediate drag after selection
    }
    
    // Record mouse down position
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    setHasMoved(false);
    
    // Store initial values for transforms
    const rect = gl.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    setInitialMousePos(new Vector2(x, y));
    setInitialRadius(particle.radius);
    
    // Calculate transform center and store initial positions/radii for transforms
    const engine = useEngineStore.getState().engine;
    
    // Build the set of particles to transform
    // Include the current particle since we just selected it (or it was already selected)
    const particlesToTransform = new Set<string>();
    if (selectedParticleIds.size > 0) {
      selectedParticleIds.forEach(id => particlesToTransform.add(id));
      // If we just selected this particle, it might not be in selectedParticleIds yet
      if (!selectedParticleIds.has(particle.id)) {
        particlesToTransform.add(particle.id);
      }
    } else {
      // Single selection case - always include the current particle
      particlesToTransform.add(particle.id);
    }
    
    if (particlesToTransform.size > 1) {
      // Use center of all selected particles and store their initial positions and radii
      let centerX = 0, centerY = 0, centerZ = 0;
      let count = 0;
      const initialPos = new Map<string, ThreeVector3>();
      const initialRad = new Map<string, number>();
      
      particlesToTransform.forEach(id => {
        const p = engine?.getParticles().find(part => part.id === id);
        if (p) {
          centerX += p.position.x;
          centerY += p.position.y;
          centerZ += p.position.z;
          count++;
          // Store initial position for rotation
          initialPos.set(id, new ThreeVector3(p.position.x, p.position.y, p.position.z));
          // Store initial radius for scaling
          initialRad.set(id, p.radius);
        }
      });
      
      if (count > 0) {
        setTransformCenter(new ThreeVector3(centerX / count, centerY / count, centerZ / count));
        setInitialPositions(initialPos);
        setInitialRadii(initialRad);
      }
    } else {
      setTransformCenter(new ThreeVector3(particle.position.x, particle.position.y, particle.position.z));
      const initialPos = new Map<string, ThreeVector3>();
      const initialRad = new Map<string, number>();
      initialPos.set(particle.id, new ThreeVector3(particle.position.x, particle.position.y, particle.position.z));
      initialRad.set(particle.id, particle.radius);
      setInitialPositions(initialPos);
      setInitialRadii(initialRad);
    }
    
    // Set up drag plane perpendicular to camera view
    const cameraDirection = new ThreeVector3();
    camera.getWorldDirection(cameraDirection);
    dragPlane.setFromNormalAndCoplanarPoint(cameraDirection, new ThreeVector3(particle.position.x, particle.position.y, particle.position.z));
    
    const raycaster = new Raycaster();
    raycaster.setFromCamera(new Vector2(x, y), camera);
    
    const intersectPoint = new ThreeVector3();
    raycaster.ray.intersectPlane(dragPlane, intersectPoint);
    
    if (intersectPoint) {
      dragOffset.subVectors(intersectPoint, new ThreeVector3(particle.position.x, particle.position.y, particle.position.z));
    }
  }, [transformMode, isCreatingConstraint, camera, gl, particle, dragPlane, dragOffset, selectedParticleIds, isSelected, isMultiSelected, selectParticle, toggleParticleSelection]);

  // Global mouse move handler for dragging and transforms
  useEffect(() => {
    if (!mouseDownPos) return;

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
        
        // Update cursor for active dragging
        if (transformMode === 'translate') {
          document.body.style.cursor = 'grabbing';
        } else if (transformMode === 'rotate') {
          document.body.style.cursor = 'alias';
        } else if (transformMode === 'scale') {
          document.body.style.cursor = 'nwse-resize';
        }
      }
      
      if (isBeingDragged) {
        const rect = gl.domElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        const currentMousePos = new Vector2(x, y);
        
        // Apply different transforms based on mode
        if (transformMode === 'translate') {
          // TRANSLATE: Move particle in 3D space
          const raycaster = new Raycaster();
          raycaster.setFromCamera(currentMousePos, camera);
          
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
        } else if (transformMode === 'scale' && initialMousePos && initialRadii) {
          // SCALE: Resize particle based on mouse distance
          const deltaX = currentMousePos.x - initialMousePos.x;
          const scaleFactor = 1 + deltaX * 2; // Scale based on horizontal movement
          
          // Scale all selected particles proportionally
          initialRadii.forEach((initialR, id) => {
            const newRadius = Math.max(0.1, Math.min(5, initialR * scaleFactor));
            updateParticleProperties(id, { radius: newRadius });
          });
        } else if (transformMode === 'rotate' && initialMousePos && transformCenter && initialPositions) {
          // ROTATE: Rotate particle around center point
          const deltaX = currentMousePos.x - initialMousePos.x;
          const angle = deltaX * Math.PI; // Rotation angle based on horizontal movement
          
          // For single particle, we can't really rotate it (it's a sphere)
          // But for multiple particles, rotate them around their center
          if (initialPositions.size > 1) {
            const cosAngle = Math.cos(angle);
            const sinAngle = Math.sin(angle);
            
            initialPositions.forEach((initialPos, id) => {
              // Get initial position relative to center
              const relX = initialPos.x - transformCenter.x;
              const relZ = initialPos.z - transformCenter.z;
              
              // Apply 2D rotation around Y axis
              const newRelX = relX * cosAngle - relZ * sinAngle;
              const newRelZ = relX * sinAngle + relZ * cosAngle;
              
              updateParticlePosition(id, {
                x: transformCenter.x + newRelX,
                y: initialPos.y, // Keep Y unchanged
                z: transformCenter.z + newRelZ
              });
            });
          }
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
      setInitialMousePos(null);
      setTransformCenter(null);
      setInitialPositions(null);
      setInitialRadii(null);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [mouseDownPos, transformMode, isBeingDragged, camera, gl, particle.id, dragPlane, dragOffset, updateParticlePosition, updateMultipleParticlePositions, updateParticleProperties, startDragging, stopDragging, lastDragPosition, initialMousePos, initialRadius, transformCenter, selectedParticleIds, initialPositions, initialRadii]);



  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(
        particle.position.x,
        particle.position.y,
        particle.position.z
      );
      
      // Update scale if radius changed, applying global multiplier
      const scale = particle.radius * particleRadiusMultiplier;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    
    // For shift+click, ignore drag state since we're not dragging
    if (e.shiftKey) {
      // Handle shift+click for multi-selection
      toggleParticleSelection(particle.id);
      return;
    }
    
    // Don't change selection if we're dragging or if we moved the mouse
    if (isDragging || hasMoved) {
      return;
    }
    
    if (isCreatingConstraint) {
      if (constraintStartParticleId === particle.id) {
        // Clicking the same particle cancels constraint creation
        cancelConstraintCreation();
      } else {
        // Clicking a different particle finishes constraint creation
        finishConstraintCreation(particle.id);
      }
    } else if (!isSelected && !isMultiSelected) {
      // Regular click - select this particle only if not already selected
      // This handles the case where pointerDown might not have fired
      selectParticle(particle.id);
    }
  };

  const handleDoubleClick = (e: any) => {
    e.stopPropagation();
    
    // Double-click starts constraint creation
    if (!isCreatingConstraint) {
      selectParticle(particle.id);
      startConstraintCreation(particle.id);
    } else if (constraintStartParticleId === particle.id) {
      // Double-clicking the same particle cancels
      cancelConstraintCreation();
    } else {
      // Double-clicking another particle completes the constraint
      finishConstraintCreation(particle.id);
    }
  };

  const setIsPotentialDragTarget = useEngineStore((state) => state.setIsPotentialDragTarget);
  
  const handlePointerOver = () => {
    if (transformMode && (isSelected || isMultiSelected) && !isCreatingConstraint) {
      // Set cursor based on transform mode for selected particles
      if (transformMode === 'translate') {
        document.body.style.cursor = 'grab';
      } else if (transformMode === 'rotate') {
        document.body.style.cursor = 'alias';
      } else if (transformMode === 'scale') {
        document.body.style.cursor = 'nwse-resize';
      }
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

  const displayRadius = particle.radius * particleRadiusMultiplier;
  
  return (
    <mesh
      ref={meshRef}
      position={[particle.position.x, particle.position.y, particle.position.z]}
      scale={[displayRadius, displayRadius, displayRadius]}
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
