import { Particle } from './Particle';
import { Constraint } from './Constraint';
import { Vector3 } from '../physics/Vector3';
import { generateId } from '../../utils/id';

export interface CompositeOptions {
  name?: string;
  metadata?: Record<string, any>;
}

/**
 * Composite structure containing particles and constraints
 */
export class Composite {
  public id: string;
  public name: string;
  public particles: Map<string, Particle> = new Map();
  public constraints: Map<string, Constraint> = new Map();
  public metadata: Record<string, any>;

  constructor(options: CompositeOptions = {}) {
    this.id = generateId('composite');
    this.name = options.name ?? 'Composite';
    this.metadata = options.metadata ?? {};
  }

  /**
   * Add a particle to the composite
   */
  addParticle(particle: Particle): void {
    // Set metadata to link particle to this composite
    if (!particle.metadata) {
      particle.metadata = {};
    }
    particle.metadata.compositeId = this.id;
    this.particles.set(particle.id, particle);
  }

  /**
   * Add a constraint to the composite
   */
  addConstraint(constraint: Constraint): void {
    this.constraints.set(constraint.id, constraint);
  }

  /**
   * Create a constraint between two particles in the composite
   */
  connect(
    particleAId: string,
    particleBId: string,
    restLength?: number,
    stiffness?: number
  ): Constraint | null {
    const particleA = this.particles.get(particleAId);
    const particleB = this.particles.get(particleBId);

    if (!particleA || !particleB) {
      console.warn('Cannot create constraint: particle not found in composite');
      return null;
    }

    const constraint = new Constraint(particleA, particleB, restLength, stiffness);
    this.addConstraint(constraint);
    return constraint;
  }

  /**
   * Remove a particle and its associated constraints
   */
  removeParticle(particleId: string): void {
    this.particles.delete(particleId);
    
    // Remove constraints connected to this particle
    const constraintsToRemove: string[] = [];
    this.constraints.forEach((constraint, id) => {
      if (constraint.particleA.id === particleId || constraint.particleB.id === particleId) {
        constraintsToRemove.push(id);
      }
    });
    constraintsToRemove.forEach(id => this.constraints.delete(id));
  }

  /**
   * Remove a constraint
   */
  removeConstraint(constraintId: string): void {
    this.constraints.delete(constraintId);
  }

  /**
   * Get center of mass
   */
  getCenterOfMass(): Vector3 {
    const center = new Vector3();
    let totalMass = 0;

    this.particles.forEach(particle => {
      center.addScaled(particle.position, particle.mass);
      totalMass += particle.mass;
    });

    if (totalMass > 0) {
      center.divide(totalMass);
    }

    return center;
  }

  /**
   * Translate all particles
   */
  translate(offset: Vector3): void {
    this.particles.forEach(particle => {
      particle.position.add(offset);
      particle.previousPosition.add(offset);
    });
  }

  /**
   * Rotate around a point
   */
  rotate(angle: Vector3, pivot?: Vector3): void {
    const center = pivot ?? this.getCenterOfMass();
    
    // Create rotation matrices for each axis
    const cosX = Math.cos(angle.x);
    const sinX = Math.sin(angle.x);
    const cosY = Math.cos(angle.y);
    const sinY = Math.sin(angle.y);
    const cosZ = Math.cos(angle.z);
    const sinZ = Math.sin(angle.z);

    this.particles.forEach(particle => {
      // Translate to origin
      const pos = particle.position.clone().sub(center);
      const prevPos = particle.previousPosition.clone().sub(center);

      // Rotate around X
      let y = pos.y * cosX - pos.z * sinX;
      let z = pos.y * sinX + pos.z * cosX;
      pos.y = y;
      pos.z = z;

      y = prevPos.y * cosX - prevPos.z * sinX;
      z = prevPos.y * sinX + prevPos.z * cosX;
      prevPos.y = y;
      prevPos.z = z;

      // Rotate around Y
      let x = pos.x * cosY + pos.z * sinY;
      z = -pos.x * sinY + pos.z * cosY;
      pos.x = x;
      pos.z = z;

      x = prevPos.x * cosY + prevPos.z * sinY;
      z = -prevPos.x * sinY + prevPos.z * cosY;
      prevPos.x = x;
      prevPos.z = z;

      // Rotate around Z
      x = pos.x * cosZ - pos.y * sinZ;
      y = pos.x * sinZ + pos.y * cosZ;
      pos.x = x;
      pos.y = y;

      x = prevPos.x * cosZ - prevPos.y * sinZ;
      y = prevPos.x * sinZ + prevPos.y * cosZ;
      prevPos.x = x;
      prevPos.y = y;

      // Translate back
      particle.position.copy(pos.add(center));
      particle.previousPosition.copy(prevPos.add(center));
    });
  }

  /**
   * Scale composite
   */
  scale(factor: number, pivot?: Vector3): void {
    const center = pivot ?? this.getCenterOfMass();

    this.particles.forEach(particle => {
      // Scale position
      const offset = particle.position.clone().sub(center);
      particle.position.copy(center).addScaled(offset, factor);
      
      // Scale previous position to maintain velocity
      const prevOffset = particle.previousPosition.clone().sub(center);
      particle.previousPosition.copy(center).addScaled(prevOffset, factor);
      
      // Scale radius
      particle.radius *= factor;
    });

    // Scale constraint rest lengths
    this.constraints.forEach(constraint => {
      constraint.restLength *= factor;
    });
  }

  /**
   * Clone the composite
   */
  clone(): Composite {
    const clone = new Composite({
      name: this.name + ' (Clone)',
      metadata: { ...this.metadata },
    });

    // Map old particle IDs to new particles
    const particleMap = new Map<string, Particle>();

    // Clone particles
    this.particles.forEach(particle => {
      const newParticle = new Particle({
        position: { x: particle.position.x, y: particle.position.y, z: particle.position.z },
        previousPosition: { x: particle.previousPosition.x, y: particle.previousPosition.y, z: particle.previousPosition.z },
        mass: particle.mass,
        radius: particle.radius,
        damping: particle.damping,
        fixed: particle.fixed,
        color: particle.color,
      });
      clone.addParticle(newParticle);
      particleMap.set(particle.id, newParticle);
    });

    // Clone constraints with new particle references
    this.constraints.forEach(constraint => {
      const newParticleA = particleMap.get(constraint.particleA.id);
      const newParticleB = particleMap.get(constraint.particleB.id);
      
      if (newParticleA && newParticleB) {
        const newConstraint = new Constraint(
          newParticleA,
          newParticleB,
          constraint.restLength,
          constraint.stiffness,
          constraint.breakingThreshold
        );
        clone.addConstraint(newConstraint);
      }
    });

    return clone;
  }

  /**
   * Get all particles as array
   */
  getParticles(): Particle[] {
    return Array.from(this.particles.values());
  }

  /**
   * Get all constraints as array
   */
  getConstraints(): Constraint[] {
    return Array.from(this.constraints.values());
  }

  /**
   * Serialize composite
   */
  serialize(): object {
    return {
      id: this.id,
      name: this.name,
      metadata: this.metadata,
      particles: this.getParticles().map(p => p.serialize()),
      constraints: this.getConstraints().map(c => c.serialize()),
    };
  }
}

/**
 * Factory functions for creating common composite structures
 */
export class CompositeFactory {
  /**
   * Create a rope/chain
   */
  static createRope(
    start: Vector3,
    end: Vector3,
    segments: number,
    particleMass: number = 1,
    stiffness: number = 0.8
  ): Composite {
    const composite = new Composite({ name: 'Rope' });
    const particles: Particle[] = [];

    // Create particles
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const position = new Vector3(
        start.x + (end.x - start.x) * t,
        start.y + (end.y - start.y) * t,
        start.z + (end.z - start.z) * t
      );
      
      const particle = new Particle({
        position: { x: position.x, y: position.y, z: position.z },
        mass: particleMass,
        fixed: i === 0, // Fix first particle
      });
      
      particles.push(particle);
      composite.addParticle(particle);
    }

    // Create constraints
    for (let i = 0; i < particles.length - 1; i++) {
      const constraint = new Constraint(
        particles[i],
        particles[i + 1],
        undefined,
        stiffness
      );
      composite.addConstraint(constraint);
    }

    return composite;
  }

  /**
   * Create a cloth/grid
   */
  static createCloth(
    width: number,
    height: number,
    segmentsX: number,
    segmentsY?: number,
    position: Vector3 = new Vector3(),
    particleMass: number = 0.1,
    stiffness: number = 0.9
  ): Composite {
    // If segmentsY is not provided, use segmentsX for both (backward compatibility)
    const xSegments = segmentsX;
    const ySegments = segmentsY !== undefined ? segmentsY : segmentsX;
    
    const composite = new Composite({ name: 'Cloth' });
    const particles: Particle[][] = [];

    // Create particles
    for (let y = 0; y <= ySegments; y++) {
      particles[y] = [];
      for (let x = 0; x <= xSegments; x++) {
        const particle = new Particle({
          position: {
            x: position.x + (x / xSegments) * width - width / 2,
            y: position.y,
            z: position.z + (y / ySegments) * height - height / 2
          },
          mass: particleMass,
          fixed: y === 0 && (x === 0 || x === xSegments), // Fix top corners
        });
        
        particles[y][x] = particle;
        composite.addParticle(particle);
      }
    }

    // Create structural constraints
    for (let y = 0; y <= ySegments; y++) {
      for (let x = 0; x <= xSegments; x++) {
        // Horizontal
        if (x < xSegments) {
          composite.addConstraint(
            new Constraint(particles[y][x], particles[y][x + 1], undefined, stiffness)
          );
        }
        
        // Vertical
        if (y < ySegments) {
          composite.addConstraint(
            new Constraint(particles[y][x], particles[y + 1][x], undefined, stiffness)
          );
        }
        
        // Diagonal (shear resistance)
        if (x < xSegments && y < ySegments) {
          composite.addConstraint(
            new Constraint(particles[y][x], particles[y + 1][x + 1], undefined, stiffness * 0.7)
          );
          composite.addConstraint(
            new Constraint(particles[y + 1][x], particles[y][x + 1], undefined, stiffness * 0.7)
          );
        }
      }
    }

    return composite;
  }

  /**
   * Create a box frame
   */
  static createBox(
    size: Vector3,
    position: Vector3 = new Vector3(),
    particleMass: number = 1,
    stiffness: number = 1
  ): Composite {
    const composite = new Composite({ name: 'Box' });
    const halfSize = new Vector3(size.x / 2, size.y / 2, size.z / 2);
    
    // Create 8 corner particles
    const corners = [
      new Vector3(-halfSize.x, -halfSize.y, -halfSize.z),
      new Vector3(halfSize.x, -halfSize.y, -halfSize.z),
      new Vector3(halfSize.x, -halfSize.y, halfSize.z),
      new Vector3(-halfSize.x, -halfSize.y, halfSize.z),
      new Vector3(-halfSize.x, halfSize.y, -halfSize.z),
      new Vector3(halfSize.x, halfSize.y, -halfSize.z),
      new Vector3(halfSize.x, halfSize.y, halfSize.z),
      new Vector3(-halfSize.x, halfSize.y, halfSize.z),
    ];

    const particles = corners.map(corner => {
      const finalPosition = corner.clone().add(position);
      const particle = new Particle({
        position: { x: finalPosition.x, y: finalPosition.y, z: finalPosition.z },
        mass: particleMass,
      });
      composite.addParticle(particle);
      return particle;
    });

    // Create edge constraints
    const edges = [
      // Bottom face
      [0, 1], [1, 2], [2, 3], [3, 0],
      // Top face
      [4, 5], [5, 6], [6, 7], [7, 4],
      // Vertical edges
      [0, 4], [1, 5], [2, 6], [3, 7],
      // Diagonal constraints for stability
      [0, 2], [1, 3], [4, 6], [5, 7],
      [0, 5], [1, 4], [2, 7], [3, 6],
    ];

    edges.forEach(([a, b]) => {
      composite.addConstraint(
        new Constraint(particles[a], particles[b], undefined, stiffness)
      );
    });

    return composite;
  }

  /**
   * Create a soft body ball
   */
  static createSoftBall(
    center: Vector3 = new Vector3(),
    radius: number = 50,
    resolution: number = 8,
    particleMass: number = 0.5,
    stiffness: number = 0.7
  ): Composite {
    const composite = new Composite({ name: 'Soft Ball' });
    const particles: Particle[] = [];
    
    // Create center particle
    const centerParticle = new Particle({
      position: { x: center.x, y: center.y, z: center.z },
      mass: particleMass * 2,
    });
    composite.addParticle(centerParticle);
    particles.push(centerParticle);
    
    // Create surface particles
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
    for (let i = 0; i < resolution; i++) {
      const y = 1 - (i / (resolution - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;
      
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      
      const particle = new Particle({
        position: {
          x: center.x + x * radius,
          y: center.y + y * radius,
          z: center.z + z * radius
        },
        mass: particleMass,
      });
      
      composite.addParticle(particle);
      particles.push(particle);
    }
    
    // Connect all surface particles to center
    for (let i = 1; i < particles.length; i++) {
      composite.addConstraint(
        new Constraint(centerParticle, particles[i], radius, stiffness)
      );
    }
    
    // Connect nearby surface particles
    for (let i = 1; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dist = particles[i].position.distanceTo(particles[j].position);
        if (dist < radius * 0.8) {
          composite.addConstraint(
            new Constraint(particles[i], particles[j], dist, stiffness * 0.5)
          );
        }
      }
    }
    
    return composite;
  }

  /**
   * Create a bridge
   */
  static createBridge(
    start: Vector3,
    end: Vector3,
    segments: number = 10,
    height: number = 30,
    particleMass: number = 1,
    stiffness: number = 0.95
  ): Composite {
    const composite = new Composite({ name: 'Bridge' });
    const deckParticles: Particle[] = [];
    const towerParticles: Particle[] = [];
    
    // Create deck particles
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const position = new Vector3(
        start.x + (end.x - start.x) * t,
        start.y,
        start.z + (end.z - start.z) * t
      );
      
      const particle = new Particle({
        position: { x: position.x, y: position.y, z: position.z },
        mass: particleMass,
        fixed: i === 0 || i === segments, // Fix ends
      });
      
      deckParticles.push(particle);
      composite.addParticle(particle);
    }
    
    // Create tower particles
    const towerPositions = [0, segments];
    towerPositions.forEach(idx => {
      const baseParticle = deckParticles[idx];
      const towerTop = new Particle({
        position: {
          x: baseParticle.position.x,
          y: baseParticle.position.y + height,
          z: baseParticle.position.z
        },
        mass: particleMass * 2,
        fixed: true,
      });
      towerParticles.push(towerTop);
      composite.addParticle(towerTop);
    });
    
    // Connect deck segments
    for (let i = 0; i < deckParticles.length - 1; i++) {
      composite.addConstraint(
        new Constraint(deckParticles[i], deckParticles[i + 1], undefined, stiffness)
      );
    }
    
    // Create suspension cables
    deckParticles.forEach((particle, idx) => {
      if (idx === 0 || idx === segments) return;
      
      const nearestTower = idx < segments / 2 ? 0 : 1;
      composite.addConstraint(
        new Constraint(particle, towerParticles[nearestTower], undefined, stiffness * 0.9)
      );
    });
    
    return composite;
  }

  /**
   * Create a chain with rigid links
   */
  static createChain(
    start: Vector3,
    end: Vector3,
    links: number = 8,
    linkLength: number = 15,
    particleMass: number = 2,
    stiffness: number = 0.99
  ): Composite {
    const composite = new Composite({ name: 'Chain' });
    const particles: Particle[] = [];
    
    const direction = end.clone().sub(start).normalize();
    
    // Create two particles per link
    for (let i = 0; i <= links; i++) {
      const basePos = start.clone().addScaled(direction, i * linkLength);
      
      // Create link particles (simulating link shape)
      const p1 = new Particle({
        position: {
          x: basePos.x - 2,
          y: basePos.y,
          z: basePos.z
        },
        mass: particleMass,
        fixed: i === 0,
      });
      
      const p2 = new Particle({
        position: {
          x: basePos.x + 2,
          y: basePos.y,
          z: basePos.z
        },
        mass: particleMass,
        fixed: i === 0,
      });
      
      particles.push(p1, p2);
      composite.addParticle(p1);
      composite.addParticle(p2);
      
      // Connect link particles (rigid link)
      composite.addConstraint(
        new Constraint(p1, p2, 4, stiffness)
      );
    }
    
    // Connect links
    for (let i = 0; i < links; i++) {
      const idx = i * 2;
      // Connect to next link
      composite.addConstraint(
        new Constraint(particles[idx], particles[idx + 2], linkLength, stiffness * 0.95)
      );
      composite.addConstraint(
        new Constraint(particles[idx + 1], particles[idx + 3], linkLength, stiffness * 0.95)
      );
      // Cross connection for stability
      composite.addConstraint(
        new Constraint(particles[idx], particles[idx + 3], linkLength, stiffness * 0.9)
      );
      composite.addConstraint(
        new Constraint(particles[idx + 1], particles[idx + 2], linkLength, stiffness * 0.9)
      );
    }
    
    return composite;
  }

  /**
   * Create a pendulum
   */
  static createPendulum(
    anchor: Vector3,
    length: number = 100,
    segments: number = 1,
    particleMass: number = 5,
    stiffness: number = 1
  ): Composite {
    const composite = new Composite({ name: 'Pendulum' });
    const particles: Particle[] = [];
    
    // Create anchor particle
    const anchorParticle = new Particle({
      position: { x: anchor.x, y: anchor.y, z: anchor.z },
      mass: 0,
      fixed: true,
    });
    particles.push(anchorParticle);
    composite.addParticle(anchorParticle);
    
    // Create pendulum particles
    const segmentLength = length / segments;
    for (let i = 1; i <= segments; i++) {
      const particle = new Particle({
        position: {
          x: anchor.x,
          y: anchor.y - (i * segmentLength),
          z: anchor.z
        },
        mass: i === segments ? particleMass * 2 : particleMass,
        radius: i === segments ? 8 : 5,
      });
      
      particles.push(particle);
      composite.addParticle(particle);
    }
    
    // Connect particles
    for (let i = 0; i < particles.length - 1; i++) {
      composite.addConstraint(
        new Constraint(particles[i], particles[i + 1], segmentLength, stiffness)
      );
    }
    
    return composite;
  }

  /**
   * Create a wheel
   */
  static createWheel(
    center: Vector3 = new Vector3(),
    radius: number = 50,
    spokes: number = 8,
    particleMass: number = 1,
    stiffness: number = 0.95
  ): Composite {
    const composite = new Composite({ name: 'Wheel' });
    
    // Create center particle
    const centerParticle = new Particle({
      position: { x: center.x, y: center.y, z: center.z },
      mass: particleMass * 2,
      radius: 6,
    });
    composite.addParticle(centerParticle);
    
    // Create rim particles
    const rimParticles: Particle[] = [];
    for (let i = 0; i < spokes; i++) {
      const angle = (i / spokes) * Math.PI * 2;
      const x = center.x + Math.cos(angle) * radius;
      const y = center.y + Math.sin(angle) * radius;
      
      const particle = new Particle({
        position: { x, y, z: center.z },
        mass: particleMass,
      });
      
      rimParticles.push(particle);
      composite.addParticle(particle);
    }
    
    // Create spokes (connect center to rim)
    rimParticles.forEach(particle => {
      composite.addConstraint(
        new Constraint(centerParticle, particle, radius, stiffness)
      );
    });
    
    // Connect rim particles
    for (let i = 0; i < rimParticles.length; i++) {
      const next = (i + 1) % rimParticles.length;
      composite.addConstraint(
        new Constraint(rimParticles[i], rimParticles[next], undefined, stiffness)
      );
      
      // Add cross bracing for stability
      const opposite = (i + Math.floor(spokes / 2)) % spokes;
      if (opposite !== i) {
        composite.addConstraint(
          new Constraint(rimParticles[i], rimParticles[opposite], undefined, stiffness * 0.8)
        );
      }
    }
    
    return composite;
  }
}
