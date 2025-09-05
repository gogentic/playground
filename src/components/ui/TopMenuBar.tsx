import { useState } from 'react';
import { useEngineStore } from '../../stores/useEngineStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { AuthModal } from '../auth/AuthModal';
import { SceneManager } from '../scenes/SceneManager';
import './TopMenuBar.css';

export function TopMenuBar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSceneManager, setShowSceneManager] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const engine = useEngineStore((state) => state.engine);
  const toggleEditMode = useEngineStore((state) => state.toggleEditMode);
  const isEditMode = useEngineStore((state) => state.isEditMode);
  const resetSimulation = useEngineStore((state) => state.resetSimulation);
  const undo = useEngineStore((state) => state.undo);
  const redo = useEngineStore((state) => state.redo);
  const canUndo = useEngineStore((state) => state.canUndo);
  const canRedo = useEngineStore((state) => state.canRedo);
  const clearAll = useEngineStore((state) => state.clearAll);
  const isPlaying = useEngineStore((state) => state.isPlaying);
  const play = useEngineStore((state) => state.play);
  const pause = useEngineStore((state) => state.pause);
  const step = useEngineStore((state) => state.step);
  const reset = useEngineStore((state) => state.reset);
  
  const { user, signOut, createNewScene } = useAuthStore();

  const handleMenuClick = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleAction = (action: () => void) => {
    action();
    setActiveMenu(null);
  };

  return (
    <>
    <div className="top-menu-bar">
      <div className="menu-items">
        {/* File Menu */}
        <div className="menu-item">
          <button 
            className={`menu-button ${activeMenu === 'file' ? 'active' : ''}`}
            onClick={() => handleMenuClick('file')}
          >
            File
          </button>
          {activeMenu === 'file' && (
            <div className="menu-dropdown">
              <button onClick={() => handleAction(() => {
                createNewScene();
                resetSimulation();
              })}>New Scene</button>
              <button onClick={() => {
                handleAction(() => setShowSceneManager(true));
              }}>
                Save/Load Scene... <span className="shortcut">Ctrl+S</span>
              </button>
              <div className="menu-separator"></div>
              <button onClick={() => handleAction(clearAll)}>Clear All</button>
            </div>
          )}
        </div>

        {/* Edit Menu */}
        <div className="menu-item">
          <button 
            className={`menu-button ${activeMenu === 'edit' ? 'active' : ''}`}
            onClick={() => handleMenuClick('edit')}
          >
            Edit
          </button>
          {activeMenu === 'edit' && (
            <div className="menu-dropdown">
              <button onClick={() => handleAction(undo)} disabled={!canUndo()}>
                Undo <span className="shortcut">Ctrl+Z</span>
              </button>
              <button onClick={() => handleAction(redo)} disabled={!canRedo()}>
                Redo <span className="shortcut">Ctrl+Y</span>
              </button>
              <div className="menu-separator"></div>
              <button onClick={() => handleAction(toggleEditMode)}>
                {isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'} <span className="shortcut">E</span>
              </button>
              <div className="menu-separator"></div>
              <button disabled>Select All</button>
              <button disabled>Deselect All</button>
            </div>
          )}
        </div>

        {/* Create Menu */}
        <div className="menu-item">
          <button 
            className={`menu-button ${activeMenu === 'create' ? 'active' : ''}`}
            onClick={() => handleMenuClick('create')}
          >
            Create
          </button>
          {activeMenu === 'create' && (
            <div className="menu-dropdown">
              <button disabled>Particle</button>
              <button disabled>Constraint</button>
              <div className="menu-separator"></div>
              <button disabled>Rope</button>
              <button disabled>Cloth</button>
              <button disabled>Box</button>
            </div>
          )}
        </div>

        {/* Modify Menu */}
        <div className="menu-item">
          <button 
            className={`menu-button ${activeMenu === 'modify' ? 'active' : ''}`}
            onClick={() => handleMenuClick('modify')}
          >
            Modify
          </button>
          {activeMenu === 'modify' && (
            <div className="menu-dropdown">
              <button disabled>Properties</button>
              <button disabled>Transform</button>
              <button disabled>Physics Settings</button>
              <div className="menu-separator"></div>
              <button disabled>Fix Selected</button>
              <button disabled>Unfix Selected</button>
            </div>
          )}
        </div>

        {/* View Menu */}
        <div className="menu-item">
          <button 
            className={`menu-button ${activeMenu === 'view' ? 'active' : ''}`}
            onClick={() => handleMenuClick('view')}
          >
            View
          </button>
          {activeMenu === 'view' && (
            <div className="menu-dropdown">
              <button disabled>Reset Camera</button>
              <button disabled>Frame Selected</button>
              <div className="menu-separator"></div>
              <button disabled>Show Grid</button>
              <button disabled>Show Stats</button>
              <button disabled>Show Bounding Boxes</button>
            </div>
          )}
        </div>

        {/* Windows Menu */}
        <div className="menu-item">
          <button 
            className={`menu-button ${activeMenu === 'windows' ? 'active' : ''}`}
            onClick={() => handleMenuClick('windows')}
          >
            Windows
          </button>
          {activeMenu === 'windows' && (
            <div className="menu-dropdown">
              <button disabled>Tools Panel</button>
              <button disabled>Properties Panel</button>
              <button disabled>Environment Panel</button>
              <div className="menu-separator"></div>
              <button disabled>Reset Layout</button>
            </div>
          )}
        </div>

        {/* Help Menu */}
        <div className="menu-item">
          <button 
            className={`menu-button ${activeMenu === 'help' ? 'active' : ''}`}
            onClick={() => handleMenuClick('help')}
          >
            Help
          </button>
          {activeMenu === 'help' && (
            <div className="menu-dropdown">
              <button disabled>Documentation</button>
              <button disabled>Keyboard Shortcuts</button>
              <div className="menu-separator"></div>
              <button disabled>About Protobyte Studio</button>
            </div>
          )}
        </div>
      </div>

      {/* Simulation Controls */}
      <div className="simulation-controls">
        <button 
          className={`control-btn ${isEditMode ? 'edit-mode' : ''}`}
          onClick={toggleEditMode}
          title={isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
        >
          {isEditMode ? 'EDIT' : 'SIM'}
        </button>
        <div className="control-separator"></div>
        {isPlaying ? (
          <button 
            className="control-btn" 
            onClick={pause}
            title="Pause"
          >
            ⏸
          </button>
        ) : (
          <button 
            className="control-btn primary" 
            onClick={play}
            disabled={isEditMode}
            title="Play"
          >
            ▶
          </button>
        )}
        <button 
          className="control-btn" 
          onClick={step}
          disabled={isPlaying || isEditMode}
          title="Step"
        >
          ⏭
        </button>
        <button 
          className="control-btn" 
          onClick={reset}
          title="Reset"
        >
          ⏹
        </button>
      </div>
      
      {/* Auth Section - Top Right */}
      <div className="auth-section">
        {user ? (
          <div className="user-menu">
            <button 
              className="user-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <span className="user-avatar">
                {user.email?.charAt(0).toUpperCase()}
              </span>
              <span className="user-email">{user.email}</span>
              <span className="dropdown-arrow">▼</span>
            </button>
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-info">
                  <div className="user-email-full">{user.email}</div>
                </div>
                <div className="menu-separator"></div>
                <button onClick={() => {
                  setShowSceneManager(true);
                  setShowUserMenu(false);
                }}>
                  My Scenes
                </button>
                <div className="menu-separator"></div>
                <button onClick={() => {
                  signOut();
                  setShowUserMenu(false);
                }}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button 
            className="sign-in-button"
            onClick={() => setShowAuthModal(true)}
          >
            Sign In
          </button>
        )}
      </div>
    </div>
    
    {/* Modals */}
    <AuthModal 
      isOpen={showAuthModal} 
      onClose={() => setShowAuthModal(false)} 
    />
    <SceneManager 
      isOpen={showSceneManager} 
      onClose={() => setShowSceneManager(false)} 
    />
    </>
  );
}