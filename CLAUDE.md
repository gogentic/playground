# CLAUDE.md - Protobyte Studio Development Guide

## Project Overview

Protobyte Studio is a powerful 3D physics simulation studio built with React, TypeScript, and Three.js. It features real-time Verlet integration physics, interactive particle manipulation, and a comprehensive editing environment for creating and experimenting with physical simulations.

## Commands

### Development Commands
```bash
# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

### Git Workflow
```bash
# The project is currently on feature/ui_grid branch
# Main branch is 'main' (use this for PRs)
git checkout main
git pull origin main
git checkout -b feature/your-feature
```

## High-Level Architecture

### Core Technology Stack
- **React 19** - Modern React with concurrent features
- **TypeScript 5.8** - Full type safety and IntelliSense support  
- **Three.js + React Three Fiber** - Hardware-accelerated 3D graphics
- **Zustand** - Lightweight, performant state management
- **Vite** - Lightning-fast development and optimized builds

### Project Structure
```
protobyte-studio/
├── src/
│   ├── core/                    # Physics engine core
│   │   ├── physics/             # Physics implementation
│   │   │   ├── Vector3.ts       # 3D vector mathematics
│   │   │   └── VerletEngine.ts  # Main physics simulation engine
│   │   ├── primitives/          # Physics objects
│   │   │   ├── Particle.ts      # Individual particles
│   │   │   ├── Constraint.ts    # Distance constraints
│   │   │   └── Composite.ts     # Complex structures (ropes, cloth, boxes)
│   │   └── systems/
│   │       └── SpatialHash.ts   # Collision optimization system
│   ├── components/
│   │   ├── ui/                  # User interface panels
│   │   │   ├── ControlPanel.tsx         # Play/pause/reset controls
│   │   │   ├── Toolbar.tsx              # Object creation tools
│   │   │   ├── ObjectPropertiesPanel.tsx # Entity property editor
│   │   │   ├── EnvironmentalPanel.tsx   # Physics parameter controls
│   │   │   ├── ParticlePropertyPanel.tsx # Particle-specific settings
│   │   │   └── StatsPanel.tsx           # Performance monitoring
│   │   └── viewport/            # 3D rendering components
│   │       ├── Viewport.tsx             # Main 3D canvas wrapper
│   │       ├── Scene.tsx                # Three.js scene orchestrator
│   │       ├── ParticleRenderer.tsx     # Particle visualization
│   │       ├── ConstraintRenderer.tsx   # Constraint visualization
│   │       ├── Ground.tsx               # Ground plane rendering
│   │       └── CompositeBoundingBox.tsx # Bounding box visualization
│   ├── stores/
│   │   └── useEngineStore.ts    # Centralized state management (Zustand)
│   ├── types/                   # TypeScript type definitions
│   │   └── physics.ts          # Core physics interfaces
│   ├── utils/                   # Utility functions
│   │   ├── id.ts               # ID generation
│   │   └── vectorConversion.ts # Vector conversion utilities
│   └── App.tsx                 # Main application component
```

### Core Architecture Patterns

#### 1. Physics Engine (Verlet Integration)
- **Engine Core**: `VerletEngine.ts` manages the physics simulation loop
- **Verlet Integration**: Position-based dynamics with implicit velocity calculation
- **Spatial Hashing**: Efficient collision detection using `SpatialHash.ts`
- **Constraint Solver**: Iterative relaxation for stable constraint networks
- **Environmental Physics**: Ground collision with configurable bounce and friction

#### 2. State Management (Zustand)
- **Centralized Store**: `useEngineStore.ts` manages all application state
- **Physics State**: Engine instance, particles, constraints, composites
- **UI State**: Selection, editing mode, panel visibility
- **Undo/Redo System**: Complete history tracking with snapshot-based restoration
- **Multi-selection**: Support for selecting and manipulating multiple particles

#### 3. Component Architecture (React + Three.js)
- **Viewport**: React Three Fiber canvas with OrbitControls
- **Scene Management**: Separate renderers for different entity types
- **UI Panels**: Modular interface components with CSS styling
- **Error Boundaries**: Robust error handling for 3D rendering

#### 4. Interactive Editing System
- **Edit Mode**: Physics-paused state for object manipulation
- **Drag & Drop**: 3D particle positioning with real-time feedback
- **Constraint Creation**: Visual constraint connection between particles
- **Multi-selection**: Shift+click selection with group manipulation

#### 5. Composite Objects
- **Factory Pattern**: `CompositeFactory` creates complex structures
- **Rope System**: Chained particles with distance constraints
- **Cloth Simulation**: 2D grid with structural and shear constraints
- **Box Frames**: Rigid 3D structures with diagonal bracing
- **Metadata Linking**: Particles track their parent composite

### Key Features

#### Physics Simulation
- Real-time 60 FPS Verlet integration
- Configurable gravity, time scaling, damping
- Ground collision with bounce and friction
- Spatial hash optimization for large particle counts
- Environmental parameter controls

#### Interactive Tools
- Edit mode with physics pause
- Multi-particle selection and manipulation
- Constraint creation between particles
- Undo/Redo with keyboard shortcuts (Ctrl+Z/Y)
- Property panels for real-time parameter editing

#### Creation Tools
- Particle creation with customizable properties
- Rope generation with adjustable segments
- Cloth creation with configurable resolution (up to 50x50)
- Box frame structures
- Composite object management

#### Visual Features
- Color-coded particle states (selected, dragging, constraint creation)
- Ground plane and grid visualization
- Bounding box display for composite objects
- Real-time statistics monitoring

### Configuration Files

#### Build & Development
- **vite.config.ts**: Vite configuration with React plugin and host settings
- **tsconfig.json**: TypeScript configuration with strict settings
- **eslint.config.js**: ESLint with TypeScript and React rules

#### Environment
- **package.json**: Dependencies and build scripts
- **.claude/settings.local.json**: Claude Code permissions for development commands

### Development Guidelines

#### Code Style
- TypeScript strict mode enabled
- ESLint configuration with React hooks and refresh plugins
- Functional components with hooks
- Zustand for state management (no Redux/Context complexity)

#### Physics Development
- Verlet integration maintains energy conservation
- Constraint solving uses iterative relaxation
- Spatial hashing optimizes collision detection
- Ground collision uses configurable restitution and friction

#### UI Development
- React Three Fiber for 3D rendering
- CSS modules for component styling
- Error boundaries for robust 3D rendering
- Keyboard shortcuts for common operations

#### State Management
- Zustand store centralizes all application state
- Snapshot-based undo/redo system
- Multi-selection state tracking
- Composite object relationship management

### Performance Considerations

#### Optimization Strategies
- Spatial hash grid for collision detection
- Configurable physics iterations (1-10)
- Particle count monitoring via StatsPanel
- Efficient constraint solver with breaking thresholds

#### Rendering Performance
- Three.js instanced rendering ready
- Optional bounding box visualization
- Grid and ground plane toggle options
- Error boundaries prevent cascade failures

## AI Assistant Rules

### Existing Configuration
The project has a `.claude/settings.local.json` file with permissions for:
- Development server commands (`npm run dev`)
- Build commands (`npm run build`) 
- Git operations (checkout, push, remote)
- System tools (lsof, tree)

### No Existing Rules
- No `.cursorrules` file found
- No `.cursor/rules` directory found
- No `.github/copilot-instructions.md` file found

### Development Best Practices
- Always prefer editing existing files over creating new ones
- Use the existing TypeScript interfaces and types
- Follow the established Zustand store patterns
- Maintain the physics engine's Verlet integration principles
- Respect the component architecture with separate UI and viewport layers
- Use the existing error boundary patterns for robust 3D rendering
- Follow the established ID generation and metadata patterns for objects

### Physics Development Guidelines
- Understand Verlet integration: position-based dynamics with implicit velocity
- Constraint solving uses iterative relaxation for stability
- Spatial hashing optimizes collision detection - don't break this pattern
- Environmental parameters (gravity, friction, bounce) are configurable
- Ground collision is a separate system from particle-particle collision

### UI Development Guidelines
- Use React Three Fiber for all 3D rendering
- Maintain the separation between UI panels and viewport components
- Follow the existing CSS class naming conventions
- Use Zustand store for all state management, avoid local state where possible
- Implement keyboard shortcuts following the existing pattern in App.tsx