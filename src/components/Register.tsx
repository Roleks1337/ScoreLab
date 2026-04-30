import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Auth.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'register' | 'login';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'register' }: AuthModalProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'register' | 'login'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });
        if (signUpError) throw signUpError;
        
        // After signup, we usually need to confirm email, 
        // but for now let's assume auto-login or just inform user
        alert('Rejestracja zakończona sukcesem! Sprawdź email lub zaloguj się.');
        setMode('login');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        
        onClose();
        navigate('/kursy');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Wystąpił nieoczekiwany błąd.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(prev => prev === 'register' ? 'login' : 'register');
    setError(null);
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-modal__close" onClick={onClose}>✕</button>
        
        <h3 className="auth-modal__title">
          {mode === 'register' ? 'Załóż darmowe konto' : 'Zaloguj się'}
        </h3>
        <p className="auth-modal__subtitle">
          {mode === 'register' 
            ? 'Zyskaj dostęp do śledzenia postępów i statystyk.' 
            : 'Witaj ponownie! Kontynuuj swoją naukę.'}
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-modal__form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label>Imię</label>
              <input 
                type="text" 
                placeholder="Twoje imię" 
                value={name}
                onChange={e => setName(e.target.value)}
                required 
              />
            </div>
          )}
          
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              placeholder="adres@email.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Hasło</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary auth-modal__submit"
            disabled={loading}
          >
            {loading ? <span className="loading-spinner"></span> : (mode === 'register' ? 'Zarejestruj się' : 'Zaloguj się')}
          </button>
        </form>

        <div className="auth-modal__footer">
          {mode === 'register' ? (
            <>
              Masz już konto? <span className="auth-modal__switch" onClick={switchMode}>Zaloguj się</span>
            </>
          ) : (
            <>
              Nie masz jeszcze konta? <span className="auth-modal__switch" onClick={switchMode}>Zarejestruj się</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
