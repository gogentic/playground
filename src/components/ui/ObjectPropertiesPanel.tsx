import { useState, useEffect } from 'react';
import { useEngineStore } from '../../stores/useEngineStore';
import { Vector3 } from '../../core/physics/Vector3';
import './ObjectPropertiesPanel.css';

export function ObjectPropertiesPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const showObjectProperties = useEngineStore((state) => state.showObjectProperties);
  const toggleObjectProperties = useEngineStore((state) => state.toggleObjectProperties);
  const selectedParticleIds = useEngineStore((state) => state.selectedParticleIds);
  const selectedCompositeId = useEngineStore((state) => state.selectedCompositeId);
  const composites = useEngineStore((state) => state.composites);
  const selectComposite = useEngineStore((state) => state.selectComposite);
  const selectedParticleId = useEngineStore((state) => state.selectedParticleId);
  const engine = useEngineStore((state) => state.engine);
  const isEditMode = useEngineStore((state) => state.isEditMode);
  const deleteSelectedParticles = useEngineStore((state) => state.deleteSelectedParticles);
  const clearSelection = useEngineStore((state) => state.clearSelection);
  const selectParticle = useEngineStore((state) => state.selectParticle);
  
  const [selectedParticles, setSelectedParticles] = useState<any[]>([]);
  const [commonProperties, setCommonProperties] = useState<any>({});
  
  // Single particle properties
  const [mass, setMass] = useState(1);
  const [radius, setRadius] = useState(0.15);
  const [damping, setDamping] = useState(0.99);
  const [color, setColor] = useState('#ffffff');
  const [particlePosition, setParticlePosition] = useState({ x: 0, y: 0, z: 0 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0, z: 0 });
  const [fixed, setFixed] = useState(false);
  const [livePreview, setLivePreview] = useState(true);
  
  // Get single selected particle if applicable
  const singleParticle = selectedParticleId ? engine.getParticle(selectedParticleId) : 
                        (selectedParticleIds.size === 1 ? engine.getParticle(Array.from(selectedParticleIds)[0]) : null);
  
  console.log('ObjectPropertiesPanel - selectedParticleId:', selectedParticleId, 'singleParticle:', singleParticle);
  
  // Get selected composite if applicable
  const selectedComposite = selectedCompositeId ? composites.get(selectedCompositeId) : null;
  
  // Debug log
  if (selectedCompositeId) {
    console.log('[ObjectPropertiesPanel] Selected composite ID:', selectedCompositeId);
    console.log('[ObjectPropertiesPanel] Composites Map:', composites);
    console.log('[ObjectPropertiesPanel] Selected composite:', selectedComposite);
    if (selectedComposite) {
      console.log('[ObjectPropertiesPanel] Composite methods:', {
        hasGetParticles: typeof selectedComposite.getParticles === 'function',
        hasGetConstraints: typeof selectedComposite.getConstraints === 'function'
      });
    }
  }
  
  // Reset collapsed state when panel is shown from toolbar
  useEffect(() => {
    if (showObjectProperties) {
      setCollapsed(false);
    }
  }, [showObjectProperties]);
  
  // Update form when single particle selection changes
  useEffect(() => {
    if (singleParticle) {
      setMass(singleParticle.mass);
      setRadius(singleParticle.radius);
      setDamping(singleParticle.damping);
      setColor(singleParticle.color);
      setParticlePosition({
        x: Math.round(singleParticle.position.x * 100) / 100,
        y: Math.round(singleParticle.position.y * 100) / 100,
        z: Math.round(singleParticle.position.z * 100) / 100,
      });
      const currentVel = singleParticle.getCurrentVelocity();
      setVelocity({
        x: Math.round(currentVel.x * 100) / 100,
        y: Math.round(currentVel.y * 100) / 100,
        z: Math.round(currentVel.z * 100) / 100,
      });
      setFixed(singleParticle.fixed);
    }
  }, [singleParticle]);
  
  // Update particles list and common properties for multi-selection
  useEffect(() => {
    const particles = Array.from(selectedParticleIds).map(id => engine.getParticle(id)).filter(Boolean);
    setSelectedParticles(particles);
    
    if (particles.length > 1) {
      // Calculate common properties
      const avgMass = particles.reduce((sum, p) => sum + (p?.mass || 0), 0) / particles.length;
      const avgRadius = particles.reduce((sum, p) => sum + (p?.radius || 0), 0) / particles.length;
      const avgDamping = particles.reduce((sum, p) => sum + (p?.damping || 0), 0) / particles.length;
      const allFixed = particles.every(p => p?.fixed || false);
      const someFixed = particles.some(p => p?.fixed || false);
      
      setCommonProperties({
        avgMass: avgMass.toFixed(2),
        avgRadius: avgRadius.toFixed(2),
        avgDamping: avgDamping.toFixed(2),
        fixedStatus: allFixed ? 'All Fixed' : someFixed ? 'Mixed' : 'None Fixed'
      });
    }
  }, [selectedParticleIds, engine]);
  
  // Live preview effect for single particle
  useEffect(() => {
    if (singleParticle && livePreview) {
      singleParticle.mass = mass;
      singleParticle.radius = radius;
      singleParticle.damping = damping;
      singleParticle.color = color;
      singleParticle.fixed = fixed;
    }
  }, [singleParticle, livePreview, mass, radius, damping, color, fixed]);
  
  const handleMassChange = (value: number) => {
    selectedParticles.forEach(particle => {
      if (particle) particle.mass = value;
    });
  };
  
  const handleRadiusChange = (value: number) => {
    selectedParticles.forEach(particle => {
      if (particle) particle.radius = value;
    });
  };
  
  const handleDampingChange = (value: number) => {
    selectedParticles.forEach(particle => {
      if (particle) particle.damping = value;
    });
  };
  
  const handleColorChange = (color: string) => {
    selectedParticles.forEach(particle => {
      if (particle) particle.color = color;
    });
  };
  
  const handleFixedToggle = (fixed: boolean) => {
    selectedParticles.forEach(particle => {
      if (particle) particle.fixed = fixed;
    });
  };
  
  // Single particle specific functions
  const resetPosition = () => {
    if (!singleParticle) return;
    const newPosition = new Vector3(particlePosition.x, particlePosition.y, particlePosition.z);
    singleParticle.resetPosition(newPosition);
  };

  const applyVelocity = () => {
    if (!singleParticle) return;
    const newVelocity = new Vector3(velocity.x, velocity.y, velocity.z);
    singleParticle.setInitialVelocity(newVelocity);
  };

  const resetToTop = () => {
    if (!singleParticle) return;
    const newPosition = new Vector3(singleParticle.position.x, 10, singleParticle.position.z);
    singleParticle.resetPosition(newPosition);
    setParticlePosition({
      x: Math.round(newPosition.x * 100) / 100,
      y: Math.round(newPosition.y * 100) / 100,
      z: Math.round(newPosition.z * 100) / 100,
    });
  };

  const stopParticle = () => {
    if (!singleParticle) return;
    singleParticle.setInitialVelocity(new Vector3(0, 0, 0));
    setVelocity({ x: 0, y: 0, z: 0 });
  };
  
  const deleteCurrentParticle = () => {
    if (singleParticle) {
      engine.removeParticle(singleParticle.id);
      selectParticle(null);
    }
  };
  
  // Show panel for both edit mode selections and single particle selection
  const hasSelection = (isEditMode && selectedParticleIds.size > 0) || singleParticle || selectedComposite;
  
  if (!showObjectProperties) {
    return null;
  }
  
  if (!hasSelection) {
    return (
      <div className={`object-properties-panel ${collapsed ? 'collapsed' : ''}`}>
        <div className="panel-header">
          <div onClick={() => setCollapsed(!collapsed)} style={{ display: 'flex', alignItems: 'center', flex: 1, cursor: 'pointer' }}>
            <h3>Object Properties</h3>
            <span className="collapse-icon" style={{ marginLeft: 'auto', marginRight: '10px' }}>{collapsed ? '▶' : '▼'}</span>
          </div>
          <button onClick={toggleObjectProperties} className="minimize-btn" title="Minimize to toolbar">−</button>
        </div>
        {!collapsed && (
        <div className="empty-state">
          <p>Click on an object to view properties</p>
          <p className="hint">Ctrl+click (or Alt+click) on cloth/rope to select entire composite</p>
          {!isEditMode && <p className="hint">or press E for Edit Mode</p>}
        </div>
        )}
      </div>
    );
  }
  
  return (
    <div className={`object-properties-panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="panel-header">
        <div onClick={() => setCollapsed(!collapsed)} style={{ display: 'flex', alignItems: 'center', flex: 1, cursor: 'pointer' }}>
          <h3>Object Properties</h3>
          <span className="collapse-icon" style={{ marginLeft: 'auto', marginRight: '10px' }}>{collapsed ? '▶' : '▼'}</span>
        </div>
        <button onClick={toggleObjectProperties} className="minimize-btn" title="Minimize to toolbar">−</button>
        {isEditMode && selectedParticleIds.size > 0 && (
          <span className="selection-badge">{selectedParticleIds.size} selected</span>
        )}
        {singleParticle && !isEditMode && (
          <button onClick={(e) => { e.stopPropagation(); selectParticle(null); }} className="close-btn" title="Clear selection">×</button>
        )}
      </div>
      {!collapsed && (
      <div className="panel-content">
      
      {selectedComposite ? (
        <>
        <div className="properties-section">
          <h4>Composite: {(() => {
            try {
              return selectedComposite.name || 'Unknown';
            } catch (e) {
              console.error('[ObjectPropertiesPanel] Error accessing composite name:', e);
              return 'Error';
            }
          })()} <small style={{ fontWeight: 'normal', opacity: 0.7 }}>(ESC to deselect)</small></h4>
          <div className="selection-info">
            <div className="info-row">
              <span>Type:</span>
              <span>{(() => {
                try {
                  return selectedComposite.name || 'Unknown';
                } catch (e) {
                  return 'Error';
                }
              })()}</span>
            </div>
            <div className="info-row">
              <span>Particles:</span>
              <span>{(() => {
                try {
                  return selectedComposite.getParticles ? selectedComposite.getParticles().length : 0;
                } catch (e) {
                  console.error('[ObjectPropertiesPanel] Error getting particles:', e);
                  return 0;
                }
              })()}</span>
            </div>
            <div className="info-row">
              <span>Constraints:</span>
              <span>{(() => {
                try {
                  return selectedComposite.getConstraints ? selectedComposite.getConstraints().length : 0;
                } catch (e) {
                  console.error('[ObjectPropertiesPanel] Error getting constraints:', e);
                  return 0;
                }
              })()}</span>
            </div>
          </div>
          
          <div className="properties-section">
            <h4>Bulk Edit All Particles</h4>
            <div className="property-field">
              <label>Mass (all particles)</label>
              <input
                type="number"
                placeholder="Set all..."
                onChange={(e) => {
                  try {
                    if (e.target.value && selectedComposite && selectedComposite.getParticles) {
                      const mass = parseFloat(e.target.value);
                      selectedComposite.getParticles().forEach(p => {
                        if (p) p.mass = mass;
                      });
                    }
                  } catch (error) {
                    console.error('[ObjectPropertiesPanel] Error setting mass:', error);
                  }
                }}
                min="0.1"
                max="10"
                step="0.1"
              />
            </div>
            <div className="property-field">
              <label>Radius (all particles)</label>
              <input
                type="number"
                placeholder="Set all..."
                onChange={(e) => {
                  try {
                    if (e.target.value && selectedComposite && selectedComposite.getParticles) {
                      const radius = parseFloat(e.target.value);
                      selectedComposite.getParticles().forEach(p => {
                        if (p) p.radius = radius;
                      });
                    }
                  } catch (error) {
                    console.error('[ObjectPropertiesPanel] Error setting radius:', error);
                  }
                }}
                min="0.1"
                max="2"
                step="0.1"
              />
            </div>
            <div className="property-field">
              <label>Damping (all particles)</label>
              <input
                type="number"
                placeholder="Set all..."
                onChange={(e) => {
                  try {
                    if (e.target.value && selectedComposite && selectedComposite.getParticles) {
                      const damping = parseFloat(e.target.value);
                      selectedComposite.getParticles().forEach(p => {
                        if (p) p.damping = damping;
                      });
                    }
                  } catch (error) {
                    console.error('[ObjectPropertiesPanel] Error setting damping:', error);
                  }
                }}
                min="0.1"
                max="1"
                step="0.01"
              />
            </div>
            <div className="property-field">
              <label>Color (all particles)</label>
              <input
                type="color"
                onChange={(e) => {
                  try {
                    if (selectedComposite && selectedComposite.getParticles) {
                      const color = e.target.value;
                      selectedComposite.getParticles().forEach(p => {
                        if (p) p.color = color;
                      });
                    }
                  } catch (error) {
                    console.error('[ObjectPropertiesPanel] Error setting color:', error);
                  }
                }}
              />
            </div>
            <div className="bulk-actions">
              <button 
                className="btn-small btn-secondary"
                onClick={() => {
                  try {
                    if (selectedComposite && selectedComposite.getParticles) {
                      selectedComposite.getParticles().forEach(p => {
                        if (p) p.fixed = true;
                      });
                    }
                  } catch (error) {
                    console.error('[ObjectPropertiesPanel] Error fixing particles:', error);
                  }
                }}
              >
                Fix All
              </button>
              <button 
                className="btn-small btn-secondary"
                onClick={() => {
                  try {
                    if (selectedComposite && selectedComposite.getParticles) {
                      selectedComposite.getParticles().forEach(p => {
                        if (p) p.fixed = false;
                      });
                    }
                  } catch (error) {
                    console.error('[ObjectPropertiesPanel] Error unfixing particles:', error);
                  }
                }}
              >
                Unfix All
              </button>
            </div>
          </div>
          
          <div className="properties-section">
            <h4>Constraints</h4>
            <div className="property-field">
              <label>Stiffness (all constraints)</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                defaultValue="0.9"
                onChange={(e) => {
                  try {
                    if (selectedComposite && selectedComposite.getConstraints) {
                      const stiffness = parseFloat(e.target.value);
                      selectedComposite.getConstraints().forEach(c => {
                        if (c) c.stiffness = stiffness;
                      });
                    }
                  } catch (error) {
                    console.error('[ObjectPropertiesPanel] Error setting stiffness:', error);
                  }
                }}
              />
            </div>
            <div className="property-field">
              <label>Stroke Weight: <span style={{ fontWeight: 'bold' }}>
                {(() => {
                  try {
                    const constraints = selectedComposite.getConstraints();
                    if (constraints && constraints.length > 0) {
                      return constraints[0].strokeWeight || 1;
                    }
                    return 1;
                  } catch {
                    return 1;
                  }
                })()}
              </span></label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                defaultValue={(() => {
                  try {
                    const constraints = selectedComposite.getConstraints();
                    if (constraints && constraints.length > 0) {
                      return constraints[0].strokeWeight || 1;
                    }
                    return 1;
                  } catch {
                    return 1;
                  }
                })()}
                onChange={(e) => {
                  try {
                    if (selectedComposite && selectedComposite.getConstraints) {
                      const strokeWeight = parseFloat(e.target.value);
                      selectedComposite.getConstraints().forEach(c => {
                        if (c) c.strokeWeight = strokeWeight;
                      });
                      // Force re-render of the component
                      e.target.setAttribute('value', strokeWeight.toString());
                    }
                  } catch (error) {
                    console.error('[ObjectPropertiesPanel] Error setting stroke weight:', error);
                  }
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', opacity: 0.6 }}>
                <span>Thin</span>
                <span>Thick</span>
              </div>
            </div>
          </div>
          
          <div className="action-buttons">
            <button 
              className="btn-small btn-danger"
              onClick={() => {
                try {
                  // Remove all particles and constraints of the composite
                  if (selectedComposite && selectedComposite.getParticles) {
                    selectedComposite.getParticles().forEach(p => {
                      if (p) engine.removeParticle(p.id);
                    });
                  }
                  if (selectedComposite && selectedComposite.getConstraints) {
                    selectedComposite.getConstraints().forEach(c => {
                      if (c) engine.removeConstraint(c.id);
                    });
                  }
                  selectComposite(null);
                } catch (error) {
                  console.error('[ObjectPropertiesPanel] Error deleting composite:', error);
                }
              }}
            >
              Delete Composite
            </button>
            <button 
              className="btn-small btn-secondary"
              onClick={() => selectComposite(null)}
            >
              Clear Selection
            </button>
          </div>
        </div>
        </>
      ) : (
        <>
      <div className="properties-section">
        <h4>Selection</h4>
        <div className="selection-info">
          <div className="info-row">
            <span>Selected:</span>
            <span>{selectedParticleIds.size} particle{selectedParticleIds.size !== 1 ? 's' : ''}</span>
          </div>
          {selectedParticleIds.size > 1 && (
            <div className="info-row">
              <span>Fixed:</span>
              <span>{commonProperties.fixedStatus}</span>
            </div>
          )}
        </div>
        <div className="action-buttons">
          <button 
            className="btn-small btn-danger"
            onClick={deleteSelectedParticles}
          >
            Delete Selected
          </button>
          <button 
            className="btn-small btn-secondary"
            onClick={clearSelection}
          >
            Clear Selection
          </button>
        </div>
      </div>
      
      {singleParticle ? (
        <>
          <div className="properties-section">
            <h4>Physical Properties</h4>
            {livePreview && (
              <label className="preview-toggle">
                <input
                  type="checkbox"
                  checked={livePreview}
                  onChange={(e) => setLivePreview(e.target.checked)}
                />
                Live Preview
              </label>
            )}
            
            <div className="property-field">
              <label>Mass</label>
              <input
                type="number"
                value={mass}
                onChange={(e) => setMass(parseFloat(e.target.value))}
                min="0.1"
                max="10"
                step="0.1"
              />
            </div>
            <div className="property-field">
              <label>Radius</label>
              <input
                type="number"
                value={radius}
                onChange={(e) => setRadius(parseFloat(e.target.value))}
                min="0.1"
                max="2"
                step="0.1"
              />
            </div>
            <div className="property-field">
              <label>Damping</label>
              <input
                type="number"
                value={damping}
                onChange={(e) => setDamping(parseFloat(e.target.value))}
                min="0.1"
                max="1"
                step="0.01"
              />
            </div>
            <div className="property-field">
              <label>Color</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
            <div className="property-field checkbox-field">
              <label>
                <input
                  type="checkbox"
                  checked={fixed}
                  onChange={(e) => setFixed(e.target.checked)}
                />
                Fixed Position
              </label>
            </div>
          </div>
          
          <div className="properties-section">
            <h4>Position</h4>
            <div className="position-inputs">
              <div className="property-field compact">
                <label>X</label>
                <input
                  type="number"
                  value={particlePosition.x}
                  onChange={(e) => setParticlePosition(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
                  step="0.1"
                />
              </div>
              <div className="property-field compact">
                <label>Y</label>
                <input
                  type="number"
                  value={particlePosition.y}
                  onChange={(e) => setParticlePosition(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
                  step="0.1"
                />
              </div>
              <div className="property-field compact">
                <label>Z</label>
                <input
                  type="number"
                  value={particlePosition.z}
                  onChange={(e) => setParticlePosition(prev => ({ ...prev, z: parseFloat(e.target.value) }))}
                  step="0.1"
                />
              </div>
            </div>
            <div className="button-row">
              <button onClick={resetPosition} className="btn-small btn-secondary">
                Apply Position
              </button>
              <button onClick={resetToTop} className="btn-small btn-secondary">
                Reset to Top
              </button>
            </div>
          </div>
          
          <div className="properties-section">
            <h4>Velocity</h4>
            <div className="position-inputs">
              <div className="property-field compact">
                <label>X</label>
                <input
                  type="number"
                  value={velocity.x}
                  onChange={(e) => setVelocity(prev => ({ ...prev, x: parseFloat(e.target.value) || 0 }))}
                  step="0.1"
                />
              </div>
              <div className="property-field compact">
                <label>Y</label>
                <input
                  type="number"
                  value={velocity.y}
                  onChange={(e) => setVelocity(prev => ({ ...prev, y: parseFloat(e.target.value) || 0 }))}
                  step="0.1"
                />
              </div>
              <div className="property-field compact">
                <label>Z</label>
                <input
                  type="number"
                  value={velocity.z}
                  onChange={(e) => setVelocity(prev => ({ ...prev, z: parseFloat(e.target.value) || 0 }))}
                  step="0.1"
                />
              </div>
            </div>
            <div className="button-row">
              <button onClick={applyVelocity} className="btn-small btn-secondary">
                Apply Velocity
              </button>
              <button onClick={stopParticle} className="btn-small btn-secondary">
                Stop
              </button>
            </div>
          </div>
          
          {!isEditMode && (
            <div className="properties-section">
              <button onClick={deleteCurrentParticle} className="btn-small btn-danger">
                Delete Particle
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="properties-section">
          <h4>Bulk Edit</h4>
          <p className="bulk-edit-info">Apply changes to all selected particles</p>
          <div className="property-field">
            <label>Mass (avg: {commonProperties.avgMass})</label>
            <input
              type="number"
              placeholder="Set all..."
              onChange={(e) => e.target.value && handleMassChange(parseFloat(e.target.value))}
              min="0.1"
              max="10"
              step="0.1"
            />
          </div>
          <div className="property-field">
            <label>Radius (avg: {commonProperties.avgRadius})</label>
            <input
              type="number"
              placeholder="Set all..."
              onChange={(e) => e.target.value && handleRadiusChange(parseFloat(e.target.value))}
              min="0.1"
              max="2"
              step="0.1"
            />
          </div>
          <div className="property-field">
            <label>Damping (avg: {commonProperties.avgDamping})</label>
            <input
              type="number"
              placeholder="Set all..."
              onChange={(e) => e.target.value && handleDampingChange(parseFloat(e.target.value))}
              min="0.1"
              max="1"
              step="0.01"
            />
          </div>
          <div className="property-field">
            <label>Color</label>
            <input
              type="color"
              onChange={(e) => handleColorChange(e.target.value)}
            />
          </div>
          <div className="bulk-actions">
            <button 
              className="btn-small btn-secondary"
              onClick={() => handleFixedToggle(true)}
            >
              Fix All
            </button>
            <button 
              className="btn-small btn-secondary"
              onClick={() => handleFixedToggle(false)}
            >
              Unfix All
            </button>
          </div>
        </div>
      )}
      </>
      )}
      </div>
      )}
    </div>
  );
}