import { Particle } from './Particle';
import { vec3 } from '../physics/Vector3';
import { generateId } from '../../utils/id';

export class Constraint {
  public id: string;
  public particleA: Particle;
  public particleB: Particle;
  public restLength: number;
  public stiffness: number;
  public breakingThreshold: number;
  private broken: boolean = false;

  constructor(
    particleA: Particle,
    particleB: Particle,
    restLength?: number,
    stiffness: number = 1,
    breakingThreshold: number = Infinity
  ) {
    this.id = generateId('constraint');
    this.particleA = particleA;
    this.particleB = particleB;
    this.restLength = restLength ?? particleA.position.distance(particleB.position);
    this.stiffness = Math.min(1, Math.max(0, stiffness)); // Clamp between 0 and 1
    this.breakingThreshold = breakingThreshold;
  }

  /**
   * Update constraint - apply forces to maintain rest length
   */
  update(): void {
    if (this.broken) return;

    const delta = vec3.sub(this.particleB.position, this.particleA.position);
    const distance = delta.length();

    if (distance === 0) return; // Prevent division by zero

    // Check if constraint should break
    if (distance > this.breakingThreshold) {
      this.break();
      return;
    }

    // Calculate the difference from rest length
    const difference = this.restLength - distance;
    
    // Normalize delta
    delta.divide(distance);
    
    // Calculate correction based on stiffness
    const correction = delta.multiply(difference * this.stiffness);
    
    // Calculate mass ratios for distributing the correction
    const totalMass = this.particleA.mass + this.particleB.mass;
    const ratioA = this.particleA.fixed ? 0 : this.particleB.mass / totalMass;
    const ratioB = this.particleB.fixed ? 0 : this.particleA.mass / totalMass;
    
    // Apply corrections
    if (!this.particleA.fixed) {
      this.particleA.position.addScaled(correction, -ratioA);
    }
    if (!this.particleB.fixed) {
      this.particleB.position.addScaled(correction, ratioB);
    }
  }

  /**
   * Break the constraint
   */
  break(): void {
    this.broken = true;
  }

  /**
   * Check if constraint is broken
   */
  isBroken(): boolean {
    return this.broken;
  }

  /**
   * Repair a broken constraint
   */
  repair(): void {
    this.broken = false;
  }

  /**
   * Get current length
   */
  getCurrentLength(): number {
    return this.particleA.position.distance(this.particleB.position);
  }

  /**
   * Get stress ratio (current length / rest length)
   */
  getStressRatio(): number {
    return this.getCurrentLength() / this.restLength;
  }

  /**
   * Serialize constraint data
   */
  serialize(): object {
    return {
      id: this.id,
      particleAId: this.particleA.id,
      particleBId: this.particleB.id,
      restLength: this.restLength,
      stiffness: this.stiffness,
      breakingThreshold: this.breakingThreshold,
      broken: this.broken,
    };
  }
}
