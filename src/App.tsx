import { useEffect, useState } from 'react'
import { Viewport } from './components/viewport/Viewport'
import { ToolbarIntegrated } from './components/ui/ToolbarIntegrated'
import { TopMenuBar } from './components/ui/TopMenuBar'
import { SceneManager } from './components/scenes/SceneManager'
import { useEngineStore } from './stores/useEngineStore'
import logoSvg from './assets/logo.svg'
import logoPng from './assets/logo.png'
import './App.css'

function App() {
  const [showSceneManager, setShowSceneManager] = useState(false);
  
  const toggleEditMode = useEngineStore((state) => state.toggleEditMode);
  const isEditMode = useEngineStore((state) => state.isEditMode);
  const selectAllParticles = useEngineStore((state) => state.selectAllParticles);
  const deleteSelectedParticles = useEngineStore((state) => state.deleteSelectedParticles);
  const clearSelection = useEngineStore((state) => state.clearSelection);
  const selectedParticleIds = useEngineStore((state) => state.selectedParticleIds);
  const undo = useEngineStore((state) => state.undo);
  const redo = useEngineStore((state) => state.redo);
  const canUndo = useEngineStore((state) => state.canUndo);
  const canRedo = useEngineStore((state) => state.canRedo);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Toggle edit mode with 'E' key
      if (event.key.toLowerCase() === 'e' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        event.preventDefault();
        toggleEditMode();
      }
      
      // Save/Load with Ctrl+S
      if (event.key.toLowerCase() === 's' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        setShowSceneManager(true);
      }
      
      // Undo/Redo shortcuts (work in both modes)
      if (event.key.toLowerCase() === 'z' && (event.ctrlKey || event.metaKey)) {
        if (event.shiftKey) {
          // Ctrl+Shift+Z or Cmd+Shift+Z: Redo
          if (canRedo()) {
            event.preventDefault();
            redo();
          }
        } else {
          // Ctrl+Z or Cmd+Z: Undo
          if (canUndo()) {
            event.preventDefault();
            undo();
          }
        }
      }
      
      // Alternative redo shortcut: Ctrl+Y or Cmd+Y
      if (event.key.toLowerCase() === 'y' && (event.ctrlKey || event.metaKey)) {
        if (canRedo()) {
          event.preventDefault();
          redo();
        }
      }
      
      // Multiple selection shortcuts (only in edit mode)
      if (isEditMode) {
        // Ctrl+A or Cmd+A: Select all particles
        if (event.key.toLowerCase() === 'a' && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          selectAllParticles();
        }
        
        // Delete key: Delete selected particles
        if (event.key === 'Delete' || event.key === 'Backspace') {
          if (selectedParticleIds.size > 0) {
            event.preventDefault();
            deleteSelectedParticles();
          }
        }
        
        // Escape: Clear selection
        if (event.key === 'Escape') {
          event.preventDefault();
          clearSelection();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleEditMode, isEditMode, selectAllParticles, deleteSelectedParticles, clearSelection, selectedParticleIds, undo, redo, canUndo, canRedo, setShowSceneManager]);

  return (
    <>
      <div className="app">
        <TopMenuBar />
        <ToolbarIntegrated />
        <Viewport />
        <div className="logo-container">
          <img src={logoPng} alt="Protobyte Logo" className="logo" />
          <span className="logo-text">Playground</span>
        </div>
      </div>
      <SceneManager 
        isOpen={showSceneManager}
        onClose={() => setShowSceneManager(false)}
      />
    </>
  )
}

export default App
