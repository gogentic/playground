import { useEffect, useState } from 'react'
import { ViewportLayout } from './components/viewport/ViewportLayout'
import { ToolbarIntegrated } from './components/ui/ToolbarIntegrated'
import { TopMenuBar } from './components/ui/TopMenuBar'
import { SceneManager } from './components/scenes/SceneManager'
import { AuthModal } from './components/auth/AuthModal'
import { useEngineStore } from './stores/useEngineStore'
import { useAuthStore } from './stores/useAuthStore'
import { keyboardShortcuts, matchesShortcut } from './config/keyboardShortcuts'
import logoPng from './assets/logo.png'
import './App.css'

function App() {
  const [showSceneManager, setShowSceneManager] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  
  const selectAllParticles = useEngineStore((state) => state.selectAllParticles);
  const deleteSelectedParticles = useEngineStore((state) => state.deleteSelectedParticles);
  const clearSelection = useEngineStore((state) => state.clearSelection);
  const selectedParticleIds = useEngineStore((state) => state.selectedParticleIds);
  const undo = useEngineStore((state) => state.undo);
  const redo = useEngineStore((state) => state.redo);
  const canUndo = useEngineStore((state) => state.canUndo);
  const canRedo = useEngineStore((state) => state.canRedo);
  const setTransformMode = useEngineStore((state) => state.setTransformMode);
  const isPlaying = useEngineStore((state) => state.isPlaying);
  const play = useEngineStore((state) => state.play);
  const pause = useEngineStore((state) => state.pause);
  const toggleGrid = useEngineStore((state) => state.toggleGrid);
  const recenterCamera = useEngineStore((state) => state.recenterCamera);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Check each shortcut
      for (const shortcut of keyboardShortcuts) {
        if (matchesShortcut(event, shortcut)) {
          const [action, param] = shortcut.action.split(':');
          
          switch (action) {
              
            case 'setTransformMode':
              if (param) {
                event.preventDefault();
                setTransformMode(param as 'translate' | 'rotate' | 'scale' | 'grab');
              }
              break;
              
            case 'deleteSelectedParticles':
              if (selectedParticleIds.size > 0) {
                event.preventDefault();
                deleteSelectedParticles();
              }
              break;
              
            case 'duplicateSelected':
              // TODO: Implement duplicate function
              break;
              
            case 'selectAllParticles':
              event.preventDefault();
              selectAllParticles();
              break;
              
            case 'clearSelection':
              event.preventDefault();
              clearSelection();
              break;
              
            case 'invertSelection':
              // TODO: Implement invert selection
              break;
              
            case 'undo':
              if (canUndo()) {
                event.preventDefault();
                undo();
              }
              break;
              
            case 'redo':
              if (canRedo()) {
                event.preventDefault();
                redo();
              }
              break;
              
            case 'showSceneManager':
              event.preventDefault();
              setShowSceneManager(true);
              break;
              
            case 'toggleGrid':
              event.preventDefault();
              toggleGrid();
              break;
              
            case 'recenterCamera':
              event.preventDefault();
              recenterCamera();
              break;
              
            case 'togglePlayPause':
              event.preventDefault();
              if (isPlaying) {
                pause();
              } else {
                play();
              }
              break;
          }
          
          // If we matched a shortcut, don't check others
          if (matchesShortcut(event, shortcut)) {
            break;
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectAllParticles, deleteSelectedParticles, clearSelection, selectedParticleIds, undo, redo, canUndo, canRedo, setTransformMode, setShowSceneManager, isPlaying, play, pause, toggleGrid]);

  // Show auth modal if user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true);
    } else if (user) {
      // Check if OAuth user's email is allowed
      const allowedDomains = ['@gogentic.ai']; // Only allow company domain
      const userEmail = user.email || '';
      const isAllowed = allowedDomains.some(domain => userEmail.endsWith(domain));
      
      if (!isAllowed) {
        // Sign out unauthorized users
        useAuthStore.getState().signOut();
        alert('Access restricted to authorized email domains only.');
      } else {
        setShowAuthModal(false);
      }
    }
  }, [user, loading]);

  // Don't render app until auth is checked
  if (loading) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'white' }}>Loading...</div>
      </div>
    );
  }

  // Require authentication
  if (!user) {
    return (
      <>
        <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'white', textAlign: 'center' }}>
            <img src={logoPng} alt="Protobyte Logo" style={{ width: '200px', marginBottom: '20px' }} />
            <h2>Please sign in to access Protobyte Studio</h2>
          </div>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => {}} />
      </>
    );
  }

  return (
    <>
      <div className="app">
        <TopMenuBar />
        <ToolbarIntegrated />
        <ViewportLayout />
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
