import { useEffect } from 'react'
import { Viewport } from './components/viewport/Viewport'
import { ControlPanel } from './components/ui/ControlPanel'
import { Toolbar } from './components/ui/Toolbar'
import { ParticlePropertyPanel } from './components/ui/ParticlePropertyPanel'
import { useEngineStore } from './stores/useEngineStore'
import './App.css'

function App() {
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
  }, [toggleEditMode, isEditMode, selectAllParticles, deleteSelectedParticles, clearSelection, selectedParticleIds, undo, redo, canUndo, canRedo]);

  return (
    <div className="app">
      <Toolbar />
      <Viewport />
      <ControlPanel />
      <ParticlePropertyPanel />
      
      {/* Edit mode indicator overlay */}
      {isEditMode && (
        <div className="edit-mode-overlay">
          <div className="edit-mode-indicator">
            <span>✏️ EDIT MODE</span>
            {selectedParticleIds.size > 0 && (
              <span className="selection-count">{selectedParticleIds.size} selected</span>
            )}
            <span className="shortcut-hint">
              {selectedParticleIds.size > 0 
                ? 'Del to delete • Esc to clear • E to exit'
                : 'Shift+click to multi-select • Ctrl+A for all • E to exit'
              }
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
