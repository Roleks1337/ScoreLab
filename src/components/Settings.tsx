import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { usePremium } from '../lib/usePremium';
import { useAdmin } from '../lib/useAdmin';
import logoFull from '../assets/Zasob1.svg';
import {
  type ThemeChoice,
  getStoredTheme,
  getStoredContrast,
  setTheme as persistTheme,
  setContrast as persistContrast,
} from '../lib/theme';
import './SettingsMain.css';

export default function Settings() {
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(true);

  // Appearance state — initial values come from the shared theme store.
  const [theme, setThemeState] = useState<ThemeChoice>(() => getStoredTheme());
  const [highContrast, setHighContrastState] = useState(() => getStoredContrast());

  const setTheme = (choice: ThemeChoice) => {
    setThemeState(choice);
    persistTheme(choice);
  };

  const setHighContrast = (enabled: boolean) => {
    setHighContrastState(enabled);
    persistContrast(enabled);
  };

  // Premium code redemption state
  const [codeInput, setCodeInput] = useState('');
  const [codeMessage, setCodeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
  }, []);

  const premium = usePremium(user?.id);
  const admin = useAdmin(user?.id);

  if (loading) return <div className="settings-page"><div className="settings-content">Ładowanie...</div></div>;
  if (!user) return <div className="settings-page"><div className="settings-content">Musisz być zalogowany, aby zobaczyć tę stronę.</div></div>;

  const initials = user.user_metadata?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase();

  const formatDate = (date: Date | null) => {
    if (!date) return '—';
    return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleRedeemCode = async () => {
    if (!codeInput.trim()) return;
    setCodeLoading(true);
    setCodeMessage(null);

    const code = codeInput.trim().toUpperCase();

    // Look up the code in premium_codes table (without used=false check, since multi-use codes remain active)
    const { data: codeData, error: codeError } = await supabase
      .from('premium_codes')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (codeError || !codeData) {
      setCodeMessage({ type: 'error', text: 'Nieprawidłowy kod.' });
      setCodeLoading(false);
      return;
    }

    // If it's a single-use code, check if it has already been used
    if (!codeData.multi_use && codeData.used) {
      setCodeMessage({ type: 'error', text: 'Ten kod został już wykorzystany.' });
      setCodeLoading(false);
      return;
    }

    // Check if this user has already redeemed this specific code
    const { data: alreadyRedeemed, error: redeemCheckError } = await supabase
      .from('premium_redemptions')
      .select('id')
      .eq('code_id', codeData.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (redeemCheckError) {
      setCodeMessage({ type: 'error', text: 'Wystąpił błąd podczas weryfikacji kodu.' });
      setCodeLoading(false);
      return;
    }

    if (alreadyRedeemed) {
      setCodeMessage({ type: 'error', text: 'Ten kod został już aktywowany na Twoim koncie.' });
      setCodeLoading(false);
      return;
    }

    // Calculate new expiry: extend from today or from current expiry if already premium
    const baseDate = premium.isPremium && premium.expiresAt && premium.expiresAt > new Date()
      ? premium.expiresAt
      : new Date();

    const days = codeData.days ?? 30;
    const newExpiry = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

    // Insert or update premium subscription
    const { error: subError } = await supabase
      .from('premium_subscriptions')
      .upsert({
        user_id: user.id,
        starts_at: new Date().toISOString(),
        expires_at: newExpiry.toISOString(),
        code_used: code,
      }, { onConflict: 'user_id' });

    if (subError) {
      setCodeMessage({ type: 'error', text: 'Wystąpił błąd. Spróbuj ponownie.' });
      setCodeLoading(false);
      return;
    }

    // Log the redemption in premium_redemptions
    await supabase
      .from('premium_redemptions')
      .insert({
        code_id: codeData.id,
        user_id: user.id
      });

    // Mark code as used only if it is a single-use code
    if (!codeData.multi_use) {
      await supabase
        .from('premium_codes')
        .update({ used: true, used_by: user.id, used_at: new Date().toISOString() })
        .eq('id', codeData.id);
    }

    setCodeMessage({
      type: 'success',
      text: `Premium aktywowane! Dostęp ważny do ${formatDate(newExpiry)}.`,
    });
    setCodeInput('');
    premium.refresh();
    setCodeLoading(false);
  };

  return (
    <div className={`settings-page${admin.isAdmin ? ' settings-page--admin' : (premium.isPremium ? ' settings-page--premium' : '')}`}>
      <div className="settings-sidebar">
        <Link to="/" className="settings-home-logo">
          <img className="invert-logo" src={logoFull} alt="ScoreLab Logo" />
        </Link>
        <div className="sidebar-header">Ustawienia użytkownika</div>
        <div
          className={`sidebar-item ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          Moje konto
        </div>
        <div
          className={`sidebar-item ${activeTab === 'privacy' ? 'active' : ''}`}
          onClick={() => setActiveTab('privacy')}
        >
          Prywatność i bezpieczeństwo
        </div>

        <div className="sidebar-divider" />

        <div className="sidebar-header">Premium</div>
        <div
          className={`sidebar-item ${activeTab === 'premium' ? 'active' : ''}`}
          onClick={() => setActiveTab('premium')}
        >
          Premium
          {(premium.isPremium || admin.isAdmin) && <span className="sidebar-premium-badge">✓</span>}
        </div>
        <div
          className={`sidebar-item ${activeTab === 'premium-settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('premium-settings')}
        >
          Ustawienia Premium
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
              <div className={`account-card__banner${admin.isAdmin ? ' account-card__banner--admin' : (premium.isPremium ? ' account-card__banner--premium' : '')}`} />
              <div className="account-card__content">
                <div className="account-card__avatar-wrapper">
                  <div className={`account-card__avatar${admin.isAdmin ? ' account-card__avatar--admin' : (premium.isPremium ? ' account-card__avatar--premium' : '')}`}>
                    {initials}
                    {!admin.isAdmin && premium.isPremium && <span className="avatar-crown">👑</span>}
                  </div>
                </div>
                <div className="account-card__info">
                  <div className="account-card__name">
                    {user.user_metadata?.full_name || 'Użytkownik'}
                    {admin.isAdmin ? (
                      <span className="name-admin-badge">Admin</span>
                    ) : (
                      premium.isPremium && <span className="name-premium-badge">Premium</span>
                    )}
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

                  {(premium.isPremium || admin.isAdmin) && (
                    <div className={`data-item ${admin.isAdmin ? 'data-item--admin' : 'data-item--premium'}`}>
                      <div>
                        <div className="data-item__label">Status Premium</div>
                        <div className={`data-item__value ${admin.isAdmin ? 'data-item__value--admin' : 'data-item__value--premium'}`}>
                          {admin.isAdmin ? '🛡️ Pełny dostęp (Admin)' : `👑 Aktywny · do ${formatDate(premium.expiresAt)}`}
                        </div>
                      </div>
                      <button className="data-item__action" onClick={() => setActiveTab('premium')}>Zarządzaj</button>
                    </div>
                  )}
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

            {/* Status bar — dynamic based on premium.isPremium or admin.isAdmin */}
            {(premium.isPremium || admin.isAdmin) ? (
              <div className={`premium-status-bar ${admin.isAdmin ? 'premium-status-bar--admin' : 'premium-status-bar--active'}`}>
                <div className="premium-status-bar__info">
                  <span className={`premium-status-bar__badge ${admin.isAdmin ? 'premium-status-bar__badge--admin' : 'premium-status-bar__badge--active'}`}>
                    {admin.isAdmin ? '🛡️ Twój status: Administrator' : '👑 Twój status: ScoreLab Premium'}
                  </span>
                  <p className="premium-status-bar__desc">
                    {admin.isAdmin
                      ? 'Posiadasz pełny dostęp administratorski do wszystkich funkcji platformy.'
                      : `Subskrypcja aktywna · Wygasa ${formatDate(premium.expiresAt)} (${premium.daysLeft} ${premium.daysLeft === 1 ? 'dzień' : 'dni'} pozostało)`
                    }
                  </p>
                </div>
                {!admin.isAdmin && (
                  <Link to="/cennik" className="premium-status-bar__cta premium-status-bar__cta--manage">
                    Przedłuż
                  </Link>
                )}
              </div>
            ) : (
              <div className="premium-status-bar">
                <div className="premium-status-bar__info">
                  <span className="premium-status-bar__badge">Twój status: Plan Darmowy</span>
                  <p className="premium-status-bar__desc">Masz dostęp do podstawowych lekcji. Odblokuj zaawansowane generatory, dodatkowe bazy zadań i kursy ponadprogramowe.</p>
                </div>
                <Link to="/cennik" className="premium-status-bar__cta">Zobacz plany</Link>
              </div>
            )}

            {/* Redeem code section */}
            <div className="premium-code-section">
              <h3 className="premium-code-title">Masz kod aktywacyjny?</h3>
              <p className="premium-code-desc">Wpisz kod otrzymany od ScoreLab, aby aktywować lub przedłużyć subskrypcję Premium.</p>
              <div className="premium-code-form">
                <input
                  className="premium-code-input"
                  type="text"
                  placeholder="np. SCORELAB-XXXX-XXXX"
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleRedeemCode()}
                  maxLength={32}
                />
                <button
                  className="premium-code-btn"
                  onClick={handleRedeemCode}
                  disabled={codeLoading || !codeInput.trim()}
                >
                  {codeLoading ? 'Sprawdzanie…' : 'Aktywuj'}
                </button>
              </div>
              {codeMessage && (
                <div className={`premium-code-message premium-code-message--${codeMessage.type}`}>
                  {codeMessage.type === 'success' ? '✓ ' : '⚠ '}{codeMessage.text}
                </div>
              )}
            </div>

            <div className="premium-features-section">
              <h3 className="premium-features-title">Co zyskujesz z Premium?</h3>
              <div className="premium-features-grid">

                {/* Feature 1: Generowanie matur */}
                <div className="premium-feature-card">
                  <div className="premium-feature-card__content">
                    <div className="mock-generator">
                      <div className="mock-title">Generator Arkuszy</div>
                      <div className="mock-control-group">
                        <label>Poziom</label>
                        <select disabled defaultValue="podstawa" style={{ width: '100%' }}>
                          <option value="podstawa">Podstawowy</option>
                        </select>
                      </div>
                      <div className="mock-control-group">
                        <label>Dział</label>
                        <select disabled defaultValue="funkcje" style={{ width: '100%' }}>
                          <option value="funkcje">Funkcje kwadratowe</option>
                        </select>
                      </div>
                      <button className="mock-btn" disabled style={{ width: '100%' }}>Generuj arkusz CKE</button>
                    </div>
                  </div>
                  <div className="premium-lock-overlay">
                    <div className="premium-lock-badge">Wkrótce</div>
                    <div className="premium-lock-icon">🔒</div>
                    <div className="premium-lock-text">Generowanie matur</div>
                    <div className="premium-lock-sub">
                      {premium.isPremium || admin.isAdmin
                        ? 'Ta funkcja jest obecnie w przygotowaniu'
                        : 'Funkcja dostępna tylko dla subskrybentów Premium'
                      }
                    </div>
                    {!(premium.isPremium || admin.isAdmin) && (
                      <Link to="/cennik" className="premium-unlock-btn">Aktywuj Premium</Link>
                    )}
                  </div>
                </div>

                {/* Feature 2: Dodatkowe zadania */}
                <div className="premium-feature-card">
                  <div className="premium-feature-card__content">
                    <div className="mock-tasks">
                      <div className="mock-title">Baza ćwiczeń</div>
                      <div className="mock-task-item">
                        <span className="task-badge easy">Łatwe</span>
                        <div className="task-desc">Oblicz wyróżnik równania kwadratowego...</div>
                      </div>
                      <div className="mock-task-item">
                        <span className="task-badge hard">Trudne</span>
                        <div className="task-desc">Wyznacz wszystkie wartości parametru m...</div>
                      </div>
                    </div>
                  </div>
                  <div className="premium-lock-overlay">
                    <div className="premium-lock-badge">Wkrótce</div>
                    <div className="premium-lock-icon">🔒</div>
                    <div className="premium-lock-text">Dodatkowe zadania</div>
                    <div className="premium-lock-sub">
                      {premium.isPremium || admin.isAdmin
                        ? 'Ta funkcja jest obecnie w przygotowaniu'
                        : 'Odblokuj ponad 500 dodatkowych zadań z omówieniem'
                      }
                    </div>
                    {!(premium.isPremium || admin.isAdmin) && (
                      <Link to="/cennik" className="premium-unlock-btn">Aktywuj Premium</Link>
                    )}
                  </div>
                </div>

                {/* Feature 3: Kursy ponadprogramowe */}
                <div className="premium-feature-card">
                  <div className="premium-feature-card__content">
                    <div className="mock-courses">
                      <div className="mock-title">Kursy Advanced</div>
                      <div className="mock-course-item">
                        <span className="course-icon">📈</span>
                        <div className="course-info">
                          <div className="course-name">Wstęp do Analizy Matematycznej</div>
                          <div className="course-duration">12 lekcji</div>
                        </div>
                      </div>
                      <div className="mock-course-item">
                        <span className="course-icon">🧮</span>
                        <div className="course-info">
                          <div className="course-name">Elementy Teorii Liczb i Dowody</div>
                          <div className="course-duration">8 lekcji</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="premium-lock-overlay">
                    <div className="premium-lock-badge">Wkrótce</div>
                    <div className="premium-lock-icon">🔒</div>
                    <div className="premium-lock-text">Kursy ponadprogramowe</div>
                    <div className="premium-lock-sub">
                      {premium.isPremium || admin.isAdmin
                        ? 'Ta funkcja jest obecnie w przygotowaniu'
                        : 'Wykraczaj poza podstawy z kursami akademickimi'
                      }
                    </div>
                    {!(premium.isPremium || admin.isAdmin) && (
                      <Link to="/cennik" className="premium-unlock-btn">Aktywuj Premium</Link>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {activeTab === 'premium-settings' && (
          <div className="settings-view">
            <h2 className="settings-section-title">Ustawienia Premium</h2>

            {!(premium.isPremium || admin.isAdmin) && (
              <div className="premium-lock-banner">
                <div className="premium-lock-banner__info">
                  <span className="premium-lock-banner__badge">🔒 Funkcja Premium</span>
                  <p className="premium-lock-banner__desc">Poniższe opcje wymagają aktywnej subskrypcji ScoreLab Premium.</p>
                </div>
                <Link to="/cennik" className="premium-lock-banner__btn">Aktywuj Premium</Link>
              </div>
            )}

            <div className="settings-group">
              <h3 className="settings-group-title">Odtwarzacz wideo</h3>
              <div className="settings-row disabled" style={!(premium.isPremium || admin.isAdmin) ? { opacity: 0.6, pointerEvents: 'none' } : {}}>
                <div className="settings-row__info">
                  <div className="settings-row__label">Domyślna jakość 4K / 1080p {!(premium.isPremium || admin.isAdmin) && '🔒'}</div>
                  <div className="settings-row__desc">Odtwarzaj lekcje wideo w najwyższej dostępnej rozdzielczości.</div>
                </div>
                <div className="settings-toggle"><div className="settings-toggle__handle" /></div>
              </div>

              <div className="settings-row disabled" style={!(premium.isPremium || admin.isAdmin) ? { opacity: 0.6, pointerEvents: 'none' } : {}}>
                <div className="settings-row__info">
                  <div className="settings-row__label">Pobieranie w tle {!(premium.isPremium || admin.isAdmin) && '🔒'}</div>
                  <div className="settings-row__desc">Automatycznie pobieraj powiązane pliki PDF oraz lekcje wideo na urządzenie.</div>
                </div>
                <div className="settings-toggle"><div className="settings-toggle__handle" /></div>
              </div>
            </div>

            <div className="settings-group">
              <h3 className="settings-group-title">Funkcje eksperymentalne</h3>
              <div className="settings-row disabled" style={!(premium.isPremium || admin.isAdmin) ? { opacity: 0.6, pointerEvents: 'none' } : {}}>
                <div className="settings-row__info">
                  <div className="settings-row__label">Dostęp do wersji Beta {!(premium.isPremium || admin.isAdmin) && '🔒'}</div>
                  <div className="settings-row__desc">Testuj nowe generatory arkuszy i zaawansowane moduły przed ich oficjalną premierą.</div>
                </div>
                <div className="settings-toggle"><div className="settings-toggle__handle" /></div>
              </div>
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
                <div
                  className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  <div className="theme-preview theme-preview--light" />
                  <span>Jasny</span>
                </div>
                <div
                  className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  <div className="theme-preview theme-preview--dark" />
                  <span>Ciemny</span>
                </div>
                <div
                  className={`theme-option ${theme === 'system' ? 'active' : ''}`}
                  onClick={() => setTheme('system')}
                >
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
                <div
                  className={`settings-toggle ${highContrast ? 'settings-toggle--active' : ''}`}
                  onClick={() => setHighContrast(!highContrast)}
                >
                  <div className="settings-toggle__handle" />
                </div>
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
