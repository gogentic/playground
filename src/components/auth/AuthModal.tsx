import { AuthForm } from './AuthForm';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2>Sign In to Playground</h2>
          <button className="auth-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="auth-modal-content">
          <AuthForm onSuccess={onClose} />
        </div>
      </div>
    </div>
  );
}