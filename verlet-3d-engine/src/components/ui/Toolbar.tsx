import { useEngineStore } from '../../stores/useEngineStore';
import { Particle } from '../../core/primitives/Particle';
import { Vector3 } from '../../core/physics/Vector3';
import { CompositeFactory } from '../../core/primitives/Composite';
import './Toolbar.css';

export function Toolbar() {
  const { 
    addParticle, 
    addComposite, 
    isCreatingConstraint, 
    cancelConstraintCreation 
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
      15,
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
    <div className="toolbar">
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
        <button onClick={addCloth} className="toolbar-btn">
          <span className="icon">🏁</span>
          <span>Cloth</span>
        </button>
        <button onClick={addBox} className="toolbar-btn">
          <span className="icon">📦</span>
          <span>Box</span>
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
    </div>
  );
}
