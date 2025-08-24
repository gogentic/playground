# Verlet 3D Physics Engine

A real-time 3D physics simulation engine built with React, TypeScript, and Three.js, featuring Verlet integration for particle-based physics with an advanced edit mode for interactive particle manipulation.

![Verlet 3D Engine](https://img.shields.io/badge/Physics-Verlet%20Integration-blue) ![React](https://img.shields.io/badge/React-18.x-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6) ![Three.js](https://img.shields.io/badge/Three.js-R3F-orange)

## ✨ Features

### 🎯 Core Physics Engine
- **Verlet Integration**: Stable, energy-conserving particle physics
- **Real-time Simulation**: 60 FPS physics with configurable timestep
- **Constraint System**: Distance constraints for ropes, cloth, and structures
- **Collision Detection**: Spatial hash optimization for performance
- **Ground Collision**: Configurable ground plane with realistic bouncing

### 🎮 Interactive Edit Mode
- **Live Editing**: Pause physics and manipulate particles in real-time
- **Drag & Drop**: Intuitive 3D particle positioning with mouse
- **Multiple Selection**: Shift+click to select multiple particles
- **Group Operations**: Drag multiple particles together maintaining relative positions
- **Visual Feedback**: Color-coded selection states and edit mode indicators

### 🔄 Advanced Undo/Redo System
- **Full History Tracking**: Complete state snapshots for all operations
- **Smart Action Grouping**: Drag operations create single undo actions
- **Keyboard Shortcuts**: Standard Ctrl+Z/Ctrl+Y shortcuts
- **UI Integration**: Visual undo/redo buttons with state feedback
- **Memory Management**: Configurable history limit (50 steps)

### 🏗️ Primitive Creation Tools
- **Particles**: Individual physics objects with customizable properties
- **Ropes**: Flexible constraint chains
- **Cloth**: 2D constraint grids with realistic fabric behavior
- **Boxes**: Rigid constraint structures
- **Composites**: Complex multi-particle systems

### 🎨 Advanced Rendering
- **Real-time 3D**: Hardware-accelerated WebGL rendering
- **Dynamic Lighting**: Directional and ambient lighting with shadows
- **Material System**: Physically-based rendering with metalness/roughness
- **Visual States**: Color-coded feedback for selection, dragging, and constraints
- **Grid System**: Optional reference grid with fade distance

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd verlet-3d-engine

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the application.

### Building for Production

```bash
npm run build
```

## 🎮 Controls & Usage

### Basic Controls
- **Mouse**: Orbit camera around the scene
- **Scroll**: Zoom in/out
- **Right-click + Drag**: Pan camera

### Edit Mode Controls
| Action | Shortcut | Description |
|--------|----------|-------------|
| Toggle Edit Mode | `E` | Enter/exit edit mode |
| Select Particle | `Click` | Select single particle |
| Multi-Select | `Shift + Click` | Add/remove particles from selection |
| Select All | `Ctrl + A` | Select all particles |
| Clear Selection | `Escape` | Clear current selection |
| Delete Selected | `Delete` / `Backspace` | Remove selected particles |
| Undo | `Ctrl + Z` | Undo last action |
| Redo | `Ctrl + Y` / `Ctrl + Shift + Z` | Redo last undone action |

### Particle Manipulation
1. **Enter Edit Mode**: Press `E` or click "Enter Edit Mode"
2. **Select Particles**: Click individual particles or use `Shift+Click` for multiple
3. **Drag to Move**: Click and drag any selected particle to move the group
4. **Exit Edit Mode**: Press `E` again to resume physics simulation

### Creating Objects
Use the toolbar on the left to add different physics primitives:
- **Particle**: Single physics object
- **Rope**: Flexible constraint chain
- **Cloth**: 2D fabric simulation
- **Box**: Rigid structure

## 🔧 Technical Architecture

### Core Components

#### Physics Engine (`src/core/physics/`)
- `VerletEngine.ts`: Main physics simulation loop
- `Vector3.ts`: Optimized 3D vector mathematics
- `SpatialHash.ts`: Collision detection optimization

#### Primitives (`src/core/primitives/`)
- `Particle.ts`: Individual physics objects
- `Constraint.ts`: Distance constraints between particles
- `Composite.ts`: Complex multi-particle systems

#### React Components (`src/components/`)
- `Viewport.tsx`: 3D scene container with Three.js integration
- `ParticleRenderer.tsx`: Individual particle rendering and interaction
- `ControlPanel.tsx`: Physics settings and simulation controls
- `Toolbar.tsx`: Primitive creation tools

#### State Management (`src/stores/`)
- `useEngineStore.ts`: Zustand store for global state management
  - Physics engine state
  - Edit mode and selection state
  - Undo/redo system
  - UI preferences

### Key Technologies
- **React 18**: Component framework with concurrent features
- **TypeScript**: Type-safe development
- **Three.js**: 3D graphics and WebGL rendering
- **React Three Fiber**: React renderer for Three.js
- **React Three Drei**: Useful helpers and controls
- **Zustand**: Lightweight state management
- **Vite**: Fast development and build tooling

## 🎯 Physics Configuration

The engine supports real-time configuration of physics parameters:

- **Gravity**: 3D gravity vector (default: `[0, -9.81, 0]`)
- **Time Step**: Simulation timestep (default: `0.016` for 60 FPS)
- **Iterations**: Constraint solver iterations (default: `2`)
- **Damping**: Global energy damping (default: `0.98`)
- **Bounds**: World boundaries for particle containment

## 🎨 Visual States

### Particle Colors
- **Default**: Original particle color
- **Selected**: Red glow (single selection)
- **Multi-Selected**: Orange glow (multiple selection)
- **Being Dragged**: Cyan glow (active drag)
- **Constraint Start**: Green glow (constraint creation)
- **Edit Mode**: Subtle white glow (draggable indicator)

### UI Indicators
- **Edit Mode Overlay**: Shows current mode and selection count
- **Selection Counter**: Displays number of selected particles
- **Context Hints**: Dynamic keyboard shortcut reminders

## 🔮 Future Enhancements

- **Advanced Constraints**: Angular constraints, springs with different behaviors
- **Collision Shapes**: Sphere, box, and custom collision geometries  
- **Force Fields**: Gravity wells, wind, and magnetic forces
- **Performance Optimization**: Web Workers for physics calculations
- **Export/Import**: Save and load simulation states
- **Animation Recording**: Capture and replay physics simulations
- **VR Support**: Immersive 3D physics manipulation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Verlet Integration**: Thomas Jakobsen's advanced character physics
- **Three.js Community**: Excellent 3D graphics foundation
- **React Three Fiber**: Seamless React/Three.js integration
- **Physics Simulation Research**: Real-time physics simulation techniques