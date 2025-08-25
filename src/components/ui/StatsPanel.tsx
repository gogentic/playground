import { useState, useEffect } from 'react';
import { useEngineStore } from '../../stores/useEngineStore';
import './StatsPanel.css';

export function StatsPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const engine = useEngineStore((state) => state.engine);
  const showStats = useEngineStore((state) => state.showStats);
  
  const [particleCount, setParticleCount] = useState(0);
  const [constraintCount, setConstraintCount] = useState(0);
  const [simulationTime, setSimulationTime] = useState(0);
  const [fps, setFps] = useState(0);
  
  useEffect(() => {
    if (!showStats) return;
    
    let lastTime = performance.now();
    let frameCount = 0;
    
    const updateStats = () => {
      setParticleCount(engine.getParticles().length);
      setConstraintCount(engine.getConstraints().length);
      setSimulationTime(engine.getTime());
      
      // Calculate FPS
      frameCount++;
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / deltaTime));
        frameCount = 0;
        lastTime = currentTime;
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 100);
    
    return () => clearInterval(interval);
  }, [engine, showStats]);
  
  if (!showStats) return null;
  
  return (
    <div className={`stats-panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="stats-header" onClick={() => setCollapsed(!collapsed)}>
        <span>Statistics</span>
        <span className="collapse-icon">{collapsed ? '▶' : '▼'}</span>
      </div>
      {!collapsed && (
      <div className="stats-content">
        <div className="stat-item">
          <span className="stat-label">FPS:</span>
          <span className="stat-value">{fps}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Particles:</span>
          <span className="stat-value">{particleCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Constraints:</span>
          <span className="stat-value">{constraintCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Time:</span>
          <span className="stat-value">{simulationTime.toFixed(2)}s</span>
        </div>
      </div>
      )}
    </div>
  );
}