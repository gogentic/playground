import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import type { Scene } from '../../lib/supabase';
import './SceneManager.css';

interface SceneManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SceneManager({ isOpen, onClose }: SceneManagerProps) {
  const { 
    user, 
    scenes, 
    currentScene,
    saveCurrentScene, 
    updateCurrentScene,
    loadScene, 
    deleteScene,
    createNewScene,
    loadUserScenes 
  } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'save' | 'load'>('save');
  const [sceneName, setSceneName] = useState('');
  const [sceneDescription, setSceneDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadUserScenes();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (currentScene) {
      setSceneName(currentScene.name);
      setSceneDescription(currentScene.description || '');
    }
  }, [currentScene]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!sceneName.trim()) {
      setError('Please enter a scene name');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (currentScene) {
        // Update existing scene
        await updateCurrentScene();
      } else {
        // Save new scene
        await saveCurrentScene(sceneName, sceneDescription);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save scene');
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = async (scene: Scene) => {
    setLoading(true);
    setError(null);

    try {
      await loadScene(scene.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scene');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sceneId: string) => {
    if (!confirm('Are you sure you want to delete this scene?')) return;

    try {
      await deleteScene(sceneId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete scene');
    }
  };

  const handleNew = () => {
    createNewScene();
    setSceneName('');
    setSceneDescription('');
    onClose();
  };

  return (
    <div className="scene-manager-overlay" onClick={onClose}>
      <div className="scene-manager" onClick={(e) => e.stopPropagation()}>
        <div className="scene-manager-header">
          <h2>Scene Manager</h2>
          <button className="scene-manager-close" onClick={onClose}>×</button>
        </div>

        {!user ? (
          <div className="scene-manager-auth-prompt">
            <p>Please sign in to save and load scenes</p>
          </div>
        ) : (
          <>
            <div className="scene-manager-tabs">
              <button 
                className={`tab ${activeTab === 'save' ? 'active' : ''}`}
                onClick={() => setActiveTab('save')}
              >
                Save Scene
              </button>
              <button 
                className={`tab ${activeTab === 'load' ? 'active' : ''}`}
                onClick={() => setActiveTab('load')}
              >
                Load Scene
              </button>
            </div>

            <div className="scene-manager-content">
              {error && (
                <div className="error-message">{error}</div>
              )}

              {activeTab === 'save' && (
                <div className="save-tab">
                  <div className="form-group">
                    <label>Scene Name</label>
                    <input
                      type="text"
                      value={sceneName}
                      onChange={(e) => setSceneName(e.target.value)}
                      placeholder="Enter scene name..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Description (optional)</label>
                    <textarea
                      value={sceneDescription}
                      onChange={(e) => setSceneDescription(e.target.value)}
                      placeholder="Enter scene description..."
                      rows={3}
                    />
                  </div>
                  <div className="form-actions">
                    <button 
                      className="btn-primary"
                      onClick={handleSave}
                      disabled={saving || !sceneName.trim()}
                    >
                      {saving ? 'Saving...' : (currentScene ? 'Update Scene' : 'Save Scene')}
                    </button>
                    {currentScene && (
                      <button 
                        className="btn-secondary"
                        onClick={handleNew}
                      >
                        New Scene
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'load' && (
                <div className="load-tab">
                  {scenes.length === 0 ? (
                    <div className="no-scenes">No saved scenes yet</div>
                  ) : (
                    <div className="scenes-list">
                      {scenes.map((scene) => (
                        <div key={scene.id} className="scene-item">
                          <div className="scene-info">
                            <h4>{scene.name}</h4>
                            {scene.description && (
                              <p>{scene.description}</p>
                            )}
                            <span className="scene-date">
                              {new Date(scene.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="scene-actions">
                            <button 
                              className="btn-load"
                              onClick={() => handleLoad(scene)}
                              disabled={loading}
                            >
                              Load
                            </button>
                            <button 
                              className="btn-delete"
                              onClick={() => handleDelete(scene.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}