import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAdmin, verifyAdminPassword } from '../lib/useAdmin';
import logoFull from '../assets/Zasob1.svg';
import './AdminPanel.css';

/* ── Helpers ─────────────────────────────────────────────── */
function generateCode(prefix = 'SCORELAB'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${prefix}-${seg(4)}-${seg(4)}`;
}

type Tab = 'codes' | 'subscriptions' | 'users';

interface PremiumCode {
  id: string;
  code: string;
  days: number;
  used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
  note: string | null;
  multi_use: boolean;
  premium_redemptions?: { user_id: string }[];
}

interface Subscription {
  id: string;
  user_id: string;
  expires_at: string;
  starts_at: string;
  code_used: string | null;
  created_at: string;
}

/* ── Password Gate ───────────────────────────────────────── */
function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !password.trim()) return;

    setLoading(true);
    setError('');

    // Artificial delay to prevent brute-force timing attacks
    const [valid] = await Promise.all([
      verifyAdminPassword(userId, password),
      new Promise(r => setTimeout(r, 400)),
    ]);

    setLoading(false);

    if (valid) {
      onSuccess();
    } else {
      setError('Nieprawidłowe hasło panelu. Spróbuj ponownie.');
      setPassword('');
    }
  };

  return (
    <div className="admin-gate">
      <div className="admin-gate__box">
        <div className="admin-gate__icon">🛡️</div>
        <h1 className="admin-gate__title">Panel Administracyjny</h1>
        <p className="admin-gate__desc">Podaj hasło panelu, aby kontynuować.</p>
        <form onSubmit={handleSubmit} className="admin-gate__form">
          <input
            type="password"
            className="admin-gate__input"
            placeholder="Hasło panelu"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            autoComplete="current-password"
          />
          {error && <div className="admin-gate__error">{error}</div>}
          <button
            type="submit"
            className="admin-gate__btn"
            disabled={loading || !password.trim()}
          >
            {loading ? 'Weryfikacja…' : 'Wejdź do panelu →'}
          </button>
        </form>
        <Link to="/" className="admin-gate__back">← Wróć na stronę główną</Link>
      </div>
    </div>
  );
}

/* ── Code Generator Tab ──────────────────────────────────── */
function CodesTab() {
  const [codes, setCodes] = useState<PremiumCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newDays, setNewDays] = useState(30);
  const [newNote, setNewNote] = useState('');
  const [newCount, setNewCount] = useState(1);
  const [multiUse, setMultiUse] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unused' | 'used'>('all');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('premium_codes')
      .select('*, premium_redemptions(user_id)')
      .order('created_at', { ascending: false });
    setCodes(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const handleGenerate = async () => {
    setGenerating(true);
    const rows = Array.from({ length: newCount }, () => ({
      code: generateCode(),
      days: newDays,
      note: newNote.trim() || null,
      multi_use: multiUse,
    }));

    await supabase.from('premium_codes').insert(rows);
    setNewNote('');
    setNewCount(1);
    await fetchCodes();
    setGenerating(false);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopyFeedback(code);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('premium_codes').delete().eq('id', id);
    setDeleteConfirm(null);
    await fetchCodes();
  };

  const filtered = codes.filter(c =>
    filter === 'all'
      ? true
      : filter === 'used'
        ? (c.multi_use ? (c.premium_redemptions?.length ?? 0) > 0 : c.used)
        : (c.multi_use ? (c.premium_redemptions?.length ?? 0) === 0 : !c.used)
  );

  const stats = {
    total: codes.length,
    unused: codes.filter(c => c.multi_use ? (c.premium_redemptions?.length ?? 0) === 0 : !c.used).length,
    used: codes.filter(c => c.multi_use ? (c.premium_redemptions?.length ?? 0) > 0 : c.used).length,
  };

  return (
    <div className="admin-tab">
      {/* Stats row */}
      <div className="admin-stats">
        <div className="admin-stat">
          <div className="admin-stat__value">{stats.total}</div>
          <div className="admin-stat__label">Wszystkie kody</div>
        </div>
        <div className="admin-stat admin-stat--green">
          <div className="admin-stat__value">{stats.unused}</div>
          <div className="admin-stat__label">Nieużyte</div>
        </div>
        <div className="admin-stat admin-stat--gray">
          <div className="admin-stat__value">{stats.used}</div>
          <div className="admin-stat__label">Użyte (min. raz)</div>
        </div>
      </div>

      {/* Generator */}
      <div className="admin-generator">
        <h3 className="admin-generator__title">Generuj nowe kody</h3>
        <div className="admin-generator__row">
          <div className="admin-generator__field">
            <label>Liczba kodów</label>
            <input
              type="number"
              min={1}
              max={50}
              value={newCount}
              onChange={e => setNewCount(Math.min(50, Math.max(1, +e.target.value)))}
              className="admin-input"
            />
          </div>
          <div className="admin-generator__field">
            <label>Typ kodu</label>
            <div className="admin-type-select">
              <button
                type="button"
                className={`admin-type-btn${!multiUse ? ' active' : ''}`}
                onClick={() => setMultiUse(false)}
              >
                Jednorazowy
              </button>
              <button
                type="button"
                className={`admin-type-btn${multiUse ? ' active' : ''}`}
                onClick={() => setMultiUse(true)}
              >
                Wielorazowy
              </button>
            </div>
          </div>
          <div className="admin-generator__field">
            <label>Dni Premium</label>
            <div className="admin-days-select">
              {[7, 14, 30, 60, 90, 365].map(d => (
                <button
                  key={d}
                  className={`admin-days-btn${newDays === d ? ' active' : ''}`}
                  onClick={() => setNewDays(d)}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <div className="admin-generator__field admin-generator__field--grow">
            <label>Notatka (opcjonalnie)</label>
            <input
              type="text"
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="np. Konkurs #1, Beta-tester…"
              className="admin-input"
              maxLength={120}
            />
          </div>
          <button
            className="admin-generate-btn"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? '⟳ Generowanie…' : `✦ Generuj ${newCount > 1 ? `${newCount} kodów` : 'kod'}`}
          </button>
        </div>
      </div>

      {/* Code list */}
      <div className="admin-table-header">
        <h3 className="admin-table-title">Lista kodów</h3>
        <div className="admin-filter">
          {(['all', 'unused', 'used'] as const).map(f => (
            <button
              key={f}
              className={`admin-filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Wszystkie' : f === 'unused' ? 'Nieużyte' : 'Użyte'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Ładowanie kodów…</div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">Brak kodów spełniających kryteria.</div>
      ) : (
        <div className="admin-codes-list">
          {filtered.map(code => {
            const useCount = code.premium_redemptions?.length || 0;
            const isCodeUsed = code.multi_use ? useCount > 0 : code.used;
            return (
              <div key={code.id} className={`admin-code-row${isCodeUsed && !code.multi_use ? ' admin-code-row--used' : ''}`}>
                <div className="admin-code-row__code">
                  <span className="admin-code-row__text">{code.code}</span>
                  <button
                    className={`admin-copy-btn${copyFeedback === code.code ? ' copied' : ''}`}
                    onClick={() => handleCopy(code.code)}
                    title="Kopiuj kod"
                  >
                    {copyFeedback === code.code ? '✓' : '⎘'}
                  </button>
                </div>
                <div className="admin-code-row__meta">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="admin-code-row__days">{code.days} dni</span>
                    {code.multi_use ? (
                      <span className="admin-badge admin-badge--multi">Wielorazowy</span>
                    ) : (
                      <span className="admin-badge admin-badge--used" style={{ fontSize: '10px', padding: '1px 6px' }}>Jednorazowy</span>
                    )}
                  </div>
                  {code.note && <span className="admin-code-row__note">{code.note}</span>}
                </div>
                <div className="admin-code-row__status">
                  {code.multi_use ? (
                    <span className="admin-code-row__use-count">Użyty: {useCount} {useCount === 1 ? 'raz' : 'razy'}</span>
                  ) : code.used ? (
                    <span className="admin-badge admin-badge--used">Użyty</span>
                  ) : (
                    <span className="admin-badge admin-badge--active">Aktywny</span>
                  )}
                </div>
                <div className="admin-code-row__date">
                  {new Date(code.created_at).toLocaleDateString('pl-PL')}
                </div>
                <div className="admin-code-row__actions">
                  {deleteConfirm === code.id ? (
                    <div className="admin-delete-confirm">
                      <span>Usunąć?</span>
                      <button className="admin-delete-yes" onClick={() => handleDelete(code.id)}>Tak</button>
                      <button className="admin-delete-no" onClick={() => setDeleteConfirm(null)}>Nie</button>
                    </div>
                  ) : (
                    <button
                      className="admin-delete-btn"
                      onClick={() => setDeleteConfirm(code.id)}
                      title="Usuń kod"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Subscriptions Tab ───────────────────────────────────── */
function SubscriptionsTab() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteSubConfirm, setDeleteSubConfirm] = useState<string | null>(null);

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('premium_subscriptions')
      .select('*')
      .order('expires_at', { ascending: false });
    setSubs(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubs();
  }, [fetchSubs]);

  const handleDeleteSub = async (id: string) => {
    await supabase.from('premium_subscriptions').delete().eq('id', id);
    setDeleteSubConfirm(null);
    await fetchSubs();
  };

  const now = new Date();
  const active = subs.filter(s => new Date(s.expires_at) > now);
  const expired = subs.filter(s => new Date(s.expires_at) <= now);

  return (
    <div className="admin-tab">
      <div className="admin-stats">
        <div className="admin-stat">
          <div className="admin-stat__value">{subs.length}</div>
          <div className="admin-stat__label">Wszystkich subskrypcji</div>
        </div>
        <div className="admin-stat admin-stat--green">
          <div className="admin-stat__value">{active.length}</div>
          <div className="admin-stat__label">Aktywnych</div>
        </div>
        <div className="admin-stat admin-stat--gray">
          <div className="admin-stat__value">{expired.length}</div>
          <div className="admin-stat__label">Wygasłych</div>
        </div>
      </div>

      <h3 className="admin-table-title" style={{ marginBottom: '16px' }}>Subskrypcje Premium</h3>

      {loading ? (
        <div className="admin-loading">Ładowanie subskrypcji…</div>
      ) : subs.length === 0 ? (
        <div className="admin-empty">Brak subskrypcji w bazie.</div>
      ) : (
        <div className="admin-subs-list">
          {subs.map(sub => {
            const exp = new Date(sub.expires_at);
            const isActive = exp > now;
            const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return (
              <div key={sub.id} className={`admin-sub-row${isActive ? '' : ' admin-sub-row--expired'}`}>
                <div className="admin-sub-row__user">
                  <span className="admin-sub-row__uid">{sub.user_id.slice(0, 8)}…</span>
                  {sub.code_used && <span className="admin-sub-row__code">via {sub.code_used}</span>}
                </div>
                <div className="admin-sub-row__dates">
                  <span>Od: {new Date(sub.starts_at).toLocaleDateString('pl-PL')}</span>
                  <span>Do: {exp.toLocaleDateString('pl-PL')}</span>
                </div>
                <div className="admin-sub-row__status">
                  {isActive ? (
                    <span className="admin-badge admin-badge--active">
                      Aktywna · {daysLeft}d
                    </span>
                  ) : (
                    <span className="admin-badge admin-badge--used">Wygasła</span>
                  )}
                </div>
                <div className="admin-sub-row__actions">
                  {deleteSubConfirm === sub.id ? (
                    <div className="admin-delete-confirm">
                      <span>Usunąć?</span>
                      <button className="admin-delete-yes" onClick={() => handleDeleteSub(sub.id)}>Tak</button>
                      <button className="admin-delete-no" onClick={() => setDeleteSubConfirm(null)}>Nie</button>
                    </div>
                  ) : (
                    <button
                      className="admin-delete-btn"
                      onClick={() => setDeleteSubConfirm(sub.id)}
                      title="Usuń subskrypcję"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

function UsersTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setUsers(data ?? []);
        setLoading(false);
      });
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(text);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  return (
    <div className="admin-tab">
      <div className="admin-stats">
        <div className="admin-stat">
          <div className="admin-stat__value">{users.length}</div>
          <div className="admin-stat__label">Zarejestrowanych użytkowników</div>
        </div>
      </div>

      <h3 className="admin-table-title" style={{ marginBottom: '16px' }}>Użytkownicy platformy</h3>

      {loading ? (
        <div className="admin-loading">Ładowanie użytkowników…</div>
      ) : users.length === 0 ? (
        <div className="admin-empty">Brak zarejestrowanych użytkowników.</div>
      ) : (
        <div className="admin-users-list">
          {users.map(u => (
            <div key={u.id} className="admin-user-row">
              <div className="admin-user-row__info">
                <span className="admin-user-row__name">{u.full_name || 'Brak nazwy'}</span>
                <span className="admin-user-row__email">{u.email}</span>
              </div>
              <div className="admin-user-row__uid">
                <span className="admin-user-row__uid-text" title={u.id}>{u.id}</span>
                <button
                  className={`admin-copy-btn${copyFeedback === u.id ? ' copied' : ''}`}
                  onClick={() => handleCopy(u.id)}
                  title="Kopiuj UID"
                >
                  {copyFeedback === u.id ? '✓' : '⎘'}
                </button>
              </div>
              <div className="admin-user-row__date">
                Zarejestrowany: {new Date(u.created_at).toLocaleDateString('pl-PL')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Admin Panel ────────────────────────────────────── */
export default function AdminPanel() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('codes');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
  }, []);

  const { isAdmin, loading: adminLoading } = useAdmin(user?.id);

  // Redirect non-admins after loading
  if (!authLoading && !adminLoading) {
    if (!user) {
      return (
        <div className="admin-denied">
          <div className="admin-denied__box">
            <div className="admin-denied__icon">🔐</div>
            <h2>Brak dostępu</h2>
            <p>Musisz być zalogowany, aby zobaczyć tę stronę.</p>
            <Link to="/" className="admin-denied__btn">Wróć na stronę główną</Link>
          </div>
        </div>
      );
    }
    if (!isAdmin) {
      return (
        <div className="admin-denied">
          <div className="admin-denied__box">
            <div className="admin-denied__icon">🚫</div>
            <h2>Brak uprawnień</h2>
            <p>Twoje konto nie ma uprawnień administratora.</p>
            <Link to="/" className="admin-denied__btn">Wróć na stronę główną</Link>
          </div>
        </div>
      );
    }
  }

  if (authLoading || adminLoading) {
    return (
      <div className="admin-denied">
        <div className="admin-denied__box">
          <div className="admin-denied__icon" style={{ animation: 'spin 1s linear infinite' }}>⟳</div>
          <p>Weryfikacja…</p>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return <PasswordGate onSuccess={() => setUnlocked(true)} />;
  }

  return (
    <div className="admin-panel">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <Link to="/" className="admin-sidebar__logo">
          <img src={logoFull} alt="ScoreLab" className="invert-logo" />
        </Link>

        <div className="admin-sidebar__badge">
          <span className="admin-badge-shield">🛡️</span> Panel Admina
        </div>

        <div className="admin-sidebar__user">
          <div className="admin-sidebar__avatar">
            {user.user_metadata?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
          </div>
          <div className="admin-sidebar__user-info">
            <div className="admin-sidebar__name">{user.user_metadata?.full_name || 'Admin'}</div>
            <div className="admin-sidebar__email">{user.email}</div>
          </div>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav__section">Zarządzanie</div>
          <button
            className={`admin-nav__item${activeTab === 'codes' ? ' active' : ''}`}
            onClick={() => setActiveTab('codes')}
          >
            <span className="admin-nav__icon">🎟️</span> Kody Premium
          </button>
          <button
            className={`admin-nav__item${activeTab === 'subscriptions' ? ' active' : ''}`}
            onClick={() => setActiveTab('subscriptions')}
          >
            <span className="admin-nav__icon">👑</span> Subskrypcje
          </button>
          <button
            className={`admin-nav__item${activeTab === 'users' ? ' active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="admin-nav__icon">👥</span> Użytkownicy
          </button>
        </nav>

        <button
          className="admin-sidebar__lock"
          onClick={() => {
            setUnlocked(false);
          }}
        >
          🔒 Zablokuj panel
        </button>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <div className="admin-main__header">
          <h1 className="admin-main__title">
            {activeTab === 'codes' && '🎟️ Kody Premium'}
            {activeTab === 'subscriptions' && '👑 Subskrypcje'}
            {activeTab === 'users' && '👥 Użytkownicy'}
          </h1>
          <div className="admin-main__subtitle">
            {activeTab === 'codes' && 'Generuj i zarządzaj kodami aktywacyjnymi Premium'}
            {activeTab === 'subscriptions' && 'Przegląd aktywnych i wygasłych subskrypcji'}
            {activeTab === 'users' && 'Przeglądaj zarejestrowanych użytkowników platformy'}
          </div>
        </div>

        <div className="admin-main__content">
          {activeTab === 'codes' && <CodesTab />}
          {activeTab === 'subscriptions' && <SubscriptionsTab />}
          {activeTab === 'users' && <UsersTab />}
        </div>
      </main>
    </div>
  );
}
