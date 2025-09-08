import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, sceneOperations } from '../lib/supabase';
import type { Scene } from '../lib/supabase';
import { Particle } from '../core/primitives/Particle';
import { Constraint } from '../core/primitives/Constraint';
import { Composite } from '../core/primitives/Composite';

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
    
    // Get all state needed for complete serialization
    const state = engineStore.getState();
    const dynamicsSystem = state.dynamicsSystem;
    
    // Serialize the current scene
    const particles = engine.getParticles().map((p: any) => ({
      id: p.id,
      position: { x: p.position.x, y: p.position.y, z: p.position.z },
      previousPosition: { x: p.previousPosition.x, y: p.previousPosition.y, z: p.previousPosition.z },
      velocity: { x: p.velocity.x, y: p.velocity.y, z: p.velocity.z },
      mass: p.mass,
      radius: p.radius,
      damping: p.damping,
      color: p.color,
      fixed: p.fixed,
      metadata: p.metadata || {},
      dynamics: dynamicsSystem.getBehaviors(p.id) || []
    }));
    
    const constraints = engine.getConstraints().map((c: any) => ({
      particleA: c.particleA.id,
      particleB: c.particleB.id,
      restLength: c.restLength,
      stiffness: c.stiffness
    }));
    
    const composites = Array.from(engineStore.getState().composites || []).map(([id, composite]: [any, any]) => ({
      id,
      type: composite.metadata?.type || composite.name || 'composite',
      particles: composite.getParticles ? composite.getParticles().map((p: any) => p.id) : [],
      constraints: composite.getConstraints ? composite.getConstraints().map((c: any) => ({
        particleA: c.particleA.id,
        particleB: c.particleB.id,
        restLength: c.restLength,
        stiffness: c.stiffness
      })) : []
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
          timeScale: engine.config.timeScale,
          timeStep: engine.config.timeStep,
          iterations: engine.config.iterations,
          damping: engine.config.damping
        },
        viewSettings: {
          showGrid: state.showGrid,
          showGround: state.showGround,
          showBoundingBoxes: state.showBoundingBoxes,
          showStats: state.showStats,
          showObjectProperties: state.showObjectProperties,
          showEnvironmental: state.showEnvironmental
        },
        globalVisualSettings: {
          particleRadiusMultiplier: state.particleRadiusMultiplier,
          showParticles: state.showParticles,
          showTransformGizmo: state.showTransformGizmo,
          backgroundColor: state.backgroundColor,
          gridColor: state.gridColor,
          showFog: state.showFog,
          fogDensity: state.fogDensity,
          fogColor: state.fogColor,
          showSceneLight: state.showSceneLight
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
    
    // Get all state needed for complete serialization
    const state = engineStore.getState();
    const dynamicsSystem = state.dynamicsSystem;
    
    // Serialize the current scene
    const particles = engine.getParticles().map((p: any) => ({
      id: p.id,
      position: { x: p.position.x, y: p.position.y, z: p.position.z },
      previousPosition: { x: p.previousPosition.x, y: p.previousPosition.y, z: p.previousPosition.z },
      velocity: { x: p.velocity.x, y: p.velocity.y, z: p.velocity.z },
      mass: p.mass,
      radius: p.radius,
      damping: p.damping,
      color: p.color,
      fixed: p.fixed,
      metadata: p.metadata || {},
      dynamics: dynamicsSystem.getBehaviors(p.id) || []
    }));
    
    const constraints = engine.getConstraints().map((c: any) => ({
      particleA: c.particleA.id,
      particleB: c.particleB.id,
      restLength: c.restLength,
      stiffness: c.stiffness
    }));
    
    const composites = Array.from(engineStore.getState().composites || []).map(([id, composite]: [any, any]) => ({
      id,
      type: composite.metadata?.type || composite.name || 'composite',
      particles: composite.getParticles ? composite.getParticles().map((p: any) => p.id) : [],
      constraints: composite.getConstraints ? composite.getConstraints().map((c: any) => ({
        particleA: c.particleA.id,
        particleB: c.particleB.id,
        restLength: c.restLength,
        stiffness: c.stiffness
      })) : []
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
          timeScale: engine.config.timeScale,
          timeStep: engine.config.timeStep,
          iterations: engine.config.iterations,
          damping: engine.config.damping
        },
        viewSettings: {
          showGrid: state.showGrid,
          showGround: state.showGround,
          showBoundingBoxes: state.showBoundingBoxes,
          showStats: state.showStats,
          showObjectProperties: state.showObjectProperties,
          showEnvironmental: state.showEnvironmental
        },
        globalVisualSettings: {
          particleRadiusMultiplier: state.particleRadiusMultiplier,
          showParticles: state.showParticles,
          showTransformGizmo: state.showTransformGizmo,
          backgroundColor: state.backgroundColor,
          gridColor: state.gridColor,
          showFog: state.showFog,
          fogDensity: state.fogDensity,
          fogColor: state.fogColor,
          showSceneLight: state.showSceneLight
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
    
    const state = engineStore.getState();
    const engine = state.engine;
    const dynamicsSystem = state.dynamicsSystem;
    if (!engine) throw new Error('Engine not initialized');
    
    // Restore environment settings
    engine.gravity.x = scene.data.environment.gravity.x;
    engine.gravity.y = scene.data.environment.gravity.y;
    engine.gravity.z = scene.data.environment.gravity.z;
    engine.airDamping = scene.data.environment.airDamping;
    engine.groundBounce = scene.data.environment.groundBounce;
    engine.groundFriction = scene.data.environment.groundFriction;
    engine.config.timeScale = scene.data.environment.timeScale;
    
    // Restore additional environment settings if present
    if (scene.data.environment.timeStep !== undefined) {
      engine.config.timeStep = scene.data.environment.timeStep;
    }
    if (scene.data.environment.iterations !== undefined) {
      engine.config.iterations = scene.data.environment.iterations;
    }
    if (scene.data.environment.damping !== undefined) {
      engine.config.damping = scene.data.environment.damping;
    }
    
    // Restore view settings if present
    if (scene.data.viewSettings) {
      const viewSettings = scene.data.viewSettings;
      if (viewSettings.showGrid !== undefined) engineStore.setState({ showGrid: viewSettings.showGrid });
      if (viewSettings.showGround !== undefined) engineStore.setState({ showGround: viewSettings.showGround });
      if (viewSettings.showBoundingBoxes !== undefined) engineStore.setState({ showBoundingBoxes: viewSettings.showBoundingBoxes });
      if (viewSettings.showStats !== undefined) engineStore.setState({ showStats: viewSettings.showStats });
      if (viewSettings.showObjectProperties !== undefined) engineStore.setState({ showObjectProperties: viewSettings.showObjectProperties });
      if (viewSettings.showEnvironmental !== undefined) engineStore.setState({ showEnvironmental: viewSettings.showEnvironmental });
    }
    
    // Restore global visual settings if present
    if (scene.data.globalVisualSettings) {
      const visualSettings = scene.data.globalVisualSettings;
      if (visualSettings.particleRadiusMultiplier !== undefined) engineStore.setState({ particleRadiusMultiplier: visualSettings.particleRadiusMultiplier });
      if (visualSettings.showParticles !== undefined) engineStore.setState({ showParticles: visualSettings.showParticles });
      if (visualSettings.showTransformGizmo !== undefined) engineStore.setState({ showTransformGizmo: visualSettings.showTransformGizmo });
      if (visualSettings.backgroundColor !== undefined) engineStore.setState({ backgroundColor: visualSettings.backgroundColor });
      if (visualSettings.gridColor !== undefined) engineStore.setState({ gridColor: visualSettings.gridColor });
      if (visualSettings.showFog !== undefined) engineStore.setState({ showFog: visualSettings.showFog });
      if (visualSettings.fogDensity !== undefined) engineStore.setState({ fogDensity: visualSettings.fogDensity });
      if (visualSettings.fogColor !== undefined) engineStore.setState({ fogColor: visualSettings.fogColor });
      if (visualSettings.showSceneLight !== undefined) engineStore.setState({ showSceneLight: visualSettings.showSceneLight });
    }
    
    // Create particles first (without adding to engine yet)
    const particleMap = new Map();
    const particleCreationData: any[] = [];
    
    scene.data.particles.forEach((pData: any) => {
      particleCreationData.push(pData);
    });
    
    // Create all particles
    particleCreationData.forEach((pData: any) => {
      const particle = new Particle({
        position: pData.position,
        previousPosition: pData.previousPosition,
        mass: pData.mass,
        radius: pData.radius,
        damping: pData.damping,
        fixed: pData.fixed,
        color: pData.color,
        metadata: pData.metadata || {}
      });
      
      // Restore particle ID
      particle.id = pData.id;
      
      // Add to engine
      engine.addParticle(particle);
      particleMap.set(pData.id, particle);
      
      // Restore dynamic behaviors if present
      if (pData.dynamics && pData.dynamics.length > 0) {
        pData.dynamics.forEach((behavior: any) => {
          dynamicsSystem.addBehavior(particle.id, behavior);
        });
      }
    });
    
    // Create constraints
    scene.data.constraints.forEach((cData: any) => {
      const particleA = particleMap.get(cData.particleA);
      const particleB = particleMap.get(cData.particleB);
      if (particleA && particleB) {
        const constraint = new Constraint(
          particleA,
          particleB,
          cData.restLength,
          cData.stiffness
        );
        engine.addConstraint(constraint);
      }
    });
    
    // Restore composites if present
    if (scene.data.composites && scene.data.composites.length > 0) {
      const compositeMap = new Map();
      scene.data.composites.forEach((compData: any) => {
        // Create composite object
        const composite = new Composite({
          name: compData.type,
          metadata: { type: compData.type }
        });
        composite.id = compData.id;
        
        // Add particles to composite
        compData.particles.forEach((pId: string) => {
          const particle = particleMap.get(pId);
          if (particle) {
            composite.addParticle(particle);
          }
        });
        
        // Add constraints to composite  
        const compositeConstraints = engine.getConstraints().filter((c: any) => {
          const particleAInComposite = compData.particles.includes(c.particleA.id);
          const particleBInComposite = compData.particles.includes(c.particleB.id);
          return particleAInComposite && particleBInComposite;
        });
        
        compositeConstraints.forEach((constraint: any) => {
          composite.addConstraint(constraint);
        });
        
        compositeMap.set(compData.id, composite);
      });
      
      // Update the engine store's composite map
      engineStore.setState({ composites: compositeMap });
    }
    
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
  // Check domain restriction for OAuth users
  if (session?.user?.email && !session.user.email.endsWith('@gogentic.ai')) {
    // Sign out non-gogentic.ai users
    supabase.auth.signOut();
    useAuthStore.getState().setSession(null);
    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setLoading(false);
    // You might want to show an error message here
    console.error('Access denied: Only @gogentic.ai email addresses are allowed');
    return;
  }
  
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
  // Check domain restriction for OAuth users
  if (session?.user?.email && !session.user.email.endsWith('@gogentic.ai')) {
    // Sign out non-gogentic.ai users
    supabase.auth.signOut();
    useAuthStore.getState().setSession(null);
    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setLoading(false);
    return;
  }
  
  useAuthStore.getState().setSession(session);
  useAuthStore.getState().setUser(session?.user ?? null);
  useAuthStore.getState().setLoading(false);
  
  // Load user scenes when authenticated
  if (session?.user) {
    useAuthStore.getState().loadUserScenes();
  }
});