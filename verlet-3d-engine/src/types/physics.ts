/**
 * Core physics types for the Verlet Integration engine
 */

export interface IVector3 {
  x: number;
  y: number;
  z: number;
}

export interface PhysicsConfig {
  gravity: IVector3;
  timeStep: number;
  iterations: number;
  bounds?: {
    min: IVector3;
    max: IVector3;
  };
  damping: number;
}

export interface ParticleOptions {
  position: IVector3;
  previousPosition?: IVector3;
  mass?: number;
  radius?: number;
  damping?: number;
  fixed?: boolean;
  color?: string;
}

export interface ConstraintOptions {
  particleA: string; // ID reference
  particleB: string; // ID reference
  restLength?: number; // If not provided, will be calculated from initial positions
  stiffness?: number;
  breakingThreshold?: number;
}

export type ComponentType = 'particle' | 'constraint' | 'composite';

export interface Component {
  id: string;
  type: ComponentType;
  name: string;
  metadata?: Record<string, any>;
}

// Explicit re-export to ensure module recognition
//export { ParticleOptions, ConstraintOptions, PhysicsConfig, IVector3, ComponentType, Component };
