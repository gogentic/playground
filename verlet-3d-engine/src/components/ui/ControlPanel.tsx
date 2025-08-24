import { useEngineStore } from '../../stores/useEngineStore';
import { Vector3 } from '../../core/physics/Vector3';
import { useState, useEffect } from 'react';
import './ControlPanel.css';

// Local interface to avoid circular dependency
interface IVector3 {
  x: number;
  y: number;
  z: number;
}

export function ControlPanel() {
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
    toggleGrid,
    toggleStats,
    toggleGround,
    updateGravity,
    updateTimeStep,
    updateIterations,
    // Edit mode
    isEditMode,
    toggleEditMode,
    isDragging,
    // Undo/Redo
    undo,
    redo,
    canUndo,
    canRedo,
  } = useEngineStore();

  const config = engine.getConfig();
  
  // State for real-time stats updates
  const [particleCount, setParticleCount] = useState(0);
  const [constraintCount, setConstraintCount] = useState(0);
  const [simulationTime, setSimulationTime] = useState(0);

  // Update stats periodically
  useEffect(() => {
    const updateStats = () => {
      setParticleCount(engine.getParticles().length);
      setConstraintCount(engine.getConstraints().length);
      setSimulationTime(engine.getTime());
    };

    // Update immediately
    updateStats();

    // Update every 100ms for real-time feedback
    const interval = setInterval(updateStats, 100);
    return () => clearInterval(interval);
  }, [engine]);

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
    <div className="control-panel">
      <div className="panel-section">
        <h3>Edit Mode</h3>
        <div className="button-group">
          <button 
            onClick={toggleEditMode} 
            className={`btn ${isEditMode ? 'btn-primary' : 'btn-secondary'}`}
          >
            {isEditMode ? '🎯 Exit Edit Mode' : '✏️ Enter Edit Mode'}
          </button>
          {isEditMode && (
            <div className="edit-mode-info">
              <p>🖱️ Drag particles to reposition them</p>
              {isDragging && <p>🔄 Dragging particle...</p>}
              
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
          )}
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
            <button onClick={play} className="btn btn-primary" disabled={isEditMode}>
              ▶ Play
            </button>
          )}
          <button onClick={step} className="btn btn-secondary" disabled={isPlaying || isEditMode}>
            ⏭ Step
          </button>
          <button onClick={reset} className="btn btn-danger">
            ⏹ Reset
          </button>
        </div>
        {isEditMode && (
          <div className="mode-indicator">
            <span className="edit-mode-badge">Edit Mode Active - Physics Paused</span>
          </div>
        )}
      </div>

      <div className="panel-section">
        <h3>Physics Settings</h3>
        
        <div className="input-group">
          <label>Gravity</label>
          <div className="vector-inputs">
            <input
              type="number"
              value={config.gravity.x}
              onChange={(e) => handleGravityChange('x', parseFloat(e.target.value))}
              step="0.1"
              placeholder="X"
            />
            <input
              type="number"
              value={config.gravity.y}
              onChange={(e) => handleGravityChange('y', parseFloat(e.target.value))}
              step="0.1"
              placeholder="Y"
            />
            <input
              type="number"
              value={config.gravity.z}
              onChange={(e) => handleGravityChange('z', parseFloat(e.target.value))}
              step="0.1"
              placeholder="Z"
            />
          </div>
        </div>

        <div className="input-group">
          <label>Time Step</label>
          <input
            type="number"
            value={config.timeStep}
            onChange={(e) => updateTimeStep(parseFloat(e.target.value))}
            min="0.001"
            max="0.1"
            step="0.001"
          />
        </div>

        <div className="input-group">
          <label>Iterations</label>
          <input
            type="number"
            value={config.iterations}
            onChange={(e) => updateIterations(parseInt(e.target.value))}
            min="1"
            max="10"
            step="1"
          />
        </div>

        <div className="input-group">
          <label>Damping</label>
          <input
            type="number"
            value={config.damping}
            onChange={(e) => engine.updateConfig({ damping: parseFloat(e.target.value) })}
            min="0"
            max="1"
            step="0.01"
          />
        </div>
      </div>

      <div className="panel-section">
        <h3>Display Options</h3>
        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={showGrid}
              onChange={toggleGrid}
            />
            Show Grid
          </label>
          <label>
            <input
              type="checkbox"
              checked={showStats}
              onChange={toggleStats}
            />
            Show Stats
          </label>
          <label>
            <input
              type="checkbox"
              checked={showGround}
              onChange={toggleGround}
            />
            Show Ground
          </label>
        </div>
      </div>

      <div className="panel-section">
        <h3>Statistics</h3>
        <div className="stats">
          <div>Particles: <span id="particle-count">{particleCount}</span></div>
          <div>Constraints: <span id="constraint-count">{constraintCount}</span></div>
          <div>Time: {simulationTime.toFixed(2)}s</div>
        </div>
      </div>
    </div>
  );
}
