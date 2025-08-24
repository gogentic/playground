import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Stats } from '@react-three/drei';
import { Scene } from './Scene';
import { useEngineStore } from '../../stores/useEngineStore';

export function Viewport() {
  const showGrid = useEngineStore((state) => state.showGrid);
  const showStats = useEngineStore((state) => state.showStats);
  const isCreatingConstraint = useEngineStore((state) => state.isCreatingConstraint);
  const cancelConstraintCreation = useEngineStore((state) => state.cancelConstraintCreation);
  const isDragging = useEngineStore((state) => state.isDragging);

  const handleCanvasClick = () => {
    if (isCreatingConstraint) {
      cancelConstraintCreation();
    }
  };

  return (
    <div className="viewport">
      <Canvas
        camera={{ position: [10, 10, 10], fov: 60 }}
        shadows
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
        }}
        onClick={handleCanvasClick}
      >
        <color attach="background" args={['#1a1a1a']} />
        <fog attach="fog" args={['#1a1a1a', 50, 100]} />
        
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        
        <OrbitControls
          enablePan={!isDragging}
          enableZoom={!isDragging}
          enableRotate={!isDragging}
          zoomSpeed={0.5}
          panSpeed={0.5}
          rotateSpeed={0.5}
        />
        
        {showGrid && (
          <Grid
            args={[100, 100]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#444444"
            sectionSize={10}
            sectionThickness={1}
            sectionColor="#666666"
            fadeDistance={50}
            fadeStrength={1}
            infiniteGrid
          />
        )}
        
        <Scene />
        
        {showStats && <Stats />}
      </Canvas>
    </div>
  );
}
