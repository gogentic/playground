import { useState, useEffect } from 'react';
import { useEngineStore } from '../../stores/useEngineStore';
import './EnvironmentalPanel.css';

export function EnvironmentalPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const showEnvironmental = useEngineStore((state) => state.showEnvironmental);
  const showObjectProperties = useEngineStore((state) => state.showObjectProperties);
  const toggleEnvironmental = useEngineStore((state) => state.toggleEnvironmental);
  const engine = useEngineStore((state) => state.engine);
  
  // Environmental properties
  const [gravity, setGravity] = useState({ x: 0, y: -9.81, z: 0 });
  const [airDamping, setAirDamping] = useState(0.99);
  const [groundBounce, setGroundBounce] = useState(0.8);
  const [groundFriction, setGroundFriction] = useState(0.95);
  const [timeScale, setTimeScale] = useState(1);
  
  // Wind/Force field
  const [windEnabled, setWindEnabled] = useState(false);
  const [windForce, setWindForce] = useState({ x: 0, y: 0, z: 0 });
  const [windTurbulence, setWindTurbulence] = useState(0);
  
  // Initialize from engine
  useEffect(() => {
    if (engine) {
      setGravity({
        x: engine.gravity.x,
        y: engine.gravity.y,
        z: engine.gravity.z
      });
      setGroundBounce(engine.groundBounce);
      setGroundFriction(engine.groundFriction);
    }
  }, [engine]);
  
  // Reset collapsed state when panel is shown from toolbar
  useEffect(() => {
    if (showEnvironmental) {
      setCollapsed(false);
    }
  }, [showEnvironmental]);
  
  // Apply gravity changes
  const applyGravity = () => {
    if (engine) {
      engine.gravity.x = gravity.x;
      engine.gravity.y = gravity.y;
      engine.gravity.z = gravity.z;
    }
  };
  
  // Apply ground properties
  const applyGroundProperties = () => {
    if (engine) {
      engine.groundBounce = groundBounce;
      engine.groundFriction = groundFriction;
    }
  };
  
  // Apply time scale
  const applyTimeScale = () => {
    if (engine && engine.timeScale !== undefined) {
      engine.timeScale = timeScale;
    }
  };
  
  // Apply wind force to all particles
  const applyWindForce = () => {
    if (engine && windEnabled) {
      const particles = engine.getParticles();
      particles.forEach(particle => {
        if (!particle.fixed) {
          // Apply base wind force
          const force = {
            x: windForce.x,
            y: windForce.y,
            z: windForce.z
          };
          
          // Add turbulence if enabled
          if (windTurbulence > 0) {
            force.x += (Math.random() - 0.5) * windTurbulence;
            force.y += (Math.random() - 0.5) * windTurbulence * 0.5;
            force.z += (Math.random() - 0.5) * windTurbulence;
          }
          
          // Apply force as velocity (simplified wind model)
          particle.position.x += force.x * 0.01;
          particle.position.y += force.y * 0.01;
          particle.position.z += force.z * 0.01;
        }
      });
    }
  };
  
  // Apply wind continuously when enabled
  useEffect(() => {
    if (windEnabled) {
      const interval = setInterval(applyWindForce, 50);
      return () => clearInterval(interval);
    }
  }, [windEnabled, windForce, windTurbulence]);
  
  // Reset to defaults
  const resetToDefaults = () => {
    setGravity({ x: 0, y: -9.81, z: 0 });
    setAirDamping(0.99);
    setGroundBounce(0.8);
    setGroundFriction(0.95);
    setTimeScale(1);
    setWindEnabled(false);
    setWindForce({ x: 0, y: 0, z: 0 });
    setWindTurbulence(0);
    
    // Apply defaults to engine
    if (engine) {
      engine.gravity.x = 0;
      engine.gravity.y = -9.81;
      engine.gravity.z = 0;
      engine.groundBounce = 0.8;
      engine.groundFriction = 0.95;
    }
  };
  
  // Preset environments
  const applyPreset = (preset: string) => {
    switch (preset) {
      case 'earth':
        setGravity({ x: 0, y: -9.81, z: 0 });
        setAirDamping(0.99);
        break;
      case 'moon':
        setGravity({ x: 0, y: -1.62, z: 0 });
        setAirDamping(1); // No air resistance
        break;
      case 'mars':
        setGravity({ x: 0, y: -3.71, z: 0 });
        setAirDamping(0.995);
        break;
      case 'space':
        setGravity({ x: 0, y: 0, z: 0 });
        setAirDamping(1);
        break;
      case 'underwater':
        setGravity({ x: 0, y: -4.9, z: 0 });
        setAirDamping(0.85);
        setGroundBounce(0.3);
        break;
      case 'windy':
        setWindEnabled(true);
        setWindForce({ x: 5, y: 0, z: 0 });
        setWindTurbulence(2);
        break;
    }
    applyGravity();
    applyGroundProperties();
  };
  
  if (!showEnvironmental) {
    return null;
  }
  
  // Dynamic positioning based on Object Properties panel visibility
  const panelStyle = {
    left: showObjectProperties ? '500px' : '220px'  // 220px for toolbar width, 500px for toolbar + properties panel
  };
  
  return (
    <div className={`environmental-panel ${collapsed ? 'collapsed' : ''}`} style={panelStyle}>
      <div className="panel-header">
        <div onClick={() => setCollapsed(!collapsed)} style={{ display: 'flex', alignItems: 'center', flex: 1, cursor: 'pointer' }}>
          <h3>Environment</h3>
          <span className="collapse-icon" style={{ marginLeft: 'auto', marginRight: '10px' }}>{collapsed ? '▶' : '▼'}</span>
        </div>
        <button onClick={toggleEnvironmental} className="minimize-btn" title="Minimize to toolbar">−</button>
      </div>
      {!collapsed && (
      <div className="panel-content">
      
      <div className="properties-section">
        <h4>Presets</h4>
        <div className="preset-buttons">
          <button onClick={() => applyPreset('earth')} className="preset-btn">Earth</button>
          <button onClick={() => applyPreset('moon')} className="preset-btn">Moon</button>
          <button onClick={() => applyPreset('mars')} className="preset-btn">Mars</button>
          <button onClick={() => applyPreset('space')} className="preset-btn">Space</button>
          <button onClick={() => applyPreset('underwater')} className="preset-btn">Water</button>
          <button onClick={() => applyPreset('windy')} className="preset-btn">Windy</button>
        </div>
      </div>
      
      <div className="properties-section">
        <h4>Gravity</h4>
        <div className="vector-inputs">
          <div className="property-field compact">
            <label>X</label>
            <input
              type="number"
              value={gravity.x}
              onChange={(e) => setGravity(prev => ({ ...prev, x: parseFloat(e.target.value) || 0 }))}
              step="0.1"
            />
          </div>
          <div className="property-field compact">
            <label>Y</label>
            <input
              type="number"
              value={gravity.y}
              onChange={(e) => setGravity(prev => ({ ...prev, y: parseFloat(e.target.value) || 0 }))}
              step="0.1"
            />
          </div>
          <div className="property-field compact">
            <label>Z</label>
            <input
              type="number"
              value={gravity.z}
              onChange={(e) => setGravity(prev => ({ ...prev, z: parseFloat(e.target.value) || 0 }))}
              step="0.1"
            />
          </div>
        </div>
        <button onClick={applyGravity} className="btn-small btn-primary">
          Apply Gravity
        </button>
      </div>
      
      <div className="properties-section">
        <h4>Ground Properties</h4>
        <div className="property-field">
          <label>Bounce (0-1)</label>
          <input
            type="number"
            value={groundBounce}
            onChange={(e) => setGroundBounce(parseFloat(e.target.value) || 0)}
            min="0"
            max="1"
            step="0.05"
          />
        </div>
        <div className="property-field">
          <label>Friction (0-1)</label>
          <input
            type="number"
            value={groundFriction}
            onChange={(e) => setGroundFriction(parseFloat(e.target.value) || 0)}
            min="0"
            max="1"
            step="0.05"
          />
        </div>
        <button onClick={applyGroundProperties} className="btn-small btn-primary">
          Apply Ground
        </button>
      </div>
      
      <div className="properties-section">
        <h4>Wind Forces</h4>
        <div className="property-field checkbox-field">
          <label>
            <input
              type="checkbox"
              checked={windEnabled}
              onChange={(e) => setWindEnabled(e.target.checked)}
            />
            Enable Wind
          </label>
        </div>
        {windEnabled && (
          <>
            <div className="vector-inputs">
              <div className="property-field compact">
                <label>X</label>
                <input
                  type="number"
                  value={windForce.x}
                  onChange={(e) => setWindForce(prev => ({ ...prev, x: parseFloat(e.target.value) || 0 }))}
                  step="0.5"
                />
              </div>
              <div className="property-field compact">
                <label>Y</label>
                <input
                  type="number"
                  value={windForce.y}
                  onChange={(e) => setWindForce(prev => ({ ...prev, y: parseFloat(e.target.value) || 0 }))}
                  step="0.5"
                />
              </div>
              <div className="property-field compact">
                <label>Z</label>
                <input
                  type="number"
                  value={windForce.z}
                  onChange={(e) => setWindForce(prev => ({ ...prev, z: parseFloat(e.target.value) || 0 }))}
                  step="0.5"
                />
              </div>
            </div>
            <div className="property-field">
              <label>Turbulence</label>
              <input
                type="range"
                value={windTurbulence}
                onChange={(e) => setWindTurbulence(parseFloat(e.target.value))}
                min="0"
                max="10"
                step="0.5"
              />
              <span className="range-value">{windTurbulence}</span>
            </div>
          </>
        )}
      </div>
      
      <div className="properties-section">
        <h4>Simulation</h4>
        <div className="property-field">
          <label>Time Scale</label>
          <input
            type="range"
            value={timeScale}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              setTimeScale(value);
              applyTimeScale();
            }}
            min="0"
            max="2"
            step="0.1"
          />
          <span className="range-value">{timeScale.toFixed(1)}x</span>
        </div>
        <div className="property-field">
          <label>Air Damping</label>
          <input
            type="number"
            value={airDamping}
            onChange={(e) => setAirDamping(parseFloat(e.target.value) || 0)}
            min="0.8"
            max="1"
            step="0.01"
          />
        </div>
      </div>
      
      <div className="properties-section">
        <button onClick={resetToDefaults} className="btn-small btn-secondary full-width">
          Reset to Defaults
        </button>
      </div>
      </div>
      )}
    </div>
  );
}