import { useState, useEffect, useRef } from 'react';
import { useEngineStore } from '../../stores/useEngineStore';
import { Vector3 } from '../../core/physics/Vector3';
import './ParticlePropertyPanel.css';

export function ParticlePropertyPanel() {
  const selectedParticleId = useEngineStore((state) => state.selectedParticleId);
  const engine = useEngineStore((state) => state.engine);
  const selectParticle = useEngineStore((state) => state.selectParticle);
  
  const [mass, setMass] = useState(1);
  const [radius, setRadius] = useState(0.5);
  const [damping, setDamping] = useState(0.99);
  const [color, setColor] = useState('#ffffff');
  const [particlePosition, setParticlePosition] = useState({ x: 0, y: 0, z: 0 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0, z: 0 });
  const [fixed, setFixed] = useState(false);
  const [livePreview, setLivePreview] = useState(true);
  
  // Drag functionality
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panelPosition, setPanelPosition] = useState<{ x: number; y: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const particle = selectedParticleId ? engine.getParticle(selectedParticleId) : null;

  // Update form when particle selection changes
  useEffect(() => {
    if (particle) {
      setMass(particle.mass);
      setRadius(particle.radius);
      setDamping(particle.damping);
      setColor(particle.color);
      setParticlePosition({
        x: Math.round(particle.position.x * 100) / 100,
        y: Math.round(particle.position.y * 100) / 100,
        z: Math.round(particle.position.z * 100) / 100,
      });
      const currentVel = particle.getCurrentVelocity();
      setVelocity({
        x: Math.round(currentVel.x * 100) / 100,
        y: Math.round(currentVel.y * 100) / 100,
        z: Math.round(currentVel.z * 100) / 100,
      });
      setFixed(particle.fixed);
    }
  }, [particle]);

  // Live preview effect - apply changes in real-time
  useEffect(() => {
    if (particle && livePreview) {
      particle.mass = mass;
      particle.radius = radius;
      particle.damping = damping;
      particle.color = color;
      particle.fixed = fixed;
    }
  }, [particle, livePreview, mass, radius, damping, color, fixed]);

  const applyChanges = () => {
    if (!particle) return;

    particle.mass = mass;
    particle.radius = radius;
    particle.damping = damping;
    particle.color = color;
    particle.fixed = fixed;
  };

  const resetPosition = () => {
    if (!particle) return;

    const newPosition = new Vector3(particlePosition.x, particlePosition.y, particlePosition.z);
    particle.resetPosition(newPosition);
  };

  const applyVelocity = () => {
    if (!particle) return;

    const newVelocity = new Vector3(velocity.x, velocity.y, velocity.z);
    particle.setInitialVelocity(newVelocity);
  };

  const resetToTop = () => {
    if (!particle) return;

    const newPosition = new Vector3(
      particle.position.x,
      10,
      particle.position.z
    );
    particle.resetPosition(newPosition);
    setParticlePosition({
      x: Math.round(newPosition.x * 100) / 100,
      y: Math.round(newPosition.y * 100) / 100,
      z: Math.round(newPosition.z * 100) / 100,
    });
  };

  const stopParticle = () => {
    if (!particle) return;
    
    particle.setInitialVelocity(new Vector3(0, 0, 0));
    setVelocity({ x: 0, y: 0, z: 0 });
  };

  const closePanel = () => {
    selectParticle(null);
    // Reset position when closing so it centers again next time
    setPanelPosition(null);
  };

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('panel-header')) {
      setIsDragging(true);
      const rect = panelRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Constrain to viewport bounds
      const maxX = window.innerWidth - 320; // panel width
      const maxY = window.innerHeight - 100; // leave some space at bottom
      
      setPanelPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add/remove event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  if (!particle) {
    return null;
  }

  return (
    <div 
      ref={panelRef}
      className={`particle-property-panel ${isDragging ? 'dragging' : ''}`}
      style={panelPosition ? {
        left: panelPosition.x,
        top: panelPosition.y,
        transform: 'none',
        position: 'fixed'
      } : {
        // Default centered positioning
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'fixed'
      }}
    >
      <div 
        className="panel-header"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <h3>Particle Properties</h3>
        <div className="header-controls">
          <label className="preview-toggle">
            <input
              type="checkbox"
              checked={livePreview}
              onChange={(e) => setLivePreview(e.target.checked)}
            />
            Live Preview
          </label>
          <button onClick={closePanel} className="close-btn">×</button>
        </div>
      </div>

      <div className="property-section">
        <h4>Physical Properties</h4>
        
        <div className="property-row">
          <label>Mass:</label>
          <input
            type="number"
            value={mass}
            onChange={(e) => setMass(parseFloat(e.target.value))}
            min="0.1"
            max="10"
            step="0.1"
          />
        </div>

        <div className="property-row">
          <label>Radius:</label>
          <input
            type="number"
            value={radius}
            onChange={(e) => setRadius(parseFloat(e.target.value))}
            min="0.1"
            max="2"
            step="0.1"
          />
        </div>

        <div className="property-row">
          <label>Damping:</label>
          <input
            type="number"
            value={damping}
            onChange={(e) => setDamping(parseFloat(e.target.value))}
            min="0.1"
            max="1"
            step="0.01"
          />
        </div>

        <div className="property-row">
          <label>Color:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>

        <div className="property-row">
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

      <div className="property-section">
        <h4>Position</h4>
        
        <div className="position-inputs">
          <div className="position-row">
            <label>X:</label>
            <input
              type="number"
              value={particlePosition.x}
              onChange={(e) => setParticlePosition(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
              step="0.1"
            />
          </div>
          <div className="position-row">
            <label>Y:</label>
            <input
              type="number"
              value={particlePosition.y}
              onChange={(e) => setParticlePosition(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
              step="0.1"
            />
          </div>
          <div className="position-row">
            <label>Z:</label>
            <input
              type="number"
              value={particlePosition.z}
              onChange={(e) => setParticlePosition(prev => ({ ...prev, z: parseFloat(e.target.value) }))}
              step="0.1"
            />
          </div>
        </div>

        <div className="button-row">
          <button onClick={resetPosition} className="btn btn-secondary">
            Reset to Position
          </button>
          <button onClick={resetToTop} className="btn btn-secondary">
            Reset to Top
          </button>
        </div>
      </div>

      <div className="property-section">
        <h4>Velocity</h4>
        
        <div className="position-inputs">
          <div className="position-row">
            <label>X:</label>
            <input
              type="number"
              value={velocity.x}
              onChange={(e) => setVelocity(prev => ({ ...prev, x: parseFloat(e.target.value) || 0 }))}
              step="0.1"
            />
          </div>
          <div className="position-row">
            <label>Y:</label>
            <input
              type="number"
              value={velocity.y}
              onChange={(e) => setVelocity(prev => ({ ...prev, y: parseFloat(e.target.value) || 0 }))}
              step="0.1"
            />
          </div>
          <div className="position-row">
            <label>Z:</label>
            <input
              type="number"
              value={velocity.z}
              onChange={(e) => setVelocity(prev => ({ ...prev, z: parseFloat(e.target.value) || 0 }))}
              step="0.1"
            />
          </div>
        </div>

        <div className="button-row">
          <button onClick={applyVelocity} className="btn btn-secondary">
            Apply Velocity
          </button>
          <button onClick={stopParticle} className="btn btn-secondary">
            Stop
          </button>
        </div>
      </div>

      {!livePreview && (
        <div className="button-row">
          <button onClick={applyChanges} className="btn btn-primary">
            Apply Changes
          </button>
        </div>
      )}
    </div>
  );
}
