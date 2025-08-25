import { Vector3, vec3 } from '../physics/Vector3';
import { generateId } from '../../utils/id';

// Temporary: Define ParticleOptions here to avoid circular dependency
interface ParticleOptions {
  position: { x: number; y: number; z: number };
  previousPosition?: { x: number; y: number; z: number };
  mass?: number;
  radius?: number;
  damping?: number;
  fixed?: boolean;
  color?: string;
  metadata?: Record<string, any>;
}

export class Particle {
  public id: string;
  public position: Vector3;
  public previousPosition: Vector3;
  public acceleration: Vector3;
  public mass: number;
  public radius: number;
  public damping: number;
  public fixed: boolean;
  public color: string;
  public metadata: Record<string, any>;
  
  constructor(options: ParticleOptions) {
    this.id = generateId();
    this.position = Vector3.from(options.position);
    this.previousPosition = options.previousPosition 
      ? Vector3.from(options.previousPosition) 
      : this.position.clone();
    this.acceleration = Vector3.zero();
    this.mass = options.mass ?? 1;
    this.radius = options.radius ?? 0.15;
    this.damping = options.damping ?? 0.99; // Reduced damping for gravity visibility
    this.fixed = options.fixed ?? false;
    this.color = options.color ?? '#ffffff';
    this.metadata = options.metadata ?? {};
  }

  /**
   * Apply a force to the particle (F = ma, so a = F/m)
   */
  applyForce(force: Vector3): void {
    if (!this.fixed && this.mass > 0) {
      this.acceleration.addScaled(force, 1 / this.mass);
    }
  }

  /**
   * Update particle position using Verlet integration
   */
  update(deltaTime: number): void {
    if (this.fixed) return;

    // Calculate velocity from positions (implicit velocity in Verlet)
    const velocity = vec3.sub(this.position, this.previousPosition);
    
    // Apply velocity threshold - if moving very slowly, stop completely
    const velocityMagnitude = velocity.length();
    if (velocityMagnitude < 0.00001) { // Much smaller threshold
      // Stop micro-movements by setting previous position to current
      this.previousPosition.copy(this.position);
      this.acceleration.multiply(0);
      return;
    }
    
    // Store current position
    const currentPos = this.position.clone();
    
    // Verlet integration: x(t+dt) = x(t) + (x(t) - x(t-dt)) * damping + a(t) * dt²
    this.position
      .add(velocity.multiply(this.damping))  // Apply damping to velocity
      .addScaled(this.acceleration, deltaTime * deltaTime);
    
    // Update previous position
    this.previousPosition = currentPos;
    
    // Reset acceleration
    this.acceleration.multiply(0);
  }

  /**
   * Set velocity by manipulating previous position
   */
  setVelocity(velocity: Vector3): void {
    this.previousPosition = vec3.sub(this.position, velocity);
  }

  /**
   * Get current velocity
   */
  getVelocity(): Vector3 {
    return vec3.sub(this.position, this.previousPosition);
  }

  /**
   * Pin particle to a specific position
   */
  pin(position?: Vector3): void {
    this.fixed = true;
    if (position) {
      this.position.copy(position);
      this.previousPosition.copy(position);
    }
  }

  /**
   * Unpin particle
   */
  unpin(): void {
    this.fixed = false;
  }

  /**
   * Reset particle to a new position with zero velocity
   */
  resetPosition(position: Vector3): void {
    this.position.copy(position);
    this.previousPosition.copy(position);
    this.acceleration.multiply(0);
  }

  /**
   * Set initial velocity (sets previous position based on current position and desired velocity)
   */
  setInitialVelocity(velocity: Vector3): void {
    this.previousPosition = vec3.sub(this.position, velocity);
  }

  /**
   * Get current velocity
   */
  getCurrentVelocity(): Vector3 {
    return vec3.sub(this.position, this.previousPosition);
  }

  /**
   * Check collision with another particle
   */
  collidesWith(other: Particle): boolean {
    const minDistance = this.radius + other.radius;
    return this.position.distanceSquared(other.position) < minDistance * minDistance;
  }

  /**
   * Resolve collision with another particle
   */
  resolveCollision(other: Particle): void {
    if (this.fixed && other.fixed) return;

    const delta = vec3.sub(this.position, other.position);
    const distance = delta.length();
    const minDistance = this.radius + other.radius;

    if (distance < minDistance && distance > 0) {
      // Calculate overlap
      const overlap = minDistance - distance;
      
      // Normalize delta
      delta.divide(distance);
      
      // Calculate mass ratios
      const totalMass = this.mass + other.mass;
      const ratio1 = this.fixed ? 0 : other.mass / totalMass;
      const ratio2 = other.fixed ? 0 : this.mass / totalMass;
      
      // Separate particles
      if (!this.fixed) {
        this.position.addScaled(delta, overlap * ratio1);
      }
      if (!other.fixed) {
        other.position.addScaled(delta, -overlap * ratio2);
      }
    }
  }

  /**
   * Apply bounds constraint
   */
  applyBounds(min: Vector3, max: Vector3): void {
    if (this.fixed) return;

    // X bounds
    if (this.position.x - this.radius < min.x) {
      this.position.x = min.x + this.radius;
      this.previousPosition.x = this.position.x;
    } else if (this.position.x + this.radius > max.x) {
      this.position.x = max.x - this.radius;
      this.previousPosition.x = this.position.x;
    }

    // Y bounds
    if (this.position.y - this.radius < min.y) {
      this.position.y = min.y + this.radius;
      this.previousPosition.y = this.position.y;
    } else if (this.position.y + this.radius > max.y) {
      this.position.y = max.y - this.radius;
      this.previousPosition.y = this.position.y;
    }

    // Z bounds
    if (this.position.z - this.radius < min.z) {
      this.position.z = min.z + this.radius;
      this.previousPosition.z = this.position.z;
    } else if (this.position.z + this.radius > max.z) {
      this.position.z = max.z - this.radius;
      this.previousPosition.z = this.position.z;
    }
  }

  /**
   * Serialize particle data
   */
  serialize(): object {
    return {
      id: this.id,
      position: this.position.toArray(),
      previousPosition: this.previousPosition.toArray(),
      mass: this.mass,
      radius: this.radius,
      damping: this.damping,
      fixed: this.fixed,
      color: this.color,
      metadata: this.metadata,
    };
  }
}
