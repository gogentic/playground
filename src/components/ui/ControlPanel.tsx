import { useEngineStore } from '../../stores/useEngineStore';
import { Vector3 } from '../../core/physics/Vector3';
import { useEffect, useState } from 'react';
import './ControlPanel.css';

export function ControlPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const {
    isPlaying,
    play,
    pause,
    reset,
    step,
    engine,
    showGrid,
    showStats,
    showGround,
    showBoundingBoxes,
    toggleGrid,
    toggleStats,
    toggleGround,
    toggleBoundingBoxes,
    updateGravity,
    updateTimeStep,
    updateIterations,
    // Undo/Redo
    undo,
    redo,
    canUndo,
    canRedo,
  } = useEngineStore();

  const config = engine.getConfig();

  // Sync ground state with engine
  useEffect(() => {
    engine.setGroundEnabled(showGround);
  }, [engine, showGround]);

  const handleGravityChange = (axis: 'x' | 'y' | 'z', value: number) => {
    const gravity = Vector3.from(config.gravity);
    gravity[axis] = value;
    updateGravity(gravity);
  };

  return (
    <div className={`control-panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="panel-header" onClick={() => setCollapsed(!collapsed)}>
        <h3>Controls</h3>
        <span className="collapse-icon">{collapsed ? '▶' : '▼'}</span>
      </div>
      {!collapsed && (
      <div className="panel-content">
      <div className="panel-section">
        <h3>History</h3>
        <div className="undo-redo-buttons">
          <button 
            onClick={undo} 
            disabled={!canUndo()}
            className="btn btn-secondary"
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button 
            onClick={redo} 
            disabled={!canRedo()}
            className="btn btn-secondary"
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </button>
        </div>
      </div>

      <div className="panel-section">
        <h3>Simulation Controls</h3>
        <div className="button-group">
          {isPlaying ? (
            <button onClick={pause} className="btn btn-secondary">
              ⏸ Pause
            </button>
          ) : (
            <button onClick={play} className="btn btn-primary">
              ▶ Play
            </button>
          )}
          <button onClick={step} className="btn btn-secondary" disabled={isPlaying}>
            ⏭ Step
          </button>
          <button onClick={reset} className="btn btn-danger">
            ⏹ Reset
          </button>
        </div>
      </div>

      <div className="panel-section">
        <p style={{fontSize: '10px', color: '#808080', fontStyle: 'italic', margin: 0}}>
          Physics and display settings have been moved to the Environment section in the Tools panel.
        </p>
      </div>

      </div>
      )}
    </div>
  );
}
