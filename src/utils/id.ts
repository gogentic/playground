/**
 * Simple ID generator for particles, constraints, and other entities
 */

let counter = 0;

export function generateId(prefix = 'entity'): string {
  return `${prefix}_${Date.now()}_${counter++}`;
}

export function resetIdCounter(): void {
  counter = 0;
}
