import { useEffect } from 'react';
import { Viewport } from './Viewport';
import { useEngineStore } from '../../stores/useEngineStore';
import './ViewportLayout.css';

export type CameraView = 'perspective' | 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';

interface ViewportConfig {
  id: number;
  view: CameraView;
  label: string;
}

const VIEWPORT_CONFIGS: Record<string, ViewportConfig[]> = {
  single: [
    { id: 0, view: 'perspective', label: 'Perspective' }
  ],
  split: [
    { id: 0, view: 'perspective', label: 'Perspective' },
    { id: 1, view: 'front', label: 'Front' }
  ],
  triple: [
    { id: 0, view: 'perspective', label: 'Perspective' },
    { id: 1, view: 'top', label: 'Top' },
    { id: 2, view: 'right', label: 'Right' }
  ],
  quad: [
    { id: 0, view: 'top', label: 'Top' },
    { id: 1, view: 'front', label: 'Front' },
    { id: 2, view: 'right', label: 'Right' },
    { id: 3, view: 'perspective', label: 'Perspective' }
  ]
};

export function ViewportLayout() {
  const viewportMode = useEngineStore((state) => state.viewportMode);
  const activeViewport = useEngineStore((state) => state.activeViewport);
  const setActiveViewport = useEngineStore((state) => state.setActiveViewport);
  const setViewportMode = useEngineStore((state) => state.setViewportMode);
  
  const viewports = VIEWPORT_CONFIGS[viewportMode];
  
  // Handle keyboard shortcuts for viewport mode switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Check for number keys 1-4
      if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
        switch(e.key) {
          case '1':
            setViewportMode('single');
            break;
          case '2':
            setViewportMode('split');
            break;
          case '3':
            setViewportMode('triple');
            break;
          case '4':
            setViewportMode('quad');
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setViewportMode]);
  
  return (
    <div className={`viewport-layout viewport-layout-${viewportMode}`}>
      {viewports.map((config) => (
        <div 
          key={config.id}
          className={`viewport-container ${activeViewport === config.id ? 'active' : ''}`}
          onClick={() => setActiveViewport(config.id)}
        >
          <div className="viewport-label">{config.label}</div>
          <Viewport 
            viewportId={config.id}
            cameraView={config.view}
            isActive={activeViewport === config.id}
          />
        </div>
      ))}
    </div>
  );
}