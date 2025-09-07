import { useRef, useState, useEffect } from 'react';
import { Mesh, Vector3, BufferGeometry, LineBasicMaterial, ConeGeometry, MeshBasicMaterial, TorusGeometry, BoxGeometry, SphereGeometry, Raycaster, Vector2, Plane } from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { useEngineStore } from '../../stores/useEngineStore';

interface TransformGizmoProps {
  position: Vector3;
  onTransform?: (delta: Vector3, mode: 'translate' | 'rotate' | 'scale') => void;
}

export function TransformGizmo({ position, onTransform }: TransformGizmoProps) {
  const { camera, gl, scene, raycaster } = useThree();
  const transformMode = useEngineStore((state) => state.transformMode);
  const isEditMode = useEngineStore((state) => state.isEditMode);
  const selectedParticleId = useEngineStore((state) => state.selectedParticleId);
  const selectedParticleIds = useEngineStore((state) => state.selectedParticleIds);
  const updateParticlePosition = useEngineStore((state) => state.updateParticlePosition);
  const updateParticleProperties = useEngineStore((state) => state.updateParticleProperties);
  const startDragging = useEngineStore((state) => state.startDragging);
  const stopDragging = useEngineStore((state) => state.stopDragging);
  
  const [hoveredAxis, setHoveredAxis] = useState<'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz' | null>(null);
  const [draggingAxis, setDraggingAxis] = useState<'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz' | null>(null);
  const [dragPlane] = useState(() => new Plane());
  const [dragStartPoint, setDragStartPoint] = useState<Vector3 | null>(null);
  const [initialPositions, setInitialPositions] = useState<Map<string, Vector3> | null>(null);
  const [initialRadii, setInitialRadii] = useState<Map<string, number> | null>(null);
  
  // Scale gizmo based on distance from camera
  const [gizmoScale, setGizmoScale] = useState(1);
  
  useFrame(() => {
    const distance = camera.position.distanceTo(position);
    const scale = distance * 0.1; // Adjust this factor to control gizmo size
    setGizmoScale(Math.max(0.5, Math.min(3, scale)));
  });

  if (!transformMode || transformMode === 'grab') {
    return null;
  }

  const handlePointerOver = (axis: 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz') => {
    if (!draggingAxis) {
      setHoveredAxis(axis);
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    if (!draggingAxis) {
      setHoveredAxis(null);
      document.body.style.cursor = 'default';
    }
  };

  const handlePointerDown = (e: any, axis: 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz') => {
    e.stopPropagation();
    setDraggingAxis(axis);
    document.body.style.cursor = 'grabbing';
    
    // Start dragging for the first selected particle (or the only selected one)
    const firstSelectedId = selectedParticleIds.size > 0 
      ? Array.from(selectedParticleIds)[0] 
      : selectedParticleId;
    
    if (firstSelectedId) {
      startDragging(firstSelectedId);
    }
    
    // Set up drag plane based on axis
    const rect = gl.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    const raycaster = new Raycaster();
    raycaster.setFromCamera(new Vector2(x, y), camera);
    
    // Set up the appropriate drag plane
    if (axis === 'x' || axis === 'y' || axis === 'z') {
      // For single axis, always use a plane perpendicular to the camera view
      // This ensures consistent dragging behavior regardless of camera angle
      const cameraDirection = new Vector3();
      camera.getWorldDirection(cameraDirection);
      dragPlane.setFromNormalAndCoplanarPoint(cameraDirection, position);
    } else {
      // For plane constraints, set the plane directly
      if (axis === 'xy') dragPlane.setFromNormalAndCoplanarPoint(new Vector3(0, 0, 1), position);
      else if (axis === 'xz') dragPlane.setFromNormalAndCoplanarPoint(new Vector3(0, 1, 0), position);
      else if (axis === 'yz') dragPlane.setFromNormalAndCoplanarPoint(new Vector3(1, 0, 0), position);
    }
    
    // Get initial intersection point
    const intersectPoint = new Vector3();
    raycaster.ray.intersectPlane(dragPlane, intersectPoint);
    setDragStartPoint(intersectPoint);
    
    // Store initial positions for all selected particles
    const engine = useEngineStore.getState().engine;
    const particles = engine?.getParticles() || [];
    const selectedIds = new Set<string>();
    
    if (selectedParticleIds.size > 0) {
      selectedParticleIds.forEach(id => selectedIds.add(id));
    } else if (selectedParticleId) {
      selectedIds.add(selectedParticleId);
    }
    
    const initPos = new Map<string, Vector3>();
    const initRad = new Map<string, number>();
    
    selectedIds.forEach(id => {
      const particle = particles.find(p => p.id === id);
      if (particle) {
        initPos.set(id, new Vector3(particle.position.x, particle.position.y, particle.position.z));
        initRad.set(id, particle.radius);
      }
    });
    
    setInitialPositions(initPos);
    setInitialRadii(initRad);
  };
  
  // Handle mouse movement for dragging
  useEffect(() => {
    if (!draggingAxis || !dragStartPoint || !initialPositions) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      // Get current mouse position in 3D space
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      const raycaster = new Raycaster();
      raycaster.setFromCamera(new Vector2(x, y), camera);
      
      const intersectPoint = new Vector3();
      raycaster.ray.intersectPlane(dragPlane, intersectPoint);
      
      if (!intersectPoint) return;
      
      // Calculate delta from drag start
      const delta = new Vector3().subVectors(intersectPoint, dragStartPoint);
      
      if (transformMode === 'translate') {
        // Apply axis constraints properly
        let constrainedDelta = new Vector3();
        
        if (draggingAxis === 'x') {
          // Project the delta onto the X axis
          const xAxis = new Vector3(1, 0, 0);
          const projection = delta.dot(xAxis);
          constrainedDelta.x = projection;
        } else if (draggingAxis === 'y') {
          // Project the delta onto the Y axis
          const yAxis = new Vector3(0, 1, 0);
          const projection = delta.dot(yAxis);
          constrainedDelta.y = projection;
        } else if (draggingAxis === 'z') {
          // Project the delta onto the Z axis
          const zAxis = new Vector3(0, 0, 1);
          const projection = delta.dot(zAxis);
          constrainedDelta.z = projection;
        } else if (draggingAxis === 'xy') {
          // Only keep X and Y components
          constrainedDelta.x = delta.x;
          constrainedDelta.y = delta.y;
        } else if (draggingAxis === 'xz') {
          // Only keep X and Z components
          constrainedDelta.x = delta.x;
          constrainedDelta.z = delta.z;
        } else if (draggingAxis === 'yz') {
          // Only keep Y and Z components
          constrainedDelta.y = delta.y;
          constrainedDelta.z = delta.z;
        }
        
        // Update all selected particles
        initialPositions.forEach((initPos, id) => {
          updateParticlePosition(id, {
            x: initPos.x + constrainedDelta.x,
            y: initPos.y + constrainedDelta.y,
            z: initPos.z + constrainedDelta.z
          });
        });
      } else if (transformMode === 'scale' && initialRadii) {
        // Calculate scale factor based on drag distance
        const dragDistance = delta.length();
        const scaleFactor = 1 + (delta.x + delta.y) * 0.5; // Use average of X and Y movement
        
        initialRadii.forEach((initRadius, id) => {
          const newRadius = Math.max(0.1, Math.min(5, initRadius * scaleFactor));
          updateParticleProperties(id, { radius: newRadius });
        });
      } else if (transformMode === 'rotate' && initialPositions) {
        // Calculate rotation angle based on drag
        const angle = Math.atan2(delta.x, delta.z);
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        
        initialPositions.forEach((initPos, id) => {
          const relX = initPos.x - position.x;
          const relZ = initPos.z - position.z;
          
          const newRelX = relX * cosAngle - relZ * sinAngle;
          const newRelZ = relX * sinAngle + relZ * cosAngle;
          
          updateParticlePosition(id, {
            x: position.x + newRelX,
            y: initPos.y,
            z: position.z + newRelZ
          });
        });
      }
    };
    
    const handleMouseUp = () => {
      setDraggingAxis(null);
      setDragStartPoint(null);
      setInitialPositions(null);
      setInitialRadii(null);
      document.body.style.cursor = 'default';
      stopDragging();
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingAxis, dragStartPoint, dragPlane, transformMode, initialPositions, initialRadii, position, updateParticlePosition, updateParticleProperties, camera, gl]);

  const axisColors = {
    x: hoveredAxis === 'x' || draggingAxis === 'x' ? '#ffff00' : '#ff0000',
    y: hoveredAxis === 'y' || draggingAxis === 'y' ? '#ffff00' : '#00ff00',
    z: hoveredAxis === 'z' || draggingAxis === 'z' ? '#ffff00' : '#0080ff',
    xy: hoveredAxis === 'xy' || draggingAxis === 'xy' ? '#ffff00' : '#ffff0080',
    xz: hoveredAxis === 'xz' || draggingAxis === 'xz' ? '#ffff00' : '#ff00ff80',
    yz: hoveredAxis === 'yz' || draggingAxis === 'yz' ? '#ffff00' : '#00ffff80',
  };

  const arrowLength = 1.5 * gizmoScale;
  const arrowHeadSize = 0.2 * gizmoScale;
  const lineWidth = 3;

  if (transformMode === 'translate') {
    return (
      <group position={position}>
        {/* X Axis */}
        <group>
          <Line
            points={[[0, 0, 0], [arrowLength, 0, 0]]}
            color={axisColors.x}
            lineWidth={lineWidth}
            onPointerOver={() => handlePointerOver('x')}
            onPointerOut={handlePointerOut}
            onPointerDown={(e) => handlePointerDown(e, 'x')}
          />
          <mesh
            position={[arrowLength, 0, 0]}
            rotation={[0, 0, -Math.PI / 2]}
            onPointerOver={() => handlePointerOver('x')}
            onPointerOut={handlePointerOut}
            onPointerDown={(e) => handlePointerDown(e, 'x')}
          >
            <coneGeometry args={[arrowHeadSize, arrowHeadSize * 2, 8]} />
            <meshBasicMaterial color={axisColors.x} />
          </mesh>
        </group>

        {/* Y Axis */}
        <group>
          <Line
            points={[[0, 0, 0], [0, arrowLength, 0]]}
            color={axisColors.y}
            lineWidth={lineWidth}
            onPointerOver={() => handlePointerOver('y')}
            onPointerOut={handlePointerOut}
            onPointerDown={(e) => handlePointerDown(e, 'y')}
          />
          <mesh
            position={[0, arrowLength, 0]}
            onPointerOver={() => handlePointerOver('y')}
            onPointerOut={handlePointerOut}
            onPointerDown={(e) => handlePointerDown(e, 'y')}
          >
            <coneGeometry args={[arrowHeadSize, arrowHeadSize * 2, 8]} />
            <meshBasicMaterial color={axisColors.y} />
          </mesh>
        </group>

        {/* Z Axis */}
        <group>
          <Line
            points={[[0, 0, 0], [0, 0, arrowLength]]}
            color={axisColors.z}
            lineWidth={lineWidth}
            onPointerOver={() => handlePointerOver('z')}
            onPointerOut={handlePointerOut}
            onPointerDown={(e) => handlePointerDown(e, 'z')}
          />
          <mesh
            position={[0, 0, arrowLength]}
            rotation={[Math.PI / 2, 0, 0]}
            onPointerOver={() => handlePointerOver('z')}
            onPointerOut={handlePointerOut}
            onPointerDown={(e) => handlePointerDown(e, 'z')}
          >
            <coneGeometry args={[arrowHeadSize, arrowHeadSize * 2, 8]} />
            <meshBasicMaterial color={axisColors.z} />
          </mesh>
        </group>

        {/* XY Plane */}
        <mesh
          position={[arrowLength * 0.3, arrowLength * 0.3, 0]}
          onPointerOver={() => handlePointerOver('xy')}
          onPointerOut={handlePointerOut}
          onPointerDown={(e) => handlePointerDown(e, 'xy')}
        >
          <planeGeometry args={[arrowLength * 0.3, arrowLength * 0.3]} />
          <meshBasicMaterial color={axisColors.xy} transparent opacity={0.5} side={2} />
        </mesh>

        {/* XZ Plane */}
        <mesh
          position={[arrowLength * 0.3, 0, arrowLength * 0.3]}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerOver={() => handlePointerOver('xz')}
          onPointerOut={handlePointerOut}
          onPointerDown={(e) => handlePointerDown(e, 'xz')}
        >
          <planeGeometry args={[arrowLength * 0.3, arrowLength * 0.3]} />
          <meshBasicMaterial color={axisColors.xz} transparent opacity={0.5} side={2} />
        </mesh>

        {/* YZ Plane */}
        <mesh
          position={[0, arrowLength * 0.3, arrowLength * 0.3]}
          rotation={[0, Math.PI / 2, 0]}
          onPointerOver={() => handlePointerOver('yz')}
          onPointerOut={handlePointerOut}
          onPointerDown={(e) => handlePointerDown(e, 'yz')}
        >
          <planeGeometry args={[arrowLength * 0.3, arrowLength * 0.3]} />
          <meshBasicMaterial color={axisColors.yz} transparent opacity={0.5} side={2} />
        </mesh>
      </group>
    );
  }

  if (transformMode === 'rotate') {
    const ringRadius = 1.2 * gizmoScale;
    const ringThickness = 0.05 * gizmoScale;
    
    return (
      <group position={position}>
        {/* X Rotation Ring */}
        <mesh
          rotation={[0, Math.PI / 2, 0]}
          onPointerOver={() => handlePointerOver('x')}
          onPointerOut={handlePointerOut}
          onPointerDown={(e) => handlePointerDown(e, 'x')}
        >
          <torusGeometry args={[ringRadius, ringThickness, 4, 32]} />
          <meshBasicMaterial color={axisColors.x} />
        </mesh>

        {/* Y Rotation Ring */}
        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          onPointerOver={() => handlePointerOver('y')}
          onPointerOut={handlePointerOut}
          onPointerDown={(e) => handlePointerDown(e, 'y')}
        >
          <torusGeometry args={[ringRadius, ringThickness, 4, 32]} />
          <meshBasicMaterial color={axisColors.y} />
        </mesh>

        {/* Z Rotation Ring */}
        <mesh
          onPointerOver={() => handlePointerOver('z')}
          onPointerOut={handlePointerOut}
          onPointerDown={(e) => handlePointerDown(e, 'z')}
        >
          <torusGeometry args={[ringRadius, ringThickness, 4, 32]} />
          <meshBasicMaterial color={axisColors.z} />
        </mesh>
      </group>
    );
  }

  if (transformMode === 'scale') {
    const handleSize = 0.15 * gizmoScale;
    const lineLength = 1.0 * gizmoScale;
    
    return (
      <group position={position}>
        {/* X Axis Scale */}
        <group>
          <Line
            points={[[0, 0, 0], [lineLength, 0, 0]]}
            color={axisColors.x}
            lineWidth={lineWidth}
            onPointerOver={() => handlePointerOver('x')}
            onPointerOut={handlePointerOut}
            onPointerDown={(e) => handlePointerDown(e, 'x')}
          />
          <mesh
            position={[lineLength, 0, 0]}
            onPointerOver={() => handlePointerOver('x')}
            onPointerOut={handlePointerOut}
            onPointerDown={(e) => handlePointerDown(e, 'x')}
          >
            <boxGeometry args={[handleSize * 2, handleSize * 2, handleSize * 2]} />
            <meshBasicMaterial color={axisColors.x} />
          </mesh>
        </group>

        {/* Y Axis Scale */}
        <group>
          <Line
            points={[[0, 0, 0], [0, lineLength, 0]]}
            color={axisColors.y}
            lineWidth={lineWidth}
            onPointerOver={() => handlePointerOver('y')}
            onPointerOut={handlePointerOut}
            onPointerDown={(e) => handlePointerDown(e, 'y')}
          />
          <mesh
            position={[0, lineLength, 0]}
            onPointerOver={() => handlePointerOver('y')}
            onPointerOut={handlePointerOut}
            onPointerDown={(e) => handlePointerDown(e, 'y')}
          >
            <boxGeometry args={[handleSize * 2, handleSize * 2, handleSize * 2]} />
            <meshBasicMaterial color={axisColors.y} />
          </mesh>
        </group>

        {/* Z Axis Scale */}
        <group>
          <Line
            points={[[0, 0, 0], [0, 0, lineLength]]}
            color={axisColors.z}
            lineWidth={lineWidth}
            onPointerOver={() => handlePointerOver('z')}
            onPointerOut={handlePointerOut}
            onPointerDown={(e) => handlePointerDown(e, 'z')}
          />
          <mesh
            position={[0, 0, lineLength]}
            onPointerOver={() => handlePointerOver('z')}
            onPointerOut={handlePointerOut}
            onPointerDown={(e) => handlePointerDown(e, 'z')}
          >
            <boxGeometry args={[handleSize * 2, handleSize * 2, handleSize * 2]} />
            <meshBasicMaterial color={axisColors.z} />
          </mesh>
        </group>

        {/* Center Uniform Scale */}
        <mesh
          onPointerOver={() => handlePointerOver('xy')}
          onPointerOut={handlePointerOut}
          onPointerDown={(e) => handlePointerDown(e, 'xy')}
        >
          <sphereGeometry args={[handleSize * 2, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
    );
  }

  return null;
}