import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import logoFull from '../assets/Extended_ScoreLab.png';
import './SettingsMain.css';

export default function Settings() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="settings-page"><div className="settings-content">Ładowanie...</div></div>;
  if (!user) return <div className="settings-page"><div className="settings-content">Musisz być zalogowany, aby zobaczyć tę stronę.</div></div>;

  const initials = user.user_metadata?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase();

  return (
    <div className="settings-page">
      <Link to="/" className="settings-home-logo">
        <img src={logoFull} alt="ScoreLab Logo" />
      </Link>

      <div className="settings-sidebar">
        <div className="sidebar-header">Ustawienia użytkownika</div>
        <div 
          className={`sidebar-item ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          Moje konto
        </div>
        <div 
          className={`sidebar-item ${activeTab === 'premium' ? 'active' : ''}`}
          onClick={() => setActiveTab('premium')}
        >
          Premium
        </div>
        <div 
          className={`sidebar-item ${activeTab === 'privacy' ? 'active' : ''}`}
          onClick={() => setActiveTab('privacy')}
        >
          Prywatność i bezpieczeństwo
        </div>
        
        <div className="sidebar-divider" />
        
        <div className="sidebar-header">Ustawienia aplikacji</div>
        <div 
          className={`sidebar-item ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          Wygląd
        </div>
        <div 
          className={`sidebar-item ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          Powiadomienia
        </div>
      </div>

      <div className="settings-content">
        {activeTab === 'account' && (
          <div className="account-view">
            <h2 className="settings-section-title">Moje konto</h2>
            
            <div className="account-card">
              <div className="account-card__banner" />
              <div className="account-card__content">
                <div className="account-card__avatar-wrapper">
                  <div className="account-card__avatar">{initials}</div>
                </div>
                <div className="account-card__info">
                  <div className="account-card__name">
                    {user.user_metadata?.full_name || 'Użytkownik'}
                  </div>
                  <div className="account-card__tag">#{user.id.slice(0, 4)}</div>
                </div>
                <button className="account-card__edit-btn">Edytuj profil użytkownika</button>
              </div>

              <div className="account-card__details" style={{ padding: '0 16px 16px' }}>
                <div className="data-list">
                  <div className="data-item">
                    <div>
                      <div className="data-item__label">Nazwa wyświetlana</div>
                      <div className="data-item__value">{user.user_metadata?.full_name || 'Nie ustawiono'}</div>
                    </div>
                    <button className="data-item__action">Edytuj</button>
                  </div>
                  
                  <div className="data-item">
                    <div>
                      <div className="data-item__label">Email</div>
                      <div className="data-item__value">
                        {user.email.replace(/(.{3}).*(@.*)/, '$1********$2')}
                        <span style={{ color: 'var(--discord-blue)', marginLeft: '8px', cursor: 'pointer', fontSize: '12px' }}>Odkryj</span>
                      </div>
                    </div>
                    <button className="data-item__action">Edytuj</button>
                  </div>

                  <div className="data-item">
                    <div>
                      <div className="data-item__label">Numer telefonu</div>
                      <div className="data-item__value">Nie dodano numeru telefonu</div>
                    </div>
                    <button className="data-item__action">Dodaj</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="password-section">
              <h2 className="settings-section-title">Hasło i uwierzytelnianie</h2>
              <button className="change-password-btn">Zmień hasło</button>
            </div>

            <div className="delete-account-section">
              <h2 className="settings-section-title" style={{ color: '#e53e3e' }}>Usuwanie konta</h2>
              <p className="delete-account-text">
                Usunięcie konta jest procesem nieodwracalnym. Wszystkie Twoje postępy, 
                statystyki i zakupione kursy zostaną trwale usunięte.
              </p>
              <button className="delete-account-btn">Usuń konto</button>
            </div>
          </div>
        )}

        {activeTab === 'premium' && (
          <div className="premium-view">
            <h2 className="settings-section-title">Subskrypcja Premium</h2>
            <div className="premium-placeholder-card">
              <div className="premium-badge">Wkrótce</div>
              <h3>Twoja brama do sukcesu z matematyki</h3>
              <p>Zarządzaj swoim planem Premium, przeglądaj faktury i korzystaj z dodatkowych korzyści.</p>
              <button className="btn btn-primary" style={{ marginTop: '20px' }}>Zobacz plany</button>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="settings-view">
            <h2 className="settings-section-title">Prywatność i bezpieczeństwo</h2>
            
            <div className="settings-group">
              <h3 className="settings-group-title">Uwierzytelnianie dwuetapowe (2FA)</h3>
              <div className="settings-row">
                <div className="settings-row__info">
                  <div className="settings-row__label">Włącz 2FA</div>
                  <div className="settings-row__desc">Dodaj dodatkową warstwę zabezpieczeń do swojego konta.</div>
                </div>
                <div className="settings-toggle"><div className="settings-toggle__handle" /></div>
              </div>
            </div>

            <div className="settings-group">
              <h3 className="settings-group-title">Sesje</h3>
              <div className="data-list">
                <div className="data-item">
                  <div>
                    <div className="data-item__value">Windows • Chrome</div>
                    <div className="data-item__label">Twoja aktualna sesja</div>
                  </div>
                  <button className="data-item__action">Wyloguj</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="settings-view">
            <h2 className="settings-section-title">Wygląd</h2>
            
            <div className="settings-group">
              <h3 className="settings-group-title">Motyw</h3>
              <div className="theme-selector">
                <div className="theme-option active">
                  <div className="theme-preview theme-preview--light" />
                  <span>Jasny</span>
                </div>
                <div className="theme-option">
                  <div className="theme-preview theme-preview--dark" />
                  <span>Ciemny</span>
                </div>
                <div className="theme-option">
                  <div className="theme-preview theme-preview--system" />
                  <span>Systemowy</span>
                </div>
              </div>
            </div>

            <div className="settings-group">
              <h3 className="settings-group-title">Dostępność</h3>
              <div className="settings-row">
                <div className="settings-row__info">
                  <div className="settings-row__label">Zwiększony kontrast</div>
                  <div className="settings-row__desc">Poprawia czytelność elementów interfejsu.</div>
                </div>
                <div className="settings-toggle"><div className="settings-toggle__handle" /></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="settings-view">
            <h2 className="settings-section-title">Powiadomienia</h2>
            
            <div className="settings-group">
              <h3 className="settings-group-title">Powiadomienia E-mail</h3>
              <div className="settings-row">
                <div className="settings-row__info">
                  <div className="settings-row__label">Nowe kursy i materiały</div>
                  <div className="settings-row__desc">Otrzymuj informacje o nowościach na platformie.</div>
                </div>
                <div className="settings-toggle settings-toggle--active"><div className="settings-toggle__handle" /></div>
              </div>
              <div className="settings-row">
                <div className="settings-row__info">
                  <div className="settings-row__label">Postępy w nauce</div>
                  <div className="settings-row__desc">Tygodniowe podsumowania Twoich wyników.</div>
                </div>
                <div className="settings-toggle settings-toggle--active"><div className="settings-toggle__handle" /></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
