import { useState, useEffect } from 'react';
import { useEngineStore } from '../../stores/useEngineStore';
import { Particle } from '../../core/primitives/Particle';
import { Vector3 } from '../../core/physics/Vector3';
import { CompositeFactory } from '../../core/primitives/Composite';
import { DynamicType } from '../../core/dynamics/DynamicBehavior';
import './ToolbarIntegrated.css';

export function ToolbarIntegrated() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    create: true,
    properties: false,
    dynamics: false,
    environment: false
  });
  
  // Dynamics state
  const [selectedDynamicType, setSelectedDynamicType] = useState<DynamicType>(DynamicType.OSCILLATOR);
  const [dynamicAmplitude, setDynamicAmplitude] = useState(1);
  const [dynamicFrequency, setDynamicFrequency] = useState(1);
  const [dynamicStrength, setDynamicStrength] = useState(1);
  const [dynamicRadius, setDynamicRadius] = useState(10);
  
  const [clothSegmentsX, setClothSegmentsX] = useState(10);
  const [clothSegmentsY, setClothSegmentsY] = useState(10);
  const [, forceUpdate] = useState({});
  
  // Environmental properties
  const [gravity, setGravity] = useState({ x: 0, y: -9.81, z: 0 });
  const [airDamping, setAirDamping] = useState(0.99);
  const [groundBounce, setGroundBounce] = useState(0.8);
  const [groundFriction, setGroundFriction] = useState(0.95);
  const [timeScale, setTimeScale] = useState(1);
  
  const { 
    engine,
    composites,
    addParticle, 
    addComposite, 
    selectedParticleId,
    selectedParticleIds,
    isCreatingConstraint,
    cancelConstraintCreation,
    isEditMode,
    showGrid,
    showGround,
    showBoundingBoxes,
    toggleGrid,
    toggleGround,
    toggleBoundingBoxes,
    updateTimeStep,
    updateIterations,
    clearAll,
    resetSimulation,
    addDynamicBehavior,
    removeDynamicBehavior,
    clearDynamicBehaviors,
    getDynamicBehaviors
  } = useEngineStore();

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

  // Auto-expand properties section when particles are selected
  useEffect(() => {
    const hasAnySelection = selectedParticleId || selectedParticleIds.size > 0;
    if (hasAnySelection && !expandedSections.properties) {
      setExpandedSections(prev => ({
        ...prev,
        properties: true
      }));
    }
  }, [selectedParticleId, selectedParticleIds.size]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const addSingleParticle = () => {
    const position = {
      x: Math.random() * 10 - 5,
      y: 10,
      z: Math.random() * 10 - 5
    };
    
    const particle = new Particle({
      position: position,
      mass: 1,
      radius: 0.5,
      damping: 0.99,
      fixed: false,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
    });
    addParticle(particle);
  };

  const addRope = () => {
    const rope = CompositeFactory.createRope(
      new Vector3(-5, 10, 0),
      new Vector3(5, 10, 0),
      10,
      0.5,
      0.9
    );
    addComposite(rope);
  };

  const addCloth = () => {
    const cloth = CompositeFactory.createCloth(
      10,
      10,
      clothSegmentsX,
      clothSegmentsY,
      new Vector3(0, 10, 0),
      0.1,
      0.95
    );
    addComposite(cloth);
  };

  const addBox = () => {
    const box = CompositeFactory.createBox(
      new Vector3(5, 5, 5),
      new Vector3(0, 10, 0),
      1,
      0.99
    );
    addComposite(box);
  };

  const addSoftBall = () => {
    const ball = CompositeFactory.createSoftBall(
      new Vector3(0, 10, 0),
      5,
      12,
      0.5,
      0.7
    );
    addComposite(ball);
  };

  const addBridge = () => {
    const bridge = CompositeFactory.createBridge(
      new Vector3(-15, 10, 0),
      new Vector3(15, 10, 0),
      12,
      8,
      1,
      0.95
    );
    addComposite(bridge);
  };

  const addChain = () => {
    const chain = CompositeFactory.createChain(
      new Vector3(0, 15, 0),
      new Vector3(0, 5, 0),
      8,
      1.5,
      2,
      0.99
    );
    addComposite(chain);
  };

  const addPendulum = () => {
    const pendulum = CompositeFactory.createPendulum(
      new Vector3(0, 15, 0),
      10,
      3,
      2,
      1
    );
    addComposite(pendulum);
  };

  const addWheel = () => {
    const wheel = CompositeFactory.createWheel(
      new Vector3(0, 10, 0),
      5,
      12,
      1,
      0.95
    );
    addComposite(wheel);
  };

  // Apply environmental changes
  const applyGravity = () => {
    if (engine) {
      engine.gravity.x = gravity.x;
      engine.gravity.y = gravity.y;
      engine.gravity.z = gravity.z;
    }
  };

  const applyGroundProperties = () => {
    if (engine) {
      engine.groundBounce = groundBounce;
      engine.groundFriction = groundFriction;
    }
  };

  const applyTimeScale = () => {
    if (engine && engine.timeScale !== undefined) {
      engine.timeScale = timeScale;
    }
  };

  // Get selected particles info - combine both single and multi-selection
  const allSelectedIds = new Set(selectedParticleIds);
  if (selectedParticleId) {
    allSelectedIds.add(selectedParticleId);
  }
  
  const selectedParticles = engine ? Array.from(allSelectedIds).map(id => 
    engine.getParticles().find(p => p.id === id)
  ).filter(Boolean) : [];
  const hasSelection = selectedParticles.length > 0;
  
  // Calculate average properties for selected particles
  const getAverageProperty = (prop: string) => {
    if (!hasSelection) return 0;
    const validParticles = selectedParticles.filter(p => p !== undefined);
    if (validParticles.length === 0) return 0;
    const sum = validParticles.reduce((acc, p) => acc + ((p as any)[prop] || 0), 0);
    return sum / validParticles.length;
  };

  return (
    <div className={`toolbar-integrated ${collapsed ? 'collapsed' : ''}`}>
      <div className="toolbar-top-header" onClick={() => setCollapsed(!collapsed)}>
        <span className="collapse-icon">{collapsed ? '▶' : '▼'}</span>
        <span className="toolbar-title">TOOLS</span>
      </div>
      {!collapsed && (
      <div className="panel-content">
        
        {/* Create Section */}
        <div className="collapsible-section">
          <div className="section-header" onClick={() => toggleSection('create')}>
            <span className="section-icon">{expandedSections.create ? '▼' : '▶'}</span>
            <span className="section-title">CREATE</span>
          </div>
          {expandedSections.create && (
            <div className="section-content">
              <button onClick={addSingleParticle} className="tool-btn">
                Particle
              </button>
              <button onClick={addRope} className="tool-btn">
                Rope
              </button>
              <div className="tool-with-controls">
                <button onClick={addCloth} className="tool-btn">
                  Cloth
                </button>
                <div className="inline-controls">
                  <label>X:</label>
                  <input 
                    type="number" 
                    min="2" 
                    max="50" 
                    value={clothSegmentsX}
                    onChange={(e) => setClothSegmentsX(Number(e.target.value))}
                  />
                  <label>Y:</label>
                  <input 
                    type="number" 
                    min="2" 
                    max="50" 
                    value={clothSegmentsY}
                    onChange={(e) => setClothSegmentsY(Number(e.target.value))}
                  />
                </div>
              </div>
              <button onClick={addBox} className="tool-btn">
                Box
              </button>
              <button onClick={addSoftBall} className="tool-btn">
                Soft Ball
              </button>
              <button onClick={addBridge} className="tool-btn">
                Bridge
              </button>
              <button onClick={addChain} className="tool-btn">
                Chain
              </button>
              <button onClick={addPendulum} className="tool-btn">
                Pendulum
              </button>
              <button onClick={addWheel} className="tool-btn">
                Wheel
              </button>
              {isCreatingConstraint && (
                <button onClick={cancelConstraintCreation} className="tool-btn cancel">
                  Cancel Constraint
                </button>
              )}
            </div>
          )}
        </div>

        {/* Object Properties Section */}
        <div className="collapsible-section">
          <div className="section-header" onClick={() => toggleSection('properties')}>
            <span className="section-icon">{expandedSections.properties ? '▼' : '▶'}</span>
            <span className="section-title">OBJECT PROPERTIES</span>
            {hasSelection && <span className="selection-badge">{selectedParticles.length}</span>}
          </div>
          {expandedSections.properties && (
            <div className="section-content">
              {hasSelection ? (
                <>
                  <div className="property-group">
                    <label>Mass</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={getAverageProperty('mass').toFixed(1)}
                      onChange={(e) => {
                        selectedParticles.forEach(p => {
                          if (p) p.mass = Number(e.target.value);
                        });
                        forceUpdate({});
                      }}
                    />
                  </div>
                  <div className="property-group">
                    <label>Radius</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={getAverageProperty('radius').toFixed(1)}
                      onChange={(e) => {
                        selectedParticles.forEach(p => {
                          if (p) p.radius = Number(e.target.value);
                        });
                        forceUpdate({});
                      }}
                    />
                  </div>
                  <div className="property-group">
                    <label>Damping</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      max="1"
                      value={getAverageProperty('damping').toFixed(2)}
                      onChange={(e) => {
                        selectedParticles.forEach(p => {
                          if (p) p.damping = Number(e.target.value);
                        });
                        forceUpdate({});
                      }}
                    />
                  </div>
                  <div className="property-group color-group">
                    <label>Color</label>
                    <div className="color-input-wrapper">
                      <div 
                        className="color-square"
                        style={{ 
                          backgroundColor: selectedParticles.length === 1 && selectedParticles[0]?.color 
                            ? selectedParticles[0].color 
                            : selectedParticles.length > 1 
                              ? '#808080' 
                              : '#4dabf7'
                        }}
                        onClick={() => {
                          const colorInput = document.getElementById('particle-color-input');
                          if (colorInput) colorInput.click();
                        }}
                      />
                      <input 
                        id="particle-color-input"
                        type="color"
                        className="hidden-color-input"
                        value={selectedParticles.length === 1 && selectedParticles[0]?.color ? selectedParticles[0].color : '#4dabf7'}
                        onChange={(e) => {
                          selectedParticles.forEach(p => {
                            if (p) p.color = e.target.value;
                          });
                          // Force re-render to update the color square
                          forceUpdate({});
                        }}
                      />
                      {selectedParticles.length > 1 && (
                        <span className="multi-select-label">Multiple</span>
                      )}
                    </div>
                  </div>
                  <div className="property-group">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={selectedParticles.every(p => p.fixed)}
                        onChange={(e) => {
                          selectedParticles.forEach(p => {
                            if (p) p.fixed = e.target.checked;
                          });
                          forceUpdate({});
                        }}
                      />
                      Fixed
                    </label>
                  </div>
                </>
              ) : (
                <div className="no-selection">No particles selected</div>
              )}
            </div>
          )}
        </div>

        {/* Dynamics Section */}
        <div className="collapsible-section">
          <div className="section-header" onClick={() => toggleSection('dynamics')}>
            <span className="section-icon">{expandedSections.dynamics ? '▼' : '▶'}</span>
            <span className="section-title">DYNAMICS</span>
            {hasSelection && <span className="selection-badge">✨</span>}
          </div>
          {expandedSections.dynamics && (
            <div className="section-content">
              {hasSelection ? (
                <>
                  <div className="property-group">
                    <label>Behavior Type</label>
                    <select 
                      value={selectedDynamicType}
                      onChange={(e) => setSelectedDynamicType(e.target.value as DynamicType)}
                      className="dynamic-select"
                    >
                      <option value={DynamicType.OSCILLATOR}>Oscillator</option>
                      <option value={DynamicType.PULSAR}>Pulsar</option>
                      <option value={DynamicType.ATTRACTOR}>Attractor</option>
                      <option value={DynamicType.REPULSOR}>Repulsor</option>
                      <option value={DynamicType.VORTEX}>Vortex</option>
                      <option value={DynamicType.NOISE}>Noise</option>
                      <option value={DynamicType.WAVE}>Wave</option>
                    </select>
                  </div>
                  
                  <div className="property-group">
                    <label>Amplitude</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={dynamicAmplitude}
                      onChange={(e) => setDynamicAmplitude(Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="property-group">
                    <label>Frequency</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={dynamicFrequency}
                      onChange={(e) => setDynamicFrequency(Number(e.target.value))}
                    />
                  </div>
                  
                  {(selectedDynamicType === DynamicType.ATTRACTOR || 
                    selectedDynamicType === DynamicType.REPULSOR ||
                    selectedDynamicType === DynamicType.VORTEX) && (
                    <>
                      <div className="property-group">
                        <label>Strength</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={dynamicStrength}
                          onChange={(e) => setDynamicStrength(Number(e.target.value))}
                        />
                      </div>
                      <div className="property-group">
                        <label>Radius</label>
                        <input 
                          type="number" 
                          step="1"
                          value={dynamicRadius}
                          onChange={(e) => setDynamicRadius(Number(e.target.value))}
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="button-group">
                    <button 
                      onClick={() => {
                        selectedParticles.forEach(particle => {
                          if (particle) {
                            const behavior = {
                              type: selectedDynamicType,
                              enabled: true,
                              amplitude: dynamicAmplitude,
                              frequency: dynamicFrequency,
                              phase: 0,
                              strength: dynamicStrength,
                              radius: dynamicRadius,
                              axis: new Vector3(0, 1, 0),
                              center: particle.position.clone()
                            };
                            addDynamicBehavior(particle.id, behavior);
                          }
                        });
                        forceUpdate({});
                      }}
                      className="tool-btn add-btn"
                    >
                      Add Behavior
                    </button>
                    
                    <button 
                      onClick={() => {
                        selectedParticles.forEach(particle => {
                          if (particle) {
                            removeDynamicBehavior(particle.id, selectedDynamicType);
                          }
                        });
                        forceUpdate({});
                      }}
                      className="tool-btn remove-btn"
                    >
                      Remove
                    </button>
                    
                    <button 
                      onClick={() => {
                        selectedParticles.forEach(particle => {
                          if (particle) {
                            clearDynamicBehaviors(particle.id);
                          }
                        });
                        forceUpdate({});
                      }}
                      className="tool-btn clear-btn"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  {/* Show active behaviors */}
                  {selectedParticles.length === 1 && selectedParticles[0] && (
                    <div className="active-behaviors">
                      <label>Active Behaviors:</label>
                      <div className="behavior-list">
                        {getDynamicBehaviors(selectedParticles[0].id).map((behavior, idx) => (
                          <div key={idx} className="behavior-tag">
                            {behavior.type}
                          </div>
                        ))}
                        {getDynamicBehaviors(selectedParticles[0].id).length === 0 && (
                          <div className="no-behaviors">None</div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-selection">Select particles to add dynamics</div>
              )}
            </div>
          )}
        </div>

        {/* Environment Section */}
        <div className="collapsible-section">
          <div className="section-header" onClick={() => toggleSection('environment')}>
            <span className="section-icon">{expandedSections.environment ? '▼' : '▶'}</span>
            <span className="section-title">ENVIRONMENT</span>
          </div>
          {expandedSections.environment && (
            <div className="section-content">
              <div className="property-group">
                <label>Gravity</label>
                <div className="vector-inputs">
                  <input 
                    type="number" 
                    step="0.1"
                    value={gravity.x.toFixed(1)}
                    onChange={(e) => setGravity({...gravity, x: Number(e.target.value)})}
                    onBlur={applyGravity}
                  />
                  <input 
                    type="number" 
                    step="0.1"
                    value={gravity.y.toFixed(1)}
                    onChange={(e) => setGravity({...gravity, y: Number(e.target.value)})}
                    onBlur={applyGravity}
                  />
                  <input 
                    type="number" 
                    step="0.1"
                    value={gravity.z.toFixed(1)}
                    onChange={(e) => setGravity({...gravity, z: Number(e.target.value)})}
                    onBlur={applyGravity}
                  />
                </div>
              </div>
              <div className="property-group">
                <label>Time Scale</label>
                <input 
                  type="number" 
                  step="0.1"
                  min="0"
                  max="2"
                  value={timeScale.toFixed(1)}
                  onChange={(e) => setTimeScale(Number(e.target.value))}
                  onBlur={applyTimeScale}
                />
              </div>
              <div className="property-group">
                <label>Ground Bounce</label>
                <input 
                  type="number" 
                  step="0.05"
                  min="0"
                  max="1"
                  value={groundBounce.toFixed(2)}
                  onChange={(e) => setGroundBounce(Number(e.target.value))}
                  onBlur={applyGroundProperties}
                />
              </div>
              <div className="property-group">
                <label>Ground Friction</label>
                <input 
                  type="number" 
                  step="0.05"
                  min="0"
                  max="1"
                  value={groundFriction.toFixed(2)}
                  onChange={(e) => setGroundFriction(Number(e.target.value))}
                  onBlur={applyGroundProperties}
                />
              </div>
              <div className="property-group">
                <label>Time Step</label>
                <input 
                  type="number" 
                  step="0.001"
                  min="0.001"
                  max="0.1"
                  value={engine?.config?.timeStep?.toFixed(3) || '0.016'}
                  onChange={(e) => updateTimeStep(Number(e.target.value))}
                />
              </div>
              <div className="property-group">
                <label>Iterations</label>
                <input 
                  type="number" 
                  step="1"
                  min="1"
                  max="10"
                  value={engine?.config?.iterations || 3}
                  onChange={(e) => updateIterations(Number(e.target.value))}
                />
              </div>
              <div className="property-group">
                <label>Global Damping</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  max="1"
                  value={engine?.config?.damping?.toFixed(2) || '0.99'}
                  onChange={(e) => {
                    if (engine) engine.updateConfig({ damping: Number(e.target.value) });
                    forceUpdate({});
                  }}
                />
              </div>
              <div className="property-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={showGrid}
                    onChange={toggleGrid}
                  />
                  Show Grid
                </label>
              </div>
              <div className="property-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={showGround}
                    onChange={toggleGround}
                  />
                  Show Ground
                </label>
              </div>
              <div className="property-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={showBoundingBoxes}
                    onChange={toggleBoundingBoxes}
                  />
                  Composite Bounds
                </label>
              </div>
              <div style={{marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #3a3a3a'}}>
                <button 
                  onClick={() => resetSimulation()} 
                  className="tool-btn"
                  style={{marginBottom: '4px', width: '100%'}}
                >
                  Reset Scene
                </button>
                <button 
                  onClick={() => clearAll()} 
                  className="tool-btn"
                  style={{background: '#5a3030', borderColor: '#6a4040', width: '100%'}}
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Statistics Section - Always at bottom */}
        <div className="stats-section">
          <div className="section-header">
            <span className="section-title">STATISTICS</span>
          </div>
          <div className="stats-content">
            <div className="stat-item">
              <span className="stat-label">Particles:</span>
              <span className="stat-value">{engine ? engine.getParticles().length : 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Constraints:</span>
              <span className="stat-value">{engine ? engine.getConstraints().length : 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Composites:</span>
              <span className="stat-value">{composites ? composites.size : 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Selected:</span>
              <span className="stat-value">{allSelectedIds.size}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Mode:</span>
              <span className="stat-value">{isEditMode ? 'EDIT' : 'SIM'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">FPS:</span>
              <span className="stat-value">60</span>
            </div>
          </div>
        </div>
        
      </div>
      )}
    </div>
  );
}