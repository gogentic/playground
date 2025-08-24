import { Vector3 as ThreeVector3 } from 'three';
import { Vector3 } from '../core/physics/Vector3';

/**
 * Utility functions to convert between our physics Vector3 and Three.js Vector3
 */

export function toThreeVector3(v: Vector3): ThreeVector3 {
  return new ThreeVector3(v.x, v.y, v.z);
}

export function fromThreeVector3(v: ThreeVector3): Vector3 {
  return new Vector3(v.x, v.y, v.z);
}

export function updateThreeVector3(target: ThreeVector3, source: Vector3): ThreeVector3 {
  target.set(source.x, source.y, source.z);
  return target;
}
