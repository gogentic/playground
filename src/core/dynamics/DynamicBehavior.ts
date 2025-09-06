import { Vector3 } from '../physics/Vector3';
import { Particle } from '../primitives/Particle';

export enum DynamicType {
  OSCILLATOR = 'oscillator',
  PULSAR = 'pulsar',
  ATTRACTOR = 'attractor',
  REPULSOR = 'repulsor',
  VORTEX = 'vortex',
  NOISE = 'noise',
  WAVE = 'wave'
}

export interface DynamicBehavior {
  type: DynamicType;
  enabled: boolean;
  amplitude: number;
  frequency: number;
  phase: number;
  axis?: Vector3;
  center?: Vector3;
  radius?: number;
  strength?: number;
  damping?: number;
}

export class DynamicsSystem {
  private behaviors: Map<string, DynamicBehavior[]> = new Map();
  private time: number = 0;
  
  /**
   * Add a dynamic behavior to a particle
   */
  addBehavior(particleId: string, behavior: DynamicBehavior): void {
    if (!this.behaviors.has(particleId)) {
      this.behaviors.set(particleId, []);
    }
    this.behaviors.get(particleId)!.push(behavior);
  }
  
  /**
   * Remove a behavior from a particle
   */
  removeBehavior(particleId: string, type: DynamicType): void {
    const behaviors = this.behaviors.get(particleId);
    if (behaviors) {
      const index = behaviors.findIndex(b => b.type === type);
      if (index !== -1) {
        behaviors.splice(index, 1);
      }
      if (behaviors.length === 0) {
        this.behaviors.delete(particleId);
      }
    }
  }
  
  /**
   * Clear all behaviors for a particle
   */
  clearBehaviors(particleId: string): void {
    this.behaviors.delete(particleId);
  }
  
  /**
   * Get behaviors for a particle
   */
  getBehaviors(particleId: string): DynamicBehavior[] {
    return this.behaviors.get(particleId) || [];
  }
  
  /**
   * Apply dynamics to particles
   */
  applyDynamics(particles: Particle[], deltaTime: number): void {
    this.time += deltaTime;
    
    particles.forEach(particle => {
      const behaviors = this.behaviors.get(particle.id);
      if (!behaviors || behaviors.length === 0) return;
      
      behaviors.forEach(behavior => {
        if (!behavior.enabled) return;
        
        switch (behavior.type) {
          case DynamicType.OSCILLATOR:
            this.applyOscillator(particle, behavior);
            break;
          case DynamicType.PULSAR:
            this.applyPulsar(particle, behavior);
            break;
          case DynamicType.ATTRACTOR:
            this.applyAttractor(particle, behavior, particles);
            break;
          case DynamicType.REPULSOR:
            this.applyRepulsor(particle, behavior, particles);
            break;
          case DynamicType.VORTEX:
            this.applyVortex(particle, behavior);
            break;
          case DynamicType.NOISE:
            this.applyNoise(particle, behavior);
            break;
          case DynamicType.WAVE:
            this.applyWave(particle, behavior);
            break;
        }
      });
    });
  }
  
  /**
   * Oscillator: Sinusoidal motion along an axis
   */
  private applyOscillator(particle: Particle, behavior: DynamicBehavior): void {
    const axis = behavior.axis || new Vector3(0, 1, 0);
    const displacement = Math.sin(this.time * behavior.frequency + behavior.phase) * behavior.amplitude;
    
    const force = axis.clone().normalize().multiply(displacement * 0.1);
    particle.position.add(force);
  }
  
  /**
   * Pulsar: Periodic force impulse
   */
  private applyPulsar(particle: Particle, behavior: DynamicBehavior): void {
    const pulse = Math.sin(this.time * behavior.frequency + behavior.phase);
    if (pulse > 0.9) {
      const force = new Vector3(
        (Math.random() - 0.5) * behavior.amplitude,
        Math.random() * behavior.amplitude,
        (Math.random() - 0.5) * behavior.amplitude
      );
      particle.position.add(force);
    }
  }
  
  /**
   * Attractor: Pull nearby particles
   */
  private applyAttractor(particle: Particle, behavior: DynamicBehavior, allParticles: Particle[]): void {
    const center = behavior.center || particle.position;
    const radius = behavior.radius || 10;
    const strength = behavior.strength || 1;
    
    allParticles.forEach(other => {
      if (other.id === particle.id || other.fixed) return;
      
      const distance = other.position.distanceTo(center);
      if (distance < radius && distance > 0.1) {
        const direction = center.clone().sub(other.position).normalize();
        const forceMagnitude = (strength * (1 - distance / radius)) * 0.1;
        const force = direction.multiply(forceMagnitude);
        other.position.add(force);
      }
    });
  }
  
  /**
   * Repulsor: Push away nearby particles
   */
  private applyRepulsor(particle: Particle, behavior: DynamicBehavior, allParticles: Particle[]): void {
    const center = behavior.center || particle.position;
    const radius = behavior.radius || 10;
    const strength = behavior.strength || 1;
    
    allParticles.forEach(other => {
      if (other.id === particle.id || other.fixed) return;
      
      const distance = other.position.distanceTo(center);
      if (distance < radius && distance > 0.1) {
        const direction = other.position.clone().sub(center).normalize();
        const forceMagnitude = (strength * (1 - distance / radius)) * 0.1;
        const force = direction.multiply(forceMagnitude);
        other.position.add(force);
      }
    });
  }
  
  /**
   * Vortex: Swirling motion around an axis
   */
  private applyVortex(particle: Particle, behavior: DynamicBehavior): void {
    const center = behavior.center || new Vector3(0, 0, 0);
    const axis = behavior.axis || new Vector3(0, 1, 0);
    const radius = behavior.radius || 10;
    const strength = behavior.strength || 1;
    
    const toParticle = particle.position.clone().sub(center);
    const distance = toParticle.length();
    
    if (distance < radius && distance > 0.1) {
      // Calculate tangent force (perpendicular to radius)
      const tangent = axis.clone().cross(toParticle).normalize();
      const forceMagnitude = (strength * (1 - distance / radius)) * 0.1;
      const force = tangent.multiply(forceMagnitude);
      particle.position.add(force);
    }
  }
  
  /**
   * Noise: Random jitter
   */
  private applyNoise(particle: Particle, behavior: DynamicBehavior): void {
    const noise = new Vector3(
      (Math.random() - 0.5) * behavior.amplitude,
      (Math.random() - 0.5) * behavior.amplitude,
      (Math.random() - 0.5) * behavior.amplitude
    );
    
    const damping = behavior.damping || 0.1;
    particle.position.add(noise.multiply(damping));
  }
  
  /**
   * Wave: Traveling wave effect
   */
  private applyWave(particle: Particle, behavior: DynamicBehavior): void {
    const axis = behavior.axis || new Vector3(1, 0, 0);
    const wavePosition = particle.position.dot(axis);
    const displacement = Math.sin(wavePosition * 0.1 + this.time * behavior.frequency + behavior.phase) * behavior.amplitude;
    
    const force = new Vector3(0, displacement * 0.1, 0);
    particle.position.add(force);
  }
  
  /**
   * Reset time
   */
  reset(): void {
    this.time = 0;
    this.behaviors.clear();
  }
}