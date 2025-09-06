import { Particle } from '../primitives/Particle';
import { Constraint } from '../primitives/Constraint';
import { Vector3 } from './Vector3';
import { SpatialHash } from '../systems/SpatialHash';

// Local interface to avoid circular dependency
interface IVector3 {
  x: number;
  y: number;
  z: number;
}

interface PhysicsConfig {
  gravity: IVector3;
  timeStep: number;
  iterations: number;
  bounds?: {
    min: IVector3;
    max: IVector3;
  };
  damping: number;
}

export class VerletEngine {
  private particles: Map<string, Particle> = new Map();
  private constraints: Map<string, Constraint> = new Map();
  private spatialHash: SpatialHash;
  public config: PhysicsConfig;
  private isPaused: boolean = true; // Start paused, will be resumed when play is pressed
  private time: number = 0;
  private groundEnabled: boolean = true;
  private groundLevel: number = 0;
  
  // Public properties for environmental controls
  public gravity: Vector3;
  public groundBounce: number = 0.8;
  public groundFriction: number = 0.95;
  public timeScale: number = 1;

  constructor(config: Partial<PhysicsConfig> = {}) {
    this.config = {
      gravity: new Vector3(0, -9.81, 0), // Standard gravity
      timeStep: 0.016, // 60 FPS
      iterations: 2,
      damping: 0.98, // Balanced damping for testing
      bounds: {
        min: new Vector3(-50, -50, -50),
        max: new Vector3(50, 50, 50),
      },
      ...config,
    };
    
    // Initialize public gravity reference
    this.gravity = this.config.gravity as Vector3;

    // Initialize spatial hash for collision detection
    const bounds = this.config.bounds!;
    const cellSize = 2; // Adjust based on typical particle size
    this.spatialHash = new SpatialHash(bounds.min as Vector3, bounds.max as Vector3, cellSize);
  }

  /**
   * Add a particle to the engine
   */
  addParticle(particle: Particle): void {
    this.particles.set(particle.id, particle);
    this.spatialHash.insert(particle);
  }

  /**
   * Remove a particle from the engine
   */
  removeParticle(particleId: string): void {
    const particle = this.particles.get(particleId);
    if (particle) {
      this.particles.delete(particleId);
      this.spatialHash.remove(particle);
      
      // Remove any constraints connected to this particle
      const constraintsToRemove: string[] = [];
      this.constraints.forEach((constraint, id) => {
        if (constraint.particleA.id === particleId || constraint.particleB.id === particleId) {
          constraintsToRemove.push(id);
        }
      });
      constraintsToRemove.forEach(id => this.constraints.delete(id));
    }
  }

  /**
   * Add a constraint to the engine
   */
  addConstraint(constraint: Constraint): void {
    this.constraints.set(constraint.id, constraint);
  }

  /**
   * Remove a constraint from the engine
   */
  removeConstraint(constraintId: string): void {
    this.constraints.delete(constraintId);
  }

  /**
   * Get particle by ID
   */
  getParticle(id: string): Particle | undefined {
    return this.particles.get(id);
  }

  /**
   * Get constraint by ID
   */
  getConstraint(id: string): Constraint | undefined {
    return this.constraints.get(id);
  }

  /**
   * Get all particles
   */
  getParticles(): Particle[] {
    return Array.from(this.particles.values());
  }

  /**
   * Get all constraints
   */
  getConstraints(): Constraint[] {
    return Array.from(this.constraints.values());
  }

  /**
   * Update the physics simulation
   */
  update(deltaTime?: number): void {
    if (this.isPaused) return;

    const dt = (deltaTime ?? this.config.timeStep) * this.timeScale;
    this.time += dt;

    // Apply gravity to all particles
    this.particles.forEach(particle => {
      if (!particle.fixed) {
        const gravityForce = Vector3.from(this.gravity).multiply(particle.mass);
        particle.applyForce(gravityForce);
      }
    });

    // Update particle positions
    this.particles.forEach(particle => {
      particle.update(dt);
    });

    // Update spatial hash
    this.spatialHash.update(this.getParticles());

    // Apply ground collision first (before constraint solving)
    if (this.groundEnabled) {
      this.particles.forEach(particle => {
        this.applyGroundCollision(particle);
      });
    }

    // Solve constraints and collisions multiple times for stability
    for (let i = 0; i < this.config.iterations; i++) {
      // Update constraints
      this.constraints.forEach(constraint => {
        constraint.update();
      });

      // Handle collisions
      this.handleCollisions();

      // Apply bounds
      if (this.config.bounds) {
        this.particles.forEach(particle => {
          particle.applyBounds(this.config.bounds!.min, this.config.bounds!.max);
        });
      }
    }

    // Remove broken constraints
    const brokenConstraints: string[] = [];
    this.constraints.forEach((constraint, id) => {
      if (constraint.isBroken()) {
        brokenConstraints.push(id);
      }
    });
    brokenConstraints.forEach(id => this.constraints.delete(id));
  }

  /**
   * Handle particle collisions using spatial hash
   */
  private handleCollisions(): void {
    this.particles.forEach(particle => {
      const nearby = this.spatialHash.getNearby(particle);
      nearby.forEach(other => {
        if (particle.id !== other.id && particle.collidesWith(other)) {
          particle.resolveCollision(other);
        }
      });
    });
  }

  /**
   * Apply ground collision to a particle
   */
  private applyGroundCollision(particle: Particle): void {
    if (particle.fixed) return;

    const groundY = this.groundLevel;
    const particleBottom = particle.position.y - particle.radius;

    if (particleBottom < groundY) {
      // Position the sphere so its bottom touches the ground
      const correctedY = groundY + particle.radius;
      
      // Calculate how much we're penetrating
      const penetration = groundY - particleBottom;
      
      // Get current velocity (Verlet: velocity = current_pos - previous_pos)
      const velocityY = particle.position.y - particle.previousPosition.y;
      
      // Only apply bounce if the particle is moving downward (negative velocity in Verlet)
      if (velocityY < -0.005) { // Small threshold to prevent micro-bounces
        // Use the configurable ground bounce
        const restitution = this.groundBounce;
        
        // Reflect and dampen the velocity
        const newVelocityY = -velocityY * restitution;
        
        // Ensure minimum bounce velocity to prevent sticking
        const minBounceVelocity = 0.02;
        const finalVelocityY = Math.max(newVelocityY, minBounceVelocity);
        
        // Update positions for proper Verlet integration
        particle.position.y = correctedY;
        particle.previousPosition.y = correctedY - finalVelocityY;
        
        // Apply configurable friction to horizontal movement
        const friction = this.groundFriction;
        const velocityX = particle.position.x - particle.previousPosition.x;
        const velocityZ = particle.position.z - particle.previousPosition.z;
        
        particle.previousPosition.x = particle.position.x - (velocityX * friction);
        particle.previousPosition.z = particle.position.z - (velocityZ * friction);
      } else {
        // If moving upward or just resting, correct position but preserve upward motion
        particle.position.y = correctedY;
        
        // If the velocity is very small, stop the particle to prevent jitter
        if (Math.abs(velocityY) < 0.01) {
          particle.previousPosition.y = particle.position.y;
          
          // Also stop horizontal movement when resting
          const velocityX = particle.position.x - particle.previousPosition.x;
          const velocityZ = particle.position.z - particle.previousPosition.z;
          
          if (Math.abs(velocityX) < 0.01) particle.previousPosition.x = particle.position.x;
          if (Math.abs(velocityZ) < 0.01) particle.previousPosition.z = particle.position.z;
        }
      }
    }
  }

  /**
   * Pause the simulation
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * Resume the simulation
   */
  resume(): void {
    this.isPaused = false;
    this.time = 0;
    
    // Reset all particles to ensure they can move when resuming
    this.particles.forEach(particle => {
      if (!particle.fixed) {
        // Reset previous position to current position to clear any accumulated damping
        particle.previousPosition.copy(particle.position);
        // Give a more significant initial downward velocity to help particles start falling
        particle.previousPosition.y += 0.01; // Larger initial velocity
        // Clear any accumulated acceleration
        particle.acceleration.multiply(0);
      }
    });
  }

  /**
   * Reset the simulation
   */
  reset(): void {
    this.particles.clear();
    this.constraints.clear();
    this.spatialHash.clear();
    this.time = 0;
  }

  /**
   * Get simulation time
   */
  getTime(): number {
    return this.time;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PhysicsConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update spatial hash if bounds changed
    if (config.bounds) {
      const bounds = this.config.bounds!;
      this.spatialHash = new SpatialHash(bounds.min, bounds.max, 2);
      this.spatialHash.update(this.getParticles());
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): PhysicsConfig {
    return { ...this.config };
  }

  /**
   * Enable or disable ground collision
   */
  setGroundEnabled(enabled: boolean): void {
    this.groundEnabled = enabled;
  }

  /**
   * Get ground enabled state
   */
  isGroundEnabled(): boolean {
    return this.groundEnabled;
  }

  /**
   * Set ground level
   */
  setGroundLevel(level: number): void {
    this.groundLevel = level;
  }

  /**
   * Get ground level
   */
  getGroundLevel(): number {
    return this.groundLevel;
  }

  /**
   * Serialize engine state
   */
  serialize(): object {
    return {
      config: this.config,
      particles: this.getParticles().map(p => p.serialize()),
      constraints: this.getConstraints().map(c => c.serialize()),
      time: this.time,
    };
  }
}
