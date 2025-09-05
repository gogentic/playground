import { create } from 'zustand';
import { VerletEngine } from '../core/physics/VerletEngine';
import { Particle } from '../core/primitives/Particle';
import { Constraint } from '../core/primitives/Constraint';
import { Composite } from '../core/primitives/Composite';

// Local interface to avoid circular dependency
interface IVector3 {
  x: number;
  y: number;
  z: number;
}

// Undo/Redo system types
interface ParticleSnapshot {
  id: string;
  position: IVector3;
  previousPosition: IVector3;
  mass: number;
  radius: number;
  damping: number;
  fixed: boolean;
  color: string;
}

interface ConstraintSnapshot {
  id: string;
  particleAId: string;
  particleBId: string;
  restLength: number;
  stiffness: number;
}

interface EngineSnapshot {
  particles: ParticleSnapshot[];
  constraints: ConstraintSnapshot[];
  timestamp: number;
}

type UndoableAction = 
  | { type: 'MOVE_PARTICLES'; before: EngineSnapshot; after: EngineSnapshot }
  | { type: 'ADD_PARTICLE'; before: EngineSnapshot; after: EngineSnapshot }
  | { type: 'DELETE_PARTICLES'; before: EngineSnapshot; after: EngineSnapshot }
  | { type: 'ADD_CONSTRAINT'; before: EngineSnapshot; after: EngineSnapshot }
  | { type: 'DELETE_CONSTRAINT'; before: EngineSnapshot; after: EngineSnapshot };

interface EngineState {
  engine: VerletEngine;
  composites: Map<string, Composite>;
  isPlaying: boolean;
  selectedParticleId: string | null;
  selectedConstraintId: string | null;
  selectedCompositeId: string | null;
  showGrid: boolean;
  showStats: boolean;
  showGround: boolean;
  showObjectProperties: boolean;
  showEnvironmental: boolean;
  showBoundingBoxes: boolean;
  
  // Edit mode state
  isEditMode: boolean;
  isDragging: boolean;
  draggedParticleId: string | null;
  dragStartSnapshot?: EngineSnapshot;
  
  // Multiple selection state
  selectedParticleIds: Set<string>;
  isMultiSelecting: boolean;
  
  // Undo/Redo state
  undoStack: UndoableAction[];
  redoStack: UndoableAction[];
  maxUndoSteps: number;
  
  // Constraint creation mode
  isCreatingConstraint: boolean;
  constraintStartParticleId: string | null;
  
  // Actions
  play: () => void;
  pause: () => void;
  reset: () => void;
  step: () => void;
  
  // Edit mode actions
  toggleEditMode: () => void;
  enterEditMode: () => void;
  exitEditMode: () => void;
  startDragging: (particleId: string) => void;
  stopDragging: () => void;
  updateParticlePosition: (particleId: string, position: IVector3) => void;
  updateMultipleParticlePositions: (particleId: string, deltaPosition: IVector3) => void;
  
  // Entity management
  addParticle: (particle: Particle) => void;
  removeParticle: (id: string) => void;
  addConstraint: (constraint: Constraint) => void;
  removeConstraint: (id: string) => void;
  addComposite: (composite: Composite) => void;
  getCompositeByParticleId: (particleId: string) => Composite | null;
  
  // Selection
  selectParticle: (id: string | null) => void;
  selectConstraint: (id: string | null) => void;
  selectComposite: (id: string | null) => void;
  
  // Multiple selection
  toggleParticleSelection: (id: string) => void;
  clearSelection: () => void;
  selectAllParticles: () => void;
  deleteSelectedParticles: () => void;
  
  // Undo/Redo actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  createSnapshot: () => EngineSnapshot;
  restoreSnapshot: (snapshot: EngineSnapshot) => void;
  pushUndoAction: (action: UndoableAction) => void;
  
  // UI toggles
  toggleGrid: () => void;
  toggleStats: () => void;
  toggleGround: () => void;
  toggleObjectProperties: () => void;
  toggleEnvironmental: () => void;
  toggleBoundingBoxes: () => void;
  
  // Constraint creation
  startConstraintCreation: (particleId: string) => void;
  finishConstraintCreation: (particleId: string) => void;
  cancelConstraintCreation: () => void;
  
  // Config
  updateGravity: (gravity: IVector3) => void;
  updateTimeStep: (timeStep: number) => void;
  updateIterations: (iterations: number) => void;
}

export const useEngineStore = create<EngineState>((set, get) => ({
  engine: new VerletEngine(),
  composites: new Map(),
  isPlaying: false,
  selectedParticleId: null,
  selectedConstraintId: null,
  selectedCompositeId: null,
  showGrid: true,
  showStats: true,
  showGround: true,
  showObjectProperties: true,
  showEnvironmental: true,
  showBoundingBoxes: true,
  
  // Edit mode state
  isEditMode: false,
  isDragging: false,
  draggedParticleId: null,
  
  // Multiple selection state
  selectedParticleIds: new Set(),
  isMultiSelecting: false,
  
  // Undo/Redo state
  undoStack: [],
  redoStack: [],
  maxUndoSteps: 50,
  
  // Constraint creation state
  isCreatingConstraint: false,
  constraintStartParticleId: null,
  
  play: () => {
    const { engine } = get();
    engine.resume();
    set({ isPlaying: true });
  },
  pause: () => {
    const { engine } = get();
    engine.pause();
    set({ isPlaying: false });
  },
  
  reset: () => {
    const { engine } = get();
    engine.reset();
    set({ 
      isPlaying: false,
      selectedParticleId: null,
      selectedConstraintId: null,
      selectedCompositeId: null,
    });
  },
  
  step: () => {
    const { engine } = get();
    engine.update();
  },
  
  addParticle: (particle) => {
    const { engine, createSnapshot, pushUndoAction } = get();
    
    const beforeSnapshot = createSnapshot();
    engine.addParticle(particle);
    const afterSnapshot = createSnapshot();
    
    pushUndoAction({
      type: 'ADD_PARTICLE',
      before: beforeSnapshot,
      after: afterSnapshot,
    });
  },
  
  removeParticle: (id) => {
    const { engine, selectedParticleId } = get();
    engine.removeParticle(id);
    if (selectedParticleId === id) {
      set({ selectedParticleId: null });
    }
  },
  
  addConstraint: (constraint) => {
    const { engine } = get();
    engine.addConstraint(constraint);
  },
  
  removeConstraint: (id) => {
    const { engine, selectedConstraintId } = get();
    engine.removeConstraint(id);
    if (selectedConstraintId === id) {
      set({ selectedConstraintId: null });
    }
  },
  
  addComposite: (composite) => {
    const { engine } = get();
    // Create a new Map to ensure React re-renders
    const newComposites = new Map(get().composites);
    newComposites.set(composite.id, composite);
    
    console.log(`[AddComposite] Adding ${composite.name} with ID: ${composite.id}, Particles: ${composite.getParticles().length}`);
    
    // Add all particles and constraints from composite to engine
    composite.getParticles().forEach((p, index) => {
      console.log(`[AddComposite] Particle ${index} before metadata:`, p.id, p.metadata);
      if (!p.metadata) {
        p.metadata = {};
      }
      p.metadata.compositeId = composite.id;
      console.log(`[AddComposite] Particle ${index} after metadata:`, p.id, p.metadata);
      engine.addParticle(p);
    });
    composite.getConstraints().forEach(c => engine.addConstraint(c));
    set({ composites: newComposites });
    
    console.log(`[AddComposite] Successfully added composite. Total composites: ${newComposites.size}`);
  },
  
  getCompositeByParticleId: (particleId) => {
    const state = get();
    const particle = state.engine.getParticle(particleId);
    
    console.log(`[GetComposite] Looking for particle ${particleId}`);
    console.log(`[GetComposite] Particle metadata:`, particle?.metadata);
    
    // First try to use metadata
    if (particle?.metadata?.compositeId) {
      const composite = state.composites.get(particle.metadata.compositeId);
      if (composite) {
        console.log(`[GetComposite] ✓ Found composite ${composite.id} via metadata`);
        return composite;
      } else {
        console.log(`[GetComposite] ✗ Metadata points to non-existent composite: ${particle.metadata.compositeId}`);
      }
    }
    
    // Fallback to checking particle lists
    for (const [compositeId, composite] of state.composites) {
      const particles = composite.getParticles();
      if (particles.some(p => p.id === particleId)) {
        console.log(`[GetComposite] ✓ Found composite ${compositeId} by searching particle lists`);
        return composite;
      }
    }
    
    console.log(`[GetComposite] ✗ No composite found for particle ${particleId}`);
    return null;
  },
  
  selectParticle: (id) => {
    console.log('Store: selectParticle called with:', id);
    set({ 
      selectedParticleId: id,
      selectedConstraintId: null,
      selectedCompositeId: null,  // This already clears composite selection
    });
    console.log('Store: selectedParticleId after set:', get().selectedParticleId);
  },
  
  selectConstraint: (id) => set({ 
    selectedParticleId: null,
    selectedConstraintId: id,
    selectedCompositeId: null,
  }),
  
  selectComposite: (id) => {
    console.log(`[SelectComposite] Selecting composite: ${id}`);
    const newState = { 
      selectedParticleId: null,
      selectedConstraintId: null,
      selectedCompositeId: id,
    };
    console.log(`[SelectComposite] Setting state:`, newState);
    set(newState);
    console.log(`[SelectComposite] State after set:`, get().selectedCompositeId);
  },
  
  // Multiple selection actions
  toggleParticleSelection: (id) => {
    const { selectedParticleIds } = get();
    const newSelection = new Set(selectedParticleIds);
    
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    
    set({ 
      selectedParticleIds: newSelection,
      isMultiSelecting: newSelection.size > 0,
      // Clear single selection when multi-selecting
      selectedParticleId: newSelection.size > 0 ? null : get().selectedParticleId,
    });
  },
  
  clearSelection: () => set({
    selectedParticleIds: new Set(),
    isMultiSelecting: false,
    selectedParticleId: null,
    selectedConstraintId: null,
    selectedCompositeId: null,
  }),
  
  selectAllParticles: () => {
    const { engine } = get();
    const allParticleIds = new Set(engine.getParticles().map(p => p.id));
    set({
      selectedParticleIds: allParticleIds,
      isMultiSelecting: allParticleIds.size > 0,
      selectedParticleId: null,
    });
  },
  
  deleteSelectedParticles: () => {
    const { engine, selectedParticleIds, createSnapshot, pushUndoAction } = get();
    if (selectedParticleIds.size === 0) return;
    
    const beforeSnapshot = createSnapshot();
    
    selectedParticleIds.forEach(id => {
      engine.removeParticle(id);
    });
    
    const afterSnapshot = createSnapshot();
    
    pushUndoAction({
      type: 'DELETE_PARTICLES',
      before: beforeSnapshot,
      after: afterSnapshot,
    });
    
    set({
      selectedParticleIds: new Set(),
      isMultiSelecting: false,
    });
  },
  
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleStats: () => set((state) => ({ showStats: !state.showStats })),
  toggleGround: () => set((state) => ({ showGround: !state.showGround })),
  toggleObjectProperties: () => set((state) => ({ showObjectProperties: !state.showObjectProperties })),
  toggleEnvironmental: () => set((state) => ({ showEnvironmental: !state.showEnvironmental })),
  toggleBoundingBoxes: () => set((state) => ({ showBoundingBoxes: !state.showBoundingBoxes })),
  
  // Constraint creation actions
  startConstraintCreation: (particleId) => set({
    isCreatingConstraint: true,
    constraintStartParticleId: particleId,
    selectedParticleId: particleId,
  }),
  
  finishConstraintCreation: (particleId) => {
    const { engine, constraintStartParticleId } = get();
    if (constraintStartParticleId && constraintStartParticleId !== particleId) {
      const particleA = engine.getParticle(constraintStartParticleId);
      const particleB = engine.getParticle(particleId);
      
      if (particleA && particleB) {
        const constraint = new Constraint(particleA, particleB, undefined, 0.9);
        engine.addConstraint(constraint);
      }
    }
    set({
      isCreatingConstraint: false,
      constraintStartParticleId: null,
    });
  },
  
  cancelConstraintCreation: () => set({
    isCreatingConstraint: false,
    constraintStartParticleId: null,
  }),
  
  updateGravity: (gravity) => {
    const { engine } = get();
    engine.updateConfig({ gravity });
  },
  
  updateTimeStep: (timeStep) => {
    const { engine } = get();
    engine.updateConfig({ timeStep });
  },
  
  updateIterations: (iterations) => {
    const { engine } = get();
    engine.updateConfig({ iterations });
  },
  
  // Undo/Redo helper functions
  createSnapshot: () => {
    const { engine } = get();
    const particles = engine.getParticles().map(p => ({
      id: p.id,
      position: { x: p.position.x, y: p.position.y, z: p.position.z },
      previousPosition: { x: p.previousPosition.x, y: p.previousPosition.y, z: p.previousPosition.z },
      mass: p.mass,
      radius: p.radius,
      damping: p.damping,
      fixed: p.fixed,
      color: p.color,
    }));
    
    const constraints = engine.getConstraints().map(c => ({
      id: c.id,
      particleAId: c.particleA.id,
      particleBId: c.particleB.id,
      restLength: c.restLength,
      stiffness: c.stiffness,
    }));
    
    return {
      particles,
      constraints,
      timestamp: Date.now(),
    };
  },
  
  restoreSnapshot: (snapshot) => {
    const { engine } = get();
    
    // Clear current state
    engine.getParticles().forEach(p => engine.removeParticle(p.id));
    engine.getConstraints().forEach(c => engine.removeConstraint(c.id));
    
    // Restore particles
    snapshot.particles.forEach(pData => {
      const particle = new Particle({
        position: pData.position,
        previousPosition: pData.previousPosition,
        mass: pData.mass,
        radius: pData.radius,
        damping: pData.damping,
        fixed: pData.fixed,
        color: pData.color,
      });
      particle.id = pData.id; // Restore original ID
      engine.addParticle(particle);
    });
    
    // Restore constraints
    snapshot.constraints.forEach(cData => {
      const particleA = engine.getParticle(cData.particleAId);
      const particleB = engine.getParticle(cData.particleBId);
      if (particleA && particleB) {
        const constraint = new Constraint(particleA, particleB, cData.restLength, cData.stiffness);
        constraint.id = cData.id; // Restore original ID
        engine.addConstraint(constraint);
      }
    });
    
    // Clear selection state
    set({
      selectedParticleIds: new Set(),
      isMultiSelecting: false,
      selectedParticleId: null,
    });
  },
  
  pushUndoAction: (action) => {
    const { undoStack, maxUndoSteps } = get();
    const newUndoStack = [...undoStack, action];
    
    // Limit undo stack size
    if (newUndoStack.length > maxUndoSteps) {
      newUndoStack.shift();
    }
    
    set({
      undoStack: newUndoStack,
      redoStack: [], // Clear redo stack when new action is performed
    });
  },
  
  canUndo: () => {
    const { undoStack } = get();
    return undoStack.length > 0;
  },
  
  canRedo: () => {
    const { redoStack } = get();
    return redoStack.length > 0;
  },
  
  undo: () => {
    const { undoStack, redoStack } = get();
    if (undoStack.length === 0) return;
    
    const action = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);
    const newRedoStack = [...redoStack, action];
    
    // Restore the "before" state
    get().restoreSnapshot(action.before);
    
    set({
      undoStack: newUndoStack,
      redoStack: newRedoStack,
    });
  },
  
  redo: () => {
    const { undoStack, redoStack } = get();
    if (redoStack.length === 0) return;
    
    const action = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);
    const newUndoStack = [...undoStack, action];
    
    // Restore the "after" state
    get().restoreSnapshot(action.after);
    
    set({
      undoStack: newUndoStack,
      redoStack: newRedoStack,
    });
  },
  
  // Edit mode actions
  toggleEditMode: () => {
    const { isEditMode } = get();
    if (isEditMode) {
      get().exitEditMode();
    } else {
      get().enterEditMode();
    }
  },
  
  enterEditMode: () => {
    const { engine, isPlaying } = get();
    // Pause physics when entering edit mode
    if (isPlaying) {
      engine.pause();
    }
    set({ 
      isEditMode: true, 
      isPlaying: false,
      // Cancel any ongoing constraint creation
      isCreatingConstraint: false,
      constraintStartParticleId: null,
    });
  },
  
  exitEditMode: () => {
    set({ 
      isEditMode: false,
      isDragging: false,
      draggedParticleId: null,
    });
  },
  
  startDragging: (particleId) => {
    const { isEditMode, createSnapshot } = get();
    if (!isEditMode) return;
    
    // Create snapshot before dragging starts
    const beforeSnapshot = createSnapshot();
    
    set({ 
      isDragging: true, 
      draggedParticleId: particleId,
      selectedParticleId: particleId,
      dragStartSnapshot: beforeSnapshot, // Store the before state
    });
  },
  
  stopDragging: () => {
    const { dragStartSnapshot, createSnapshot, pushUndoAction } = get();
    
    // Create undo action for the drag operation
    if (dragStartSnapshot) {
      const afterSnapshot = createSnapshot();
      
      // Only create undo action if something actually changed
      if (JSON.stringify(dragStartSnapshot) !== JSON.stringify(afterSnapshot)) {
        pushUndoAction({
          type: 'MOVE_PARTICLES',
          before: dragStartSnapshot,
          after: afterSnapshot,
        });
      }
    }
    
    set({ 
      isDragging: false, 
      draggedParticleId: null,
      dragStartSnapshot: undefined,
    });
  },
  
  updateParticlePosition: (particleId, position) => {
    const { engine, isEditMode, isDragging } = get();
    if (!isEditMode || !isDragging) return;
    
    const particle = engine.getParticle(particleId);
    if (particle) {
      // Update position and reset velocity to prevent physics jumps
      particle.position.x = position.x;
      particle.position.y = position.y;
      particle.position.z = position.z;
      particle.previousPosition.x = position.x;
      particle.previousPosition.y = position.y;
      particle.previousPosition.z = position.z;
    }
  },

  updateMultipleParticlePositions: (draggedParticleId, deltaPosition) => {
    const { engine, isEditMode, isDragging, selectedParticleIds, isMultiSelecting } = get();
    if (!isEditMode || !isDragging) return;

    // If we're multi-selecting and the dragged particle is in the selection, move all selected particles
    if (isMultiSelecting && selectedParticleIds.has(draggedParticleId)) {
      selectedParticleIds.forEach(particleId => {
        const particle = engine.getParticle(particleId);
        if (particle) {
          // Apply delta movement to each selected particle
          particle.position.x += deltaPosition.x;
          particle.position.y += deltaPosition.y;
          particle.position.z += deltaPosition.z;
          particle.previousPosition.x += deltaPosition.x;
          particle.previousPosition.y += deltaPosition.y;
          particle.previousPosition.z += deltaPosition.z;
        }
      });
    } else {
      // Single particle drag - use existing method
      const particle = engine.getParticle(draggedParticleId);
      if (particle) {
        particle.position.x += deltaPosition.x;
        particle.position.y += deltaPosition.y;
        particle.position.z += deltaPosition.z;
        particle.previousPosition.x += deltaPosition.x;
        particle.previousPosition.y += deltaPosition.y;
        particle.previousPosition.z += deltaPosition.z;
      }
    }
  },
}));

// Expose the store globally so auth store can access it
if (typeof window !== 'undefined') {
  (window as any).engineStore = useEngineStore;
}
