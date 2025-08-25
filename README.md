# Protobyte Studio

A powerful 3D physics simulation studio built with React, TypeScript, and Three.js. Features real-time Verlet integration physics, interactive particle manipulation, and a comprehensive editing environment for creating and experimenting with physical simulations.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.1-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6)
![Three.js](https://img.shields.io/badge/Three.js-0.179-orange)

## 🌟 Features

### Physics Engine
- **Verlet Integration**: Stable, energy-conserving particle physics simulation
- **Real-time Performance**: Optimized for 60 FPS with configurable timestep
- **Spatial Hashing**: Efficient collision detection for large particle systems
- **Constraint System**: Distance-based constraints for creating complex structures
- **Ground Collision**: Realistic bounce and friction physics with adjustable parameters
- **Environmental Controls**: Adjustable gravity, time scaling, damping, and ground properties

### Interactive Editing
- **Edit Mode**: Pause physics and manipulate particles in 3D space
- **Multi-Selection**: Select and manipulate multiple particles simultaneously (Shift+Click)
- **Drag & Drop**: Intuitive particle positioning with real-time visual feedback
- **Constraint Creation**: Visual mode for connecting particles with constraints
- **Color-Coded States**: Visual feedback for selection, dragging, and constraint creation

### Creation Tools
- **Particles**: Individual physics objects with customizable properties
- **Ropes**: Flexible constraint chains with adjustable segment count
- **Cloth**: 2D grid structures with configurable resolution (up to 50x50 nodes)
- **Boxes**: 3D rigid structures
- **Composites**: Complex multi-particle systems with internal constraints

### Advanced Features
- **Undo/Redo System**: Full history tracking with keyboard shortcuts (Ctrl+Z/Y)
- **Property Panels**: Real-time editing of particle mass, radius, damping, color, and position
- **Environmental Panel**: Control gravity, time scale, ground properties, and physics parameters
- **Stats Panel**: Monitor particle count, constraint count, and simulation time
- **Bounding Box Visualization**: Optional display of composite object boundaries
- **Object Properties**: Detailed property editing for selected particles and composites

## 🚀 Getting Started

### Prerequisites
- Node.js 18.0 or higher
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone git@github.com:irajgreenberg/protobyte-studio.git
cd protobyte-studio

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at [http://localhost:5173](http://localhost:5173)

### Building for Production

```bash
# Create optimized production build
npm run build

# Preview production build
npm run preview
```

### Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## 🎮 Controls & Usage

### Camera Controls
| Action | Control |
|--------|---------|
| Orbit | Left Mouse Drag |
| Zoom | Mouse Scroll |
| Pan | Right Mouse Drag |

### Edit Mode
| Action | Shortcut |
|--------|----------|
| Toggle Edit Mode | `E` |
| Select Particle | Click |
| Multi-Select | `Shift + Click` |
| Select All | `Ctrl/Cmd + A` |
| Clear Selection | `Escape` |
| Delete Selected | `Delete` or `Backspace` |
| Undo | `Ctrl/Cmd + Z` |
| Redo | `Ctrl/Cmd + Y` or `Ctrl/Cmd + Shift + Z` |

### Panel Controls
- **Control Panel**: Play/pause simulation, reset, single step, toggle edit mode
- **Toolbar**: Add particles, ropes, cloth (with custom resolution), and boxes
- **Object Properties**: Edit selected particle/composite properties
- **Environmental Panel**: Adjust physics parameters in real-time
- **Stats Panel**: Monitor simulation performance

## 🏗️ Architecture

### Project Structure
```
protobyte-studio/
├── src/
│   ├── core/
│   │   ├── physics/         # Physics engine implementation
│   │   │   ├── Vector3.ts   # 3D vector mathematics
│   │   │   └── VerletEngine.ts # Main physics simulation
│   │   ├── primitives/      # Physics objects
│   │   │   ├── Particle.ts  # Individual particles
│   │   │   ├── Constraint.ts # Distance constraints
│   │   │   └── Composite.ts # Complex structures
│   │   └── systems/
│   │       └── SpatialHash.ts # Collision optimization
│   ├── components/
│   │   ├── ui/             # User interface panels
│   │   │   ├── ControlPanel.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   ├── ObjectPropertiesPanel.tsx
│   │   │   ├── EnvironmentalPanel.tsx
│   │   │   ├── ParticlePropertyPanel.tsx
│   │   │   └── StatsPanel.tsx
│   │   └── viewport/       # 3D rendering components
│   │       ├── Viewport.tsx
│   │       ├── Scene.tsx
│   │       ├── ParticleRenderer.tsx
│   │       ├── ConstraintRenderer.tsx
│   │       ├── Ground.tsx
│   │       └── CompositeBoundingBox.tsx
│   ├── stores/
│   │   └── useEngineStore.ts # Zustand state management
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── App.tsx             # Main application component
```

### Core Technologies
- **React 19**: Modern React with concurrent features
- **TypeScript 5.8**: Full type safety and IntelliSense support
- **Three.js + React Three Fiber**: Hardware-accelerated 3D graphics
- **Zustand**: Lightweight, performant state management
- **Vite**: Lightning-fast development and optimized builds

### Physics Engine Details

#### Verlet Integration
The engine uses Verlet integration for numerical stability:
- Position-based dynamics
- Implicit velocity calculation
- Energy conservation
- Configurable timestep and iterations

#### Collision System
- Spatial hash grid for broad-phase detection
- Sphere-sphere collision with proper response
- Ground plane collision with bounce and friction
- Configurable world boundaries

#### Constraint Solver
- Distance constraints with adjustable stiffness
- Iterative relaxation for stability
- Breaking threshold for realistic behavior
- Support for complex constraint networks

## 🎨 Customization

### Physics Parameters
Configure physics behavior through the Environmental Panel:
- **Gravity**: 3D vector (default: [0, -9.81, 0])
- **Time Scale**: Simulation speed multiplier (0.1 - 2.0)
- **Ground Bounce**: Restitution coefficient (0.0 - 1.0)
- **Ground Friction**: Horizontal damping (0.0 - 1.0)
- **Constraint Iterations**: Solver accuracy (1 - 10)

### Visual Customization
- Particle colors with HSL color picker
- Adjustable particle radius (0.1 - 5.0)
- Grid visibility toggle
- Ground plane visibility
- Bounding box display for composites

## 🔧 API Reference

### Creating Custom Particles
```typescript
import { Particle } from './core/primitives/Particle';
import { Vector3 } from './core/physics/Vector3';

const particle = new Particle({
  position: new Vector3(0, 10, 0),
  mass: 1.0,
  radius: 0.5,
  damping: 0.99,
  fixed: false,
  color: '#ff0000'
});
```

### Creating Composite Structures
```typescript
import { CompositeFactory } from './core/primitives/Composite';

// Create a rope
const rope = CompositeFactory.createRope(
  startPosition,  // Vector3
  endPosition,    // Vector3
  segments,       // number
  stiffness,      // 0-1
  damping         // 0-1
);

// Create cloth
const cloth = CompositeFactory.createCloth(
  width,          // number
  height,         // number
  segmentsX,      // number
  segmentsY,      // number
  position,       // Vector3
  stiffness,      // 0-1
  damping         // 0-1
);
```

## 🚧 Roadmap

### Planned Features
- [ ] Save/Load simulation states
- [ ] Export simulation data (JSON, CSV)
- [ ] Additional constraint types (springs, hinges, motors)
- [ ] Custom collision shapes (boxes, capsules, meshes)
- [ ] Force fields (attractors, repulsors, vortices)
- [ ] Fluid simulation
- [ ] WebWorker physics for better performance
- [ ] VR/AR support for immersive manipulation
- [ ] Recording and playback system
- [ ] Scripting API for procedural generation

### Performance Improvements
- [ ] GPU-accelerated physics with WebGPU
- [ ] Instanced rendering for large particle counts
- [ ] Level-of-detail (LOD) system
- [ ] Octree spatial partitioning option

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Ira Greenberg

## 🙏 Acknowledgments

- **Thomas Jakobsen** for the Verlet integration physics paper
- **Three.js Community** for the excellent 3D graphics library
- **React Three Fiber Team** for the React renderer for Three.js
- **Zustand** for the elegant state management solution

## 📧 Contact

Ira Greenberg - [GitHub](https://github.com/irajgreenberg)

Project Link: [https://github.com/irajgreenberg/protobyte-studio](https://github.com/irajgreenberg/protobyte-studio)