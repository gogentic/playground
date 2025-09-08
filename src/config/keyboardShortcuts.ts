export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: string;
  description: string;
  category: 'edit' | 'view' | 'file' | 'transform' | 'selection';
}

export const keyboardShortcuts: KeyboardShortcut[] = [
  // Transform shortcuts
  {
    key: 't',
    action: 'setTransformMode:translate',
    description: 'Translate mode',
    category: 'transform'
  },
  {
    key: 'r',
    action: 'setTransformMode:rotate',
    description: 'Rotate mode',
    category: 'transform'
  },
  {
    key: 's',
    action: 'setTransformMode:scale',
    description: 'Scale mode',
    category: 'transform'
  },
  {
    key: 'g',
    action: 'setTransformMode:grab',
    description: 'Grab/Move mode',
    category: 'transform'
  },
  
  // Edit mode shortcuts
  {
    key: 'e',
    action: 'toggleEditMode',
    description: 'Toggle edit mode',
    category: 'edit'
  },
  {
    key: 'Delete',
    action: 'deleteSelectedParticles',
    description: 'Delete selected',
    category: 'edit'
  },
  {
    key: 'Backspace',
    action: 'deleteSelectedParticles',
    description: 'Delete selected',
    category: 'edit'
  },
  {
    key: 'd',
    ctrl: true,
    action: 'duplicateSelected',
    description: 'Duplicate selected',
    category: 'edit'
  },
  
  // Selection shortcuts
  {
    key: 'a',
    ctrl: true,
    action: 'selectAllParticles',
    description: 'Select all',
    category: 'selection'
  },
  {
    key: 'Escape',
    action: 'clearSelection',
    description: 'Clear selection',
    category: 'selection'
  },
  {
    key: 'w',
    action: 'clearSelection',
    description: 'Clear selection',
    category: 'selection'
  },
  {
    key: 'i',
    ctrl: true,
    action: 'invertSelection',
    description: 'Invert selection',
    category: 'selection'
  },
  
  // Undo/Redo
  {
    key: 'z',
    ctrl: true,
    action: 'undo',
    description: 'Undo',
    category: 'edit'
  },
  {
    key: 'z',
    ctrl: true,
    shift: true,
    action: 'redo',
    description: 'Redo',
    category: 'edit'
  },
  {
    key: 'y',
    ctrl: true,
    action: 'redo',
    description: 'Redo',
    category: 'edit'
  },
  
  // File operations
  {
    key: 's',
    ctrl: true,
    action: 'showSceneManager',
    description: 'Save/Load scene',
    category: 'file'
  },
  
  // View shortcuts
  {
    key: 'h',
    action: 'toggleGrid',
    description: 'Toggle grid',
    category: 'view'
  },
  {
    key: 'c',
    action: 'recenterCamera',
    description: 'Recenter camera on selection',
    category: 'view'
  },
  {
    key: 'Space',
    action: 'togglePlayPause',
    description: 'Play/Pause simulation',
    category: 'view'
  },
  
  // Viewport layout shortcuts
  {
    key: '1',
    action: 'setViewportMode:single',
    description: 'Single viewport',
    category: 'view'
  },
  {
    key: '2',
    action: 'setViewportMode:split',
    description: 'Split viewport (2 views)',
    category: 'view'
  },
  {
    key: '3',
    action: 'setViewportMode:triple',
    description: 'Triple viewport (3 views)',
    category: 'view'
  },
  {
    key: '4',
    action: 'setViewportMode:quad',
    description: 'Quad viewport (4 views)',
    category: 'view'
  }
];

export function getShortcutString(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.meta) parts.push('Cmd');
  parts.push(shortcut.key);
  return parts.join('+');
}

export function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase() || 
                   event.key === shortcut.key;
  const ctrlMatch = (shortcut.ctrl || false) === (event.ctrlKey || event.metaKey);
  const shiftMatch = (shortcut.shift || false) === event.shiftKey;
  const altMatch = (shortcut.alt || false) === event.altKey;
  
  return keyMatch && ctrlMatch && shiftMatch && altMatch;
}