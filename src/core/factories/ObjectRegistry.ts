import { Particle } from '../primitives/Particle';
import { CompositeFactory } from '../primitives/Composite';
import { Vector3 } from '../physics/Vector3';
import objectTemplates from '../../config/objectTemplates.json';

export interface ObjectTemplate {
  id: string;
  name: string;
  factory: string;
  description?: string;
  defaultParams: Record<string, any>;
  controls?: Array<{
    param: string;
    label: string;
    type: string;
    min?: number;
    max?: number;
  }>;
}

export interface ObjectCategory {
  id: string;
  name: string;
  icon?: string;
  objects: ObjectTemplate[];
}

export class ObjectRegistry {
  private factories: Map<string, Function> = new Map();
  private categories: ObjectCategory[] = objectTemplates.categories;
  
  constructor() {
    this.registerFactories();
  }
  
  private registerFactories() {
    // Single particle
    this.factories.set('particle', (params: any) => {
      const position = params.randomPosition ? {
        x: Math.random() * 10 - 5,
        y: 10,
        z: Math.random() * 10 - 5
      } : {
        x: params.x || 0,
        y: params.y || 10,
        z: params.z || 0
      };
      
      return new Particle({
        position,
        mass: params.mass || 1,
        radius: params.radius || 0.5,
        damping: params.damping || 0.99,
        fixed: params.fixed || false,
        color: params.color || `hsl(${Math.random() * 360}, 70%, 60%)`
      });
    });
    
    // Rope
    this.factories.set('rope', (params: any) => {
      return CompositeFactory.createRope(
        new Vector3(params.startX || -5, params.startY || 10, params.startZ || 0),
        new Vector3(params.endX || 5, params.endY || 10, params.endZ || 0),
        params.segments || 10,
        params.mass || 0.5,
        params.stiffness || 0.9
      );
    });
    
    // Cloth
    this.factories.set('cloth', (params: any) => {
      return CompositeFactory.createCloth(
        params.width || 10,
        params.height || 10,
        params.segmentsX || 10,
        params.segmentsY || 10,
        new Vector3(0, params.positionY || 10, 0),
        params.mass || 0.1,
        params.stiffness || 0.95
      );
    });
    
    // Box
    this.factories.set('box', (params: any) => {
      return CompositeFactory.createBox(
        new Vector3(params.sizeX || 5, params.sizeY || 5, params.sizeZ || 5),
        new Vector3(params.positionX || 0, params.positionY || 10, params.positionZ || 0),
        params.mass || 1,
        params.damping || 0.99
      );
    });
    
    // Soft Ball
    this.factories.set('softBall', (params: any) => {
      return CompositeFactory.createSoftBall(
        new Vector3(params.centerX || 0, params.centerY || 10, params.centerZ || 0),
        params.radius || 5,
        params.segments || 12,
        params.mass || 0.5,
        params.stiffness || 0.7
      );
    });
    
    // Bridge
    this.factories.set('bridge', (params: any) => {
      return CompositeFactory.createBridge(
        new Vector3(params.startX || -15, params.startY || 10, params.startZ || 0),
        new Vector3(params.endX || 15, params.endY || 10, params.endZ || 0),
        params.segments || 12,
        params.height || 8,
        params.mass || 1,
        params.stiffness || 0.95
      );
    });
    
    // Chain
    this.factories.set('chain', (params: any) => {
      return CompositeFactory.createChain(
        new Vector3(params.startX || 0, params.startY || 15, params.startZ || 0),
        new Vector3(params.endX || 0, params.endY || 5, params.endZ || 0),
        params.segments || 8,
        params.linkRadius || 1.5,
        params.mass || 2,
        params.damping || 0.99
      );
    });
    
    // Pendulum
    this.factories.set('pendulum', (params: any) => {
      return CompositeFactory.createPendulum(
        new Vector3(params.anchorX || 0, params.anchorY || 15, params.anchorZ || 0),
        params.length || 10,
        params.bobRadius || 3,
        params.bobMass || 2,
        params.ropeSegments || 1
      );
    });
    
    // Wheel
    this.factories.set('wheel', (params: any) => {
      return CompositeFactory.createWheel(
        new Vector3(params.centerX || 0, params.centerY || 10, params.centerZ || 0),
        params.radius || 5,
        params.spokes || 12,
        params.mass || 1,
        params.stiffness || 0.95
      );
    });
  }
  
  getCategories(): ObjectCategory[] {
    return this.categories;
  }
  
  getTemplate(templateId: string): ObjectTemplate | null {
    for (const category of this.categories) {
      const template = category.objects.find(obj => obj.id === templateId);
      if (template) return template;
    }
    return null;
  }
  
  createObject(templateId: string, customParams?: Record<string, any>): any {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Unknown template: ${templateId}`);
    }
    
    const factory = this.factories.get(template.factory);
    if (!factory) {
      throw new Error(`Unknown factory: ${template.factory}`);
    }
    
    // Merge default params with custom params
    const params = { ...template.defaultParams, ...customParams };
    return factory(params);
  }
  
  // Create from factory ID directly (for backwards compatibility)
  createFromFactory(factoryId: string, params: any): any {
    const factory = this.factories.get(factoryId);
    if (!factory) {
      throw new Error(`Unknown factory: ${factoryId}`);
    }
    return factory(params);
  }
}