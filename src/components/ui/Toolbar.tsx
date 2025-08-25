import { useState } from 'react';
import { useEngineStore } from '../../stores/useEngineStore';
import { Particle } from '../../core/primitives/Particle';
import { Vector3 } from '../../core/physics/Vector3';
import { CompositeFactory } from '../../core/primitives/Composite';
import './Toolbar.css';

export function Toolbar() {
  const [collapsed, setCollapsed] = useState(false);
  const [clothSegmentsX, setClothSegmentsX] = useState(10);
  const [clothSegmentsY, setClothSegmentsY] = useState(10);
  const { 
    addParticle, 
    addComposite, 
    isCreatingConstraint, 
    cancelConstraintCreation,
    showObjectProperties,
    showEnvironmental,
    toggleObjectProperties,
    toggleEnvironmental
  } = useEngineStore();

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
      damping: 0.99, // Reduced damping for gravity visibility
      fixed: false, // Explicitly ensure particle can move
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

  return (
    <div className={`toolbar ${collapsed ? 'collapsed' : ''}`}>
      <div className="panel-header" onClick={() => setCollapsed(!collapsed)}>
        <h3>Toolbar</h3>
        <span className="collapse-icon">{collapsed ? '▶' : '▼'}</span>
      </div>
      {!collapsed && (
      <div className="panel-content">
      <h3>Add Primitives</h3>
      <div className="toolbar-buttons">
        <button onClick={addSingleParticle} className="toolbar-btn">
          <span className="icon">⚪</span>
          <span>Particle</span>
        </button>
        <button onClick={addRope} className="toolbar-btn">
          <span className="icon">🔗</span>
          <span>Rope</span>
        </button>
        <div className="toolbar-btn-with-controls">
          <button onClick={addCloth} className="toolbar-btn">
            <span className="icon">🏁</span>
            <span>Cloth</span>
          </button>
          <div className="cloth-controls">
            <div className="control-row">
              <label>X nodes:</label>
              <input
                type="number"
                value={clothSegmentsX}
                onChange={(e) => setClothSegmentsX(Math.max(2, parseInt(e.target.value) || 2))}
                min="2"
                max="50"
                style={{ width: '50px' }}
              />
            </div>
            <div className="control-row">
              <label>Y nodes:</label>
              <input
                type="number"
                value={clothSegmentsY}
                onChange={(e) => setClothSegmentsY(Math.max(2, parseInt(e.target.value) || 2))}
                min="2"
                max="50"
                style={{ width: '50px' }}
              />
            </div>
          </div>
        </div>
        <button onClick={addBox} className="toolbar-btn">
          <span className="icon">📦</span>
          <span>Box</span>
        </button>
      </div>

      <h3 style={{ marginTop: '20px' }}>Debug</h3>
      <div className="toolbar-buttons">
        <button 
          onClick={() => {
            const state = useEngineStore.getState();
            console.log('=== DEBUG INFO ===');
            console.log('Composites in store:', state.composites);
            console.log('Number of composites:', state.composites.size);
            state.composites.forEach((comp, id) => {
              console.log(`Composite ${id}:`, {
                name: comp.name,
                particles: comp.getParticles().length,
                constraints: comp.getConstraints().length,
                particleIds: comp.getParticles().map(p => p.id)
              });
            });
            console.log('All particles:', state.engine.getParticles());
            const particles = state.engine.getParticles();
            particles.forEach(p => {
              if (p.metadata?.compositeId) {
                console.log(`Particle ${p.id} belongs to composite ${p.metadata.compositeId}`);
              }
            });
          }} 
          className="toolbar-btn"
        >
          <span className="icon">🐛</span>
          <span>Debug Composites</span>
        </button>
      </div>
      
      <h3 style={{ marginTop: '20px' }}>Connect Particles</h3>
      <div className="toolbar-buttons">
        {isCreatingConstraint ? (
          <button onClick={cancelConstraintCreation} className="toolbar-btn active">
            <span className="icon">❌</span>
            <span>Cancel Connection</span>
          </button>
        ) : (
          <div className="instruction-text">
            <span className="icon">💡</span>
            <div>
              <div>Double-click a particle to start</div>
              <div>Click another to connect</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="minimized-panels">
        <h3 style={{ marginTop: '20px' }}>Panels</h3>
        <div className="toolbar-buttons">
          <button 
            onClick={toggleObjectProperties} 
            className={`toolbar-btn ${showObjectProperties ? 'active' : ''}`}
            title="Object Properties Panel"
          >
            <span className="icon">📋</span>
            <span>Properties</span>
          </button>
          <button 
            onClick={toggleEnvironmental} 
            className={`toolbar-btn ${showEnvironmental ? 'active' : ''}`}
            title="Environmental Panel"
          >
            <span className="icon">🌍</span>
            <span>Environment</span>
          </button>
        </div>
      </div>
      </div>
      )}
    </div>
  );
}
