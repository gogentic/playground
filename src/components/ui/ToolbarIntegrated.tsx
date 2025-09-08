import { useState, useEffect, useMemo } from 'react';
import { useEngineStore } from '../../stores/useEngineStore';
import { Particle } from '../../core/primitives/Particle';
import { Vector3 } from '../../core/physics/Vector3';
import { ObjectRegistry } from '../../core/factories/ObjectRegistry';
import { DynamicType } from '../../core/dynamics/DynamicBehavior';
import './ToolbarIntegrated.css';

export function ToolbarIntegrated() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    create: true,
    edit: false,
    dynamics: false,
    environment: false
  });
  
  // Dynamics state
  const [selectedDynamicType, setSelectedDynamicType] = useState<DynamicType>(DynamicType.OSCILLATOR);
  const [dynamicAmplitude, setDynamicAmplitude] = useState(1);
  const [dynamicFrequency, setDynamicFrequency] = useState(1);
  const [dynamicStrength, setDynamicStrength] = useState(1);
  const [dynamicRadius, setDynamicRadius] = useState(10);
  const [oscillatorAxis, setOscillatorAxis] = useState<'x' | 'y' | 'z'>('y');
  
  // Object template controls state
  const [templateParams, setTemplateParams] = useState<Record<string, any>>({
    clothSegmentsX: 10,
    clothSegmentsY: 10
  });
  const [, forceUpdate] = useState({});
  
  // Initialize object registry
  const objectRegistry = useMemo(() => new ObjectRegistry(), []);
  
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
    getDynamicBehaviors,
    deleteSelectedParticles,
    clearSelection,
    selectAllParticles,
    updateParticleProperties,
    transformMode,
    setTransformMode,
    // Global visual settings
    particleRadiusMultiplier,
    showParticles,
    showTransformGizmo,
    backgroundColor,
    gridColor,
    showFog,
    fogDensity,
    fogColor,
    showSceneLight,
    setParticleRadiusMultiplier,
    toggleParticles,
    toggleTransformGizmo,
    setBackgroundColor,
    setGridColor,
    toggleFog,
    setFogDensity,
    setFogColor,
    toggleSceneLight
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


  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Generic object creation handler
  const createObject = (templateId: string) => {
    try {
      // Get custom params for this template (like cloth segments)
      const customParams: Record<string, any> = {};
      const template = objectRegistry.getTemplate(templateId);
      
      if (template?.controls) {
        template.controls.forEach(control => {
          const paramKey = `${templateId}_${control.param}`;
          if (templateParams[paramKey] !== undefined) {
            customParams[control.param] = templateParams[paramKey];
          }
        });
      }
      
      // Special handling for cloth segments (backwards compatibility)
      if (templateId === 'cloth') {
        customParams.segmentsX = templateParams.clothSegmentsX || 10;
        customParams.segmentsY = templateParams.clothSegmentsY || 10;
      }
      
      const object = objectRegistry.createObject(templateId, customParams);
      
      // Add to engine based on type
      if (object instanceof Particle) {
        addParticle(object);
      } else {
        addComposite(object);
      }
    } catch (error) {
      console.error(`Failed to create object: ${templateId}`, error);
    }
  };
  
  // Update template parameter
  const updateTemplateParam = (paramKey: string, value: any) => {
    setTemplateParams(prev => ({
      ...prev,
      [paramKey]: value
    }));
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
      <div className="toolbar-collapse-btn" onClick={() => setCollapsed(!collapsed)}>
        <span className="collapse-icon">{collapsed ? '▶' : '◀'}</span>
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
              {objectRegistry.getCategories().map(category => (
                <div key={category.id} className="object-category">
                  {category.objects.map(template => (
                    <div key={template.id}>
                      {template.controls ? (
                        <div className="tool-with-controls">
                          <button 
                            onClick={() => createObject(template.id)} 
                            className="tool-btn"
                            title={template.description}
                          >
                            {template.name}
                          </button>
                          <div className="inline-controls">
                            {template.controls.map(control => (
                              <div key={control.param} className="control-group">
                                <label>{control.label}:</label>
                                <input 
                                  type={control.type}
                                  min={control.min}
                                  max={control.max}
                                  value={templateParams[`${template.id}_${control.param}`] || 
                                         (template.id === 'cloth' && control.param === 'segmentsX' ? templateParams.clothSegmentsX : 
                                          template.id === 'cloth' && control.param === 'segmentsY' ? templateParams.clothSegmentsY :
                                          template.defaultParams[control.param])}
                                  onChange={(e) => {
                                    const value = control.type === 'number' ? Number(e.target.value) : e.target.value;
                                    updateTemplateParam(`${template.id}_${control.param}`, value);
                                    // Backwards compatibility for cloth
                                    if (template.id === 'cloth') {
                                      if (control.param === 'segmentsX') {
                                        updateTemplateParam('clothSegmentsX', value);
                                      } else if (control.param === 'segmentsY') {
                                        updateTemplateParam('clothSegmentsY', value);
                                      }
                                    }
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => createObject(template.id)} 
                          className="tool-btn"
                          title={template.description}
                        >
                          {template.name}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Section */}
        <div className="collapsible-section">
          <div className="section-header" onClick={() => toggleSection('edit')}>
            <span className="section-icon">{expandedSections.edit ? '▼' : '▶'}</span>
            <span className="section-title">EDIT</span>
          </div>
          {expandedSections.edit && (
            <div className="section-content">
              {/* Transform Mode Controls */}
              <div className="transform-modes">
                <div className="mode-label">Transform Mode</div>
                <div className="mode-buttons">
                  <button 
                    onClick={() => setTransformMode('translate')}
                    className={`mode-btn ${transformMode === 'translate' ? 'active' : ''}`}
                    title="Translate (T)"
                  >
                    <span className="mode-icon">↔</span>
                    <span className="mode-text">Move</span>
                  </button>
                  <button 
                    onClick={() => setTransformMode('rotate')}
                    className={`mode-btn ${transformMode === 'rotate' ? 'active' : ''}`}
                    title="Rotate (R)"
                  >
                    <span className="mode-icon">↻</span>
                    <span className="mode-text">Rotate</span>
                  </button>
                  <button 
                    onClick={() => setTransformMode('scale')}
                    className={`mode-btn ${transformMode === 'scale' ? 'active' : ''}`}
                    title="Scale (S)"
                  >
                    <span className="mode-icon">⬚</span>
                    <span className="mode-text">Scale</span>
                  </button>
                </div>
              </div>
              
              <div className="edit-separator"></div>
              
              {/* Selection Actions */}
              <div className="edit-actions">
                <button 
                  onClick={() => selectAllParticles()}
                  className="tool-btn"
                  disabled={!isEditMode}
                  title="Select All (Ctrl+A)"
                >
                  Select All
                </button>
                <button 
                  onClick={() => clearSelection()}
                  className="tool-btn"
                  disabled={!hasSelection}
                  title="Clear Selection (Esc)"
                >
                  Clear Selection
                </button>
              </div>
              
              {/* Object Actions */}
              <div className="edit-actions">
                <button 
                  onClick={() => {
                    if (isEditMode && hasSelection) {
                      // Duplicate selected particles
                      selectedParticles.forEach(p => {
                        if (p) {
                          const newParticle = new Particle({
                            position: { x: p.position.x + 2, y: p.position.y + 2, z: p.position.z + 2 },
                            mass: p.mass,
                            radius: p.radius,
                            damping: p.damping,
                            fixed: p.fixed,
                            color: p.color
                          });
                          addParticle(newParticle);
                        }
                      });
                    }
                  }}
                  className="tool-btn"
                  disabled={!hasSelection || !isEditMode}
                  title="Duplicate (Ctrl+D)"
                >
                  Duplicate
                </button>
                <button 
                  onClick={() => deleteSelectedParticles()}
                  className="tool-btn delete-btn"
                  disabled={!hasSelection || !isEditMode}
                  title="Delete (Delete/Backspace)"
                >
                  Delete
                </button>
              </div>
              
              {isCreatingConstraint && (
                <button onClick={cancelConstraintCreation} className="tool-btn cancel">
                  Cancel Constraint
                </button>
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
                      step="0.01"
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
                  
                  {(selectedDynamicType === DynamicType.OSCILLATOR || 
                    selectedDynamicType === DynamicType.WAVE || 
                    selectedDynamicType === DynamicType.VORTEX) && (
                    <div className="property-group">
                      <label>Axis</label>
                      <select 
                        value={oscillatorAxis}
                        onChange={(e) => setOscillatorAxis(e.target.value as 'x' | 'y' | 'z')}
                        className="dynamic-select"
                      >
                        <option value="x">X Axis</option>
                        <option value="y">Y Axis</option>
                        <option value="z">Z Axis</option>
                      </select>
                    </div>
                  )}
                  
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
                            const axisVector = oscillatorAxis === 'x' ? new Vector3(1, 0, 0) :
                                              oscillatorAxis === 'y' ? new Vector3(0, 1, 0) :
                                              new Vector3(0, 0, 1);
                            const behavior = {
                              type: selectedDynamicType,
                              enabled: true,
                              amplitude: dynamicAmplitude,
                              frequency: dynamicFrequency,
                              phase: 0,
                              strength: dynamicStrength,
                              radius: dynamicRadius,
                              axis: axisVector,
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
              
              {/* Global Visual Settings */}
              <div style={{marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #3a3a3a'}}>
                <div style={{fontSize: '10px', color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px'}}>Globals</div>
                
                {/* Particle Settings */}
                <div className="property-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={showParticles}
                      onChange={toggleParticles}
                    />
                    Show Particles
                  </label>
                </div>
                
                <div className="property-group">
                  <label>Particle Size</label>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={particleRadiusMultiplier}
                      onChange={(e) => setParticleRadiusMultiplier(Number(e.target.value))}
                      style={{flex: 1}}
                    />
                    <span style={{fontSize: '10px', color: '#888', minWidth: '30px'}}>{particleRadiusMultiplier.toFixed(1)}x</span>
                  </div>
                </div>
                
                {/* Transform Settings */}
                <div className="property-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={showTransformGizmo}
                      onChange={toggleTransformGizmo}
                    />
                    Transform Arrows
                  </label>
                </div>
                
                {/* Scene Settings */}
                <div className="property-group">
                  <label>Background</label>
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    style={{width: '60px', height: '24px'}}
                  />
                </div>
                
                <div className="property-group">
                  <label>Grid Color</label>
                  <input
                    type="color"
                    value={gridColor}
                    onChange={(e) => setGridColor(e.target.value)}
                    style={{width: '60px', height: '24px'}}
                  />
                </div>
                
                <div className="property-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={showSceneLight}
                      onChange={toggleSceneLight}
                    />
                    Scene Lighting
                  </label>
                </div>
                
                {/* Fog Settings */}
                <div className="property-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={showFog}
                      onChange={toggleFog}
                    />
                    Enable Fog
                  </label>
                </div>
                
                {showFog && (
                  <>
                    <div className="property-group">
                      <label>Fog Density</label>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <input
                          type="range"
                          min="0.001"
                          max="0.1"
                          step="0.001"
                          value={fogDensity}
                          onChange={(e) => setFogDensity(Number(e.target.value))}
                          style={{flex: 1}}
                        />
                        <span style={{fontSize: '10px', color: '#888', minWidth: '40px'}}>{fogDensity.toFixed(3)}</span>
                      </div>
                    </div>
                    
                    <div className="property-group">
                      <label>Fog Color</label>
                      <input
                        type="color"
                        value={fogColor}
                        onChange={(e) => setFogColor(e.target.value)}
                        style={{width: '60px', height: '24px'}}
                      />
                    </div>
                  </>
                )}
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
        
        {/* Properties Section - Always visible */}
        <div className="properties-section">
          <div className="section-header">
            <span className="section-title">PROPERTIES</span>
            {hasSelection && <span className="selection-badge">{selectedParticles.length}</span>}
          </div>
          <div className="properties-content">
              {hasSelection ? (
                <>
                  <div className="property-group">
                    <label>Mass</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={getAverageProperty('mass').toFixed(1)}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        selectedParticles.forEach(p => {
                          if (p) {
                            updateParticleProperties(p.id, { mass: value });
                          }
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
                        const value = Number(e.target.value);
                        selectedParticles.forEach(p => {
                          if (p) {
                            updateParticleProperties(p.id, { radius: value });
                          }
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
                        const value = Number(e.target.value);
                        selectedParticles.forEach(p => {
                          if (p) {
                            updateParticleProperties(p.id, { damping: value });
                          }
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
                            if (p) {
                              updateParticleProperties(p.id, { color: e.target.value });
                            }
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
                        checked={selectedParticles.every(p => p && p.fixed)}
                        onChange={(e) => {
                          const value = e.target.checked;
                          selectedParticles.forEach(p => {
                            if (p) {
                              updateParticleProperties(p.id, { fixed: value });
                            }
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