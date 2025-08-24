import { Particle } from '../primitives/Particle';
import { Vector3 } from '../physics/Vector3';

/**
 * Spatial hash for efficient broad-phase collision detection
 */
export class SpatialHash {
  private cellSize: number;
  private cells: Map<string, Set<Particle>>;
  private particleCells: Map<string, Set<string>>;
  private min: Vector3;
  private max: Vector3;

  constructor(min: Vector3, max: Vector3, cellSize: number) {
    this.min = min;
    this.max = max;
    this.cellSize = cellSize;
    this.cells = new Map();
    this.particleCells = new Map();
  }

  /**
   * Get hash key for a position
   */
  private getHashKey(position: Vector3): string {
    const x = Math.floor(position.x / this.cellSize);
    const y = Math.floor(position.y / this.cellSize);
    const z = Math.floor(position.z / this.cellSize);
    return `${x},${y},${z}`;
  }

  /**
   * Get all hash keys that a particle occupies (considering its radius)
   */
  private getParticleKeys(particle: Particle): string[] {
    const keys: string[] = [];
    const radius = particle.radius;
    
    // Get min and max positions considering radius
    const minX = particle.position.x - radius;
    const maxX = particle.position.x + radius;
    const minY = particle.position.y - radius;
    const maxY = particle.position.y + radius;
    const minZ = particle.position.z - radius;
    const maxZ = particle.position.z + radius;

    // Get all cells the particle overlaps
    const startX = Math.floor(minX / this.cellSize);
    const endX = Math.floor(maxX / this.cellSize);
    const startY = Math.floor(minY / this.cellSize);
    const endY = Math.floor(maxY / this.cellSize);
    const startZ = Math.floor(minZ / this.cellSize);
    const endZ = Math.floor(maxZ / this.cellSize);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        for (let z = startZ; z <= endZ; z++) {
          keys.push(`${x},${y},${z}`);
        }
      }
    }

    return keys;
  }

  /**
   * Insert a particle into the spatial hash
   */
  insert(particle: Particle): void {
    const keys = this.getParticleKeys(particle);
    const cellSet = new Set<string>();

    keys.forEach(key => {
      if (!this.cells.has(key)) {
        this.cells.set(key, new Set());
      }
      this.cells.get(key)!.add(particle);
      cellSet.add(key);
    });

    this.particleCells.set(particle.id, cellSet);
  }

  /**
   * Remove a particle from the spatial hash
   */
  remove(particle: Particle): void {
    const cellKeys = this.particleCells.get(particle.id);
    if (cellKeys) {
      cellKeys.forEach(key => {
        const cell = this.cells.get(key);
        if (cell) {
          cell.delete(particle);
          if (cell.size === 0) {
            this.cells.delete(key);
          }
        }
      });
      this.particleCells.delete(particle.id);
    }
  }

  /**
   * Update the spatial hash with current particle positions
   */
  update(particles: Particle[]): void {
    this.clear();
    particles.forEach(particle => this.insert(particle));
  }

  /**
   * Get all particles near a given particle
   */
  getNearby(particle: Particle): Particle[] {
    const nearby = new Set<Particle>();
    const keys = this.getParticleKeys(particle);

    keys.forEach(key => {
      const cell = this.cells.get(key);
      if (cell) {
        cell.forEach(other => {
          if (other.id !== particle.id) {
            nearby.add(other);
          }
        });
      }
    });

    return Array.from(nearby);
  }

  /**
   * Get all particles in a radius around a position
   */
  getInRadius(position: Vector3, radius: number): Particle[] {
    const particles = new Set<Particle>();
    
    // Calculate cells to check
    const minX = Math.floor((position.x - radius) / this.cellSize);
    const maxX = Math.floor((position.x + radius) / this.cellSize);
    const minY = Math.floor((position.y - radius) / this.cellSize);
    const maxY = Math.floor((position.y + radius) / this.cellSize);
    const minZ = Math.floor((position.z - radius) / this.cellSize);
    const maxZ = Math.floor((position.z + radius) / this.cellSize);

    const radiusSquared = radius * radius;

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const key = `${x},${y},${z}`;
          const cell = this.cells.get(key);
          if (cell) {
            cell.forEach(particle => {
              if (particle.position.distanceSquared(position) <= radiusSquared) {
                particles.add(particle);
              }
            });
          }
        }
      }
    }

    return Array.from(particles);
  }

  /**
   * Clear the spatial hash
   */
  clear(): void {
    this.cells.clear();
    this.particleCells.clear();
  }

  /**
   * Get debug info
   */
  getDebugInfo(): { cellCount: number; particleCount: number } {
    let particleCount = 0;
    this.cells.forEach(cell => {
      particleCount += cell.size;
    });

    return {
      cellCount: this.cells.size,
      particleCount: this.particleCells.size,
    };
  }
}
