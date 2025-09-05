import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, sceneOperations } from '../lib/supabase';
import type { Scene } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  scenes: Scene[];
  currentScene: Scene | null;
  
  // Auth actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  
  // Scene actions
  saveCurrentScene: (name: string, description?: string) => Promise<Scene>;
  updateCurrentScene: () => Promise<void>;
  loadScene: (sceneId: string) => Promise<void>;
  loadUserScenes: () => Promise<void>;
  deleteScene: (sceneId: string) => Promise<void>;
  setCurrentScene: (scene: Scene | null) => void;
  createNewScene: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  scenes: [],
  currentScene: null,
  
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, scenes: [], currentScene: null });
  },
  
  saveCurrentScene: async (name, description) => {
    const { user } = get();
    if (!user) throw new Error('User not authenticated');
    
    // Get the current engine state from the engine store
    const engineStore = (window as any).engineStore;
    if (!engineStore) throw new Error('Engine store not found');
    
    const engine = engineStore.getState().engine;
    if (!engine) throw new Error('Engine not initialized');
    
    // Serialize the current scene
    const particles = engine.getParticles().map((p: any) => ({
      id: p.id,
      position: { x: p.position.x, y: p.position.y, z: p.position.z },
      prevPosition: { x: p.prevPosition.x, y: p.prevPosition.y, z: p.prevPosition.z },
      velocity: { x: p.velocity.x, y: p.velocity.y, z: p.velocity.z },
      mass: p.mass,
      radius: p.radius,
      damping: p.damping,
      color: p.color,
      fixed: p.fixed
    }));
    
    const constraints = engine.getConstraints().map((c: any) => ({
      particleA: c.particleA.id,
      particleB: c.particleB.id,
      restLength: c.restLength,
      stiffness: c.stiffness
    }));
    
    const composites = Array.from(engineStore.getState().composites || []).map(([id, composite]: [any, any]) => ({
      id,
      type: composite.type,
      particles: composite.particles.map((p: any) => p.id),
      constraints: composite.constraints.map((c: any) => ({
        particleA: c.particleA.id,
        particleB: c.particleB.id,
        restLength: c.restLength,
        stiffness: c.stiffness
      }))
    }));
    
    const sceneData = {
      name,
      description,
      data: {
        particles,
        constraints,
        composites,
        environment: {
          gravity: { ...engine.gravity },
          airDamping: engine.airDamping,
          groundBounce: engine.groundBounce,
          groundFriction: engine.groundFriction,
          timeScale: engine.config.timeScale
        }
      },
      is_public: false
    };
    
    const scene = await sceneOperations.saveScene(sceneData);
    set({ currentScene: scene });
    
    // Refresh user scenes
    await get().loadUserScenes();
    
    return scene;
  },
  
  updateCurrentScene: async () => {
    const { currentScene } = get();
    if (!currentScene) throw new Error('No scene loaded');
    
    // Get the current engine state
    const engineStore = (window as any).engineStore;
    if (!engineStore) throw new Error('Engine store not found');
    
    const engine = engineStore.getState().engine;
    if (!engine) throw new Error('Engine not initialized');
    
    // Serialize the current scene
    const particles = engine.getParticles().map((p: any) => ({
      id: p.id,
      position: { x: p.position.x, y: p.position.y, z: p.position.z },
      prevPosition: { x: p.prevPosition.x, y: p.prevPosition.y, z: p.prevPosition.z },
      velocity: { x: p.velocity.x, y: p.velocity.y, z: p.velocity.z },
      mass: p.mass,
      radius: p.radius,
      damping: p.damping,
      color: p.color,
      fixed: p.fixed
    }));
    
    const constraints = engine.getConstraints().map((c: any) => ({
      particleA: c.particleA.id,
      particleB: c.particleB.id,
      restLength: c.restLength,
      stiffness: c.stiffness
    }));
    
    const composites = Array.from(engineStore.getState().composites || []).map(([id, composite]: [any, any]) => ({
      id,
      type: composite.type,
      particles: composite.particles.map((p: any) => p.id),
      constraints: composite.constraints.map((c: any) => ({
        particleA: c.particleA.id,
        particleB: c.particleB.id,
        restLength: c.restLength,
        stiffness: c.stiffness
      }))
    }));
    
    const updates = {
      data: {
        particles,
        constraints,
        composites,
        environment: {
          gravity: { ...engine.gravity },
          airDamping: engine.airDamping,
          groundBounce: engine.groundBounce,
          groundFriction: engine.groundFriction,
          timeScale: engine.config.timeScale
        }
      }
    };
    
    const updatedScene = await sceneOperations.updateScene(currentScene.id, updates);
    set({ currentScene: updatedScene });
    
    // Refresh user scenes
    await get().loadUserScenes();
  },
  
  loadScene: async (sceneId) => {
    const scene = await sceneOperations.loadScene(sceneId);
    
    // Load the scene into the engine
    const engineStore = (window as any).engineStore;
    if (!engineStore) throw new Error('Engine store not found');
    
    // Clear current scene
    engineStore.getState().clearAll();
    
    const engine = engineStore.getState().engine;
    if (!engine) throw new Error('Engine not initialized');
    
    // Restore environment settings
    engine.gravity.x = scene.data.environment.gravity.x;
    engine.gravity.y = scene.data.environment.gravity.y;
    engine.gravity.z = scene.data.environment.gravity.z;
    engine.airDamping = scene.data.environment.airDamping;
    engine.groundBounce = scene.data.environment.groundBounce;
    engine.groundFriction = scene.data.environment.groundFriction;
    engine.config.timeScale = scene.data.environment.timeScale;
    
    // Create particles
    const particleMap = new Map();
    scene.data.particles.forEach((pData: any) => {
      const particle = engineStore.getState().addParticle(
        pData.position,
        pData.mass,
        pData.radius,
        pData.color
      );
      particle.damping = pData.damping;
      particle.fixed = pData.fixed;
      particle.velocity.x = pData.velocity.x;
      particle.velocity.y = pData.velocity.y;
      particle.velocity.z = pData.velocity.z;
      particleMap.set(pData.id, particle);
    });
    
    // Create constraints
    scene.data.constraints.forEach((cData: any) => {
      const particleA = particleMap.get(cData.particleA);
      const particleB = particleMap.get(cData.particleB);
      if (particleA && particleB) {
        engineStore.getState().addConstraint(particleA, particleB);
      }
    });
    
    set({ currentScene: scene });
  },
  
  loadUserScenes: async () => {
    const scenes = await sceneOperations.loadUserScenes();
    set({ scenes });
  },
  
  deleteScene: async (sceneId) => {
    await sceneOperations.deleteScene(sceneId);
    
    // If this was the current scene, clear it
    const { currentScene } = get();
    if (currentScene?.id === sceneId) {
      set({ currentScene: null });
    }
    
    // Refresh user scenes
    await get().loadUserScenes();
  },
  
  setCurrentScene: (scene) => set({ currentScene: scene }),
  
  createNewScene: () => {
    const engineStore = (window as any).engineStore;
    if (engineStore) {
      engineStore.getState().clearAll();
    }
    set({ currentScene: null });
  }
}));

// Initialize auth listener
supabase.auth.onAuthStateChange((event, session) => {
  useAuthStore.getState().setSession(session);
  useAuthStore.getState().setUser(session?.user ?? null);
  useAuthStore.getState().setLoading(false);
  
  // Load user scenes when authenticated
  if (session?.user) {
    useAuthStore.getState().loadUserScenes();
  }
});

// Check initial session
supabase.auth.getSession().then(({ data: { session } }) => {
  useAuthStore.getState().setSession(session);
  useAuthStore.getState().setUser(session?.user ?? null);
  useAuthStore.getState().setLoading(false);
  
  // Load user scenes when authenticated
  if (session?.user) {
    useAuthStore.getState().loadUserScenes();
  }
});