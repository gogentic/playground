/**
 * Optimized Vector3 class for physics calculations
 */

export class Vector3 {
  public x: number;
  public y: number;
  public z: number;

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  static zero(): Vector3 {
    return new Vector3(0, 0, 0);
  }

  static from(v: { x: number; y: number; z: number }): Vector3 {
    return new Vector3(v.x, v.y, v.z);
  }

  clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }

  copy(v: Vector3): Vector3 {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  add(v: Vector3): Vector3 {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  addScaled(v: Vector3, scale: number): Vector3 {
    this.x += v.x * scale;
    this.y += v.y * scale;
    this.z += v.z * scale;
    return this;
  }

  sub(v: Vector3): Vector3 {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  multiply(scalar: number): Vector3 {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
  }

  divide(scalar: number): Vector3 {
    if (scalar !== 0) {
      this.x /= scalar;
      this.y /= scalar;
      this.z /= scalar;
    }
    return this;
  }

  dot(v: Vector3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v: Vector3): Vector3 {
    const x = this.y * v.z - this.z * v.y;
    const y = this.z * v.x - this.x * v.z;
    const z = this.x * v.y - this.y * v.x;
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  lengthSquared(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  normalize(): Vector3 {
    const len = this.length();
    if (len > 0) {
      this.divide(len);
    }
    return this;
  }

  distance(v: Vector3): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  distanceSquared(v: Vector3): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return dx * dx + dy * dy + dz * dz;
  }

  lerp(v: Vector3, alpha: number): Vector3 {
    this.x += (v.x - this.x) * alpha;
    this.y += (v.y - this.y) * alpha;
    this.z += (v.z - this.z) * alpha;
    return this;
  }

  equals(v: Vector3, epsilon = 0.0001): boolean {
    return (
      Math.abs(this.x - v.x) < epsilon &&
      Math.abs(this.y - v.y) < epsilon &&
      Math.abs(this.z - v.z) < epsilon
    );
  }

  toArray(): [number, number, number] {
    return [this.x, this.y, this.z];
  }

  toString(): string {
    return `Vector3(${this.x}, ${this.y}, ${this.z})`;
  }
}

// Static utility methods
export const vec3 = {
  add: (a: Vector3, b: Vector3): Vector3 => a.clone().add(b),
  sub: (a: Vector3, b: Vector3): Vector3 => a.clone().sub(b),
  multiply: (v: Vector3, scalar: number): Vector3 => v.clone().multiply(scalar),
  divide: (v: Vector3, scalar: number): Vector3 => v.clone().divide(scalar),
  dot: (a: Vector3, b: Vector3): number => a.dot(b),
  cross: (a: Vector3, b: Vector3): Vector3 => a.clone().cross(b),
  distance: (a: Vector3, b: Vector3): number => a.distance(b),
  lerp: (a: Vector3, b: Vector3, alpha: number): Vector3 => a.clone().lerp(b, alpha),
};

// Vector3 is now the main export
