import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAdmin, verifyAdminPassword } from '../lib/useAdmin';
import { fetchPublicProfiles, roleOf, type PublicProfile } from '../lib/useProfile';
import RoleBadge from './RoleBadge';
import logoFull from '../assets/Zasob1.svg';
import './AdminPanel.css';

/* ── Helpers ─────────────────────────────────────────────── */
function generateCode(prefix = 'SCORELAB'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${prefix}-${seg(4)}-${seg(4)}`;
}

type Tab = 'codes' | 'subscriptions' | 'users' | 'moderation';

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
  valid_until: string | null;
  max_uses: number | null;
  uses: number;
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
  // Usage limit: single = one-time, unlimited = multi without cap, count = multi with numeric cap
  const [useLimit, setUseLimit] = useState<'single' | 'unlimited' | 'count'>('single');
  const [maxUses, setMaxUses] = useState(5);
  // Code redemption deadline (datetime-local string); empty = no deadline
  const [validUntil, setValidUntil] = useState('');
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
    const isMulti = useLimit !== 'single';
    const cap = useLimit === 'count' ? Math.max(1, maxUses) : null;
    const deadline = validUntil ? new Date(validUntil).toISOString() : null;
    const rows = Array.from({ length: newCount }, () => ({
      code: generateCode(),
      days: newDays,
      note: newNote.trim() || null,
      multi_use: isMulti,
      max_uses: cap,
      valid_until: deadline,
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

  const useCountOf = (c: PremiumCode) => c.premium_redemptions?.length ?? c.uses ?? 0;
  const isExhausted = (c: PremiumCode) =>
    c.multi_use
      ? (c.max_uses != null && useCountOf(c) >= c.max_uses)
      : c.used;
  const isExpired = (c: PremiumCode) =>
    !!c.valid_until && new Date(c.valid_until) < new Date();

  const filtered = codes.filter(c =>
    filter === 'all'
      ? true
      : filter === 'used'
        ? isExhausted(c)
        : !isExhausted(c)
  );

  const stats = {
    total: codes.length,
    unused: codes.filter(c => !isExhausted(c)).length,
    used: codes.filter(c => isExhausted(c)).length,
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
            <label>Limit użyć</label>
            <div className="admin-type-select">
              <button
                type="button"
                className={`admin-type-btn${useLimit === 'single' ? ' active' : ''}`}
                onClick={() => setUseLimit('single')}
              >
                Jednorazowy
              </button>
              <button
                type="button"
                className={`admin-type-btn${useLimit === 'unlimited' ? ' active' : ''}`}
                onClick={() => setUseLimit('unlimited')}
              >
                Wielorazowy
              </button>
              <button
                type="button"
                className={`admin-type-btn${useLimit === 'count' ? ' active' : ''}`}
                onClick={() => setUseLimit('count')}
              >
                Określona liczba
              </button>
              {useLimit === 'count' && (
                <input
                  type="number"
                  min={1}
                  max={9999}
                  value={maxUses}
                  onChange={e => setMaxUses(Math.max(1, +e.target.value))}
                  className="admin-input admin-input--mini"
                  title="Maksymalna liczba użyć"
                />
              )}
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
          <div className="admin-generator__field">
            <label>Ważny do (opcjonalnie)</label>
            <input
              type="datetime-local"
              value={validUntil}
              onChange={e => setValidUntil(e.target.value)}
              className="admin-input"
              title="Do kiedy można skorzystać z kodu"
            />
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
            const useCount = useCountOf(code);
            const exhausted = isExhausted(code);
            const expired = isExpired(code);
            return (
              <div key={code.id} className={`admin-code-row${(exhausted || expired) ? ' admin-code-row--used' : ''}`}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="admin-code-row__days">{code.days} dni</span>
                    {!code.multi_use ? (
                      <span className="admin-badge admin-badge--used" style={{ fontSize: '10px', padding: '1px 6px' }}>Jednorazowy</span>
                    ) : code.max_uses != null ? (
                      <span className="admin-badge admin-badge--multi">Limit {code.max_uses}×</span>
                    ) : (
                      <span className="admin-badge admin-badge--multi">Wielorazowy</span>
                    )}
                  </div>
                  {code.valid_until && (
                    <span className="admin-code-row__note">
                      Ważny do: {new Date(code.valid_until).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {code.note && <span className="admin-code-row__note">{code.note}</span>}
                </div>
                <div className="admin-code-row__status">
                  {expired ? (
                    <span className="admin-badge admin-badge--used">Wygasł</span>
                  ) : code.multi_use ? (
                    <span className="admin-code-row__use-count">
                      Użyto: {useCount}{code.max_uses != null ? ` / ${code.max_uses}` : ''}
                    </span>
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

interface AdminUserRow {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  isAdmin: boolean;
  isPremium: boolean;
  expiresAt: Date | null;
  isHidden: boolean;
}

type UserFilter = 'all' | 'premium' | 'admin' | 'hidden';

function UsersTab() {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<UserFilter>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [grantingId, setGrantingId] = useState<string | null>(null);
  const [grantDays, setGrantDays] = useState(30);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [confirmHide, setConfirmHide] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAdminId(session?.user?.id ?? null);
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const [{ data: profs }, { data: pub }, { data: subs }, { data: hid }] = await Promise.all([
      supabase.from('profiles').select('id, email, full_name, created_at').order('created_at', { ascending: false }),
      supabase.from('public_profiles').select('id, is_admin, is_premium'),
      supabase.from('premium_subscriptions').select('user_id, expires_at'),
      supabase.from('hidden_users').select('user_id'),
    ]);

    const adminSet = new Set((pub ?? []).filter((p: any) => p.is_admin).map((p: any) => p.id));
    const hiddenSet = new Set((hid ?? []).map((h: any) => h.user_id));
    const expiryMap: Record<string, Date> = {};
    (subs ?? []).forEach((s: any) => { expiryMap[s.user_id] = new Date(s.expires_at); });

    const merged: AdminUserRow[] = (profs ?? []).map((p: any) => {
      const exp = expiryMap[p.id] ?? null;
      return {
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        created_at: p.created_at,
        isAdmin: adminSet.has(p.id),
        isPremium: !!exp && exp > now,
        expiresAt: exp,
        isHidden: hiddenSet.has(p.id),
      };
    });
    setRows(merged);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(text);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const grantPremium = async (userId: string) => {
    setBusy(userId);
    const days = Math.max(1, grantDays);
    const u = rows.find(r => r.id === userId);
    const base = u?.isPremium && u.expiresAt && u.expiresAt > new Date() ? u.expiresAt : new Date();
    const newExpiry = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    await supabase.from('premium_subscriptions').upsert({
      user_id: userId,
      starts_at: new Date().toISOString(),
      expires_at: newExpiry.toISOString(),
      code_used: 'ADMIN',
    }, { onConflict: 'user_id' });
    setGrantingId(null);
    await load();
    setBusy(null);
  };

  const revokePremium = async (userId: string) => {
    setBusy(userId);
    await supabase.from('premium_subscriptions').delete().eq('user_id', userId);
    setConfirmRevoke(null);
    await load();
    setBusy(null);
  };

  const hideUser = async (userId: string) => {
    setBusy(userId);
    await supabase.from('hidden_users').insert({
      user_id: userId,
      reason: 'Ukryty z panelu administratora',
      hidden_by: adminId,
    });
    setConfirmHide(null);
    await load();
    setBusy(null);
  };

  const unhideUser = async (userId: string) => {
    setBusy(userId);
    await supabase.from('hidden_users').delete().eq('user_id', userId);
    await load();
    setBusy(null);
  };

  const fmt = (d: Date) => d.toLocaleDateString('pl-PL');
  const daysLeft = (d: Date) => Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const q = search.trim().toLowerCase();
  const visible = rows.filter(u => {
    if (filter === 'premium' && !u.isPremium) return false;
    if (filter === 'admin' && !u.isAdmin) return false;
    if (filter === 'hidden' && !u.isHidden) return false;
    if (q && !(
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    )) return false;
    return true;
  });

  const stats = {
    total: rows.length,
    premium: rows.filter(u => u.isPremium).length,
    admin: rows.filter(u => u.isAdmin).length,
    hidden: rows.filter(u => u.isHidden).length,
  };

  return (
    <div className="admin-tab">
      <div className="admin-stats">
        <div className="admin-stat">
          <div className="admin-stat__value">{stats.total}</div>
          <div className="admin-stat__label">Zarejestrowanych</div>
        </div>
        <div className="admin-stat admin-stat--gold">
          <div className="admin-stat__value">{stats.premium}</div>
          <div className="admin-stat__label">Premium 👑</div>
        </div>
        <div className="admin-stat admin-stat--red">
          <div className="admin-stat__value">{stats.admin}</div>
          <div className="admin-stat__label">Administratorzy 🛡️</div>
        </div>
        <div className="admin-stat admin-stat--gray">
          <div className="admin-stat__value">{stats.hidden}</div>
          <div className="admin-stat__label">Ukryci 🙈</div>
        </div>
      </div>

      <div className="admin-table-header">
        <h3 className="admin-table-title">Użytkownicy platformy</h3>
        <div className="admin-filter">
          {(['all', 'premium', 'admin', 'hidden'] as const).map(f => (
            <button
              key={f}
              className={`admin-filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Wszyscy' : f === 'premium' ? 'Premium' : f === 'admin' ? 'Admini' : 'Ukryci'}
            </button>
          ))}
        </div>
      </div>

      <input
        className="admin-input admin-user-search"
        placeholder="🔍 Szukaj po nazwie, e-mailu lub UID…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="admin-loading">Ładowanie użytkowników…</div>
      ) : visible.length === 0 ? (
        <div className="admin-empty">Brak użytkowników spełniających kryteria.</div>
      ) : (
        <div className="admin-users-list">
          {visible.map(u => (
            <div key={u.id} className={`admin-umgmt-row${u.isHidden ? ' admin-umgmt-row--hidden' : ''}`}>
              <div className="admin-umgmt-row__main">
                <div className="admin-user-row__info">
                  <span className="admin-user-row__name">
                    {u.full_name || 'Brak nazwy'}
                    {u.isAdmin && <span className="admin-ubadge" title="Administrator">🛡️</span>}
                    {u.isPremium && <span className="admin-ubadge" title="Premium">👑</span>}
                    {u.isHidden && <span className="admin-ubadge" title="Ukryty">🙈</span>}
                  </span>
                  <span className="admin-user-row__email">{u.email}</span>
                </div>

                <div className="admin-umgmt-row__status">
                  {u.isPremium && u.expiresAt ? (
                    <span className="admin-badge admin-badge--active">
                      Premium · do {fmt(u.expiresAt)} ({daysLeft(u.expiresAt)}d)
                    </span>
                  ) : (
                    <span className="admin-badge admin-badge--used">Brak premium</span>
                  )}
                  <button
                    className={`admin-copy-btn${copyFeedback === u.id ? ' copied' : ''}`}
                    onClick={() => handleCopy(u.id)}
                    title={`Kopiuj UID (${u.id})`}
                  >
                    {copyFeedback === u.id ? '✓ UID' : '⎘ UID'}
                  </button>
                </div>

                <div className="admin-umgmt-row__actions">
                  <button
                    className="admin-mod-btn admin-mod-btn--gold"
                    disabled={busy === u.id}
                    onClick={() => { setGrantingId(grantingId === u.id ? null : u.id); setConfirmRevoke(null); setConfirmHide(null); }}
                  >
                    👑 {u.isPremium ? 'Przedłuż' : 'Nadaj premium'}
                  </button>

                  {u.isPremium && (
                    confirmRevoke === u.id ? (
                      <span className="admin-delete-confirm">
                        Odebrać?
                        <button className="admin-delete-yes" disabled={busy === u.id} onClick={() => revokePremium(u.id)}>Tak</button>
                        <button className="admin-delete-no" onClick={() => setConfirmRevoke(null)}>Nie</button>
                      </span>
                    ) : (
                      <button className="admin-mod-btn admin-mod-btn--danger" disabled={busy === u.id} onClick={() => { setConfirmRevoke(u.id); setGrantingId(null); }}>
                        Odbierz premium
                      </button>
                    )
                  )}

                  {u.isHidden ? (
                    <button className="admin-mod-btn" disabled={busy === u.id} onClick={() => unhideUser(u.id)}>
                      Przywróć
                    </button>
                  ) : u.isAdmin ? null : (
                    confirmHide === u.id ? (
                      <span className="admin-delete-confirm">
                        Ukryć?
                        <button className="admin-delete-yes" disabled={busy === u.id} onClick={() => hideUser(u.id)}>Tak</button>
                        <button className="admin-delete-no" onClick={() => setConfirmHide(null)}>Nie</button>
                      </span>
                    ) : (
                      <button className="admin-mod-btn admin-mod-btn--ban" disabled={busy === u.id} onClick={() => { setConfirmHide(u.id); setGrantingId(null); }}>
                        🙈 Ukryj
                      </button>
                    )
                  )}
                </div>
              </div>

              {grantingId === u.id && (
                <div className="admin-grant-panel">
                  <span className="admin-grant-panel__label">Liczba dni:</span>
                  <div className="admin-days-select">
                    {[7, 30, 90, 365].map(d => (
                      <button
                        key={d}
                        className={`admin-days-btn${grantDays === d ? ' active' : ''}`}
                        onClick={() => setGrantDays(d)}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={3650}
                    value={grantDays}
                    onChange={e => setGrantDays(Math.max(1, +e.target.value))}
                    className="admin-input admin-input--mini"
                  />
                  <button className="admin-mod-btn admin-mod-btn--gold" disabled={busy === u.id} onClick={() => grantPremium(u.id)}>
                    {busy === u.id ? '⟳' : `✦ ${u.isPremium ? 'Przedłuż' : 'Nadaj'} (${grantDays}d)`}
                  </button>
                  <button className="admin-mod-btn" onClick={() => setGrantingId(null)}>Anuluj</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Moderation Tab (reports + bans) ─────────────────────── */
interface ReportRow {
  id: string;
  comment_id: string;
  reporter_id: string | null;
  reason: string | null;
  status: string;
  created_at: string;
  course_comments: {
    id: string;
    content: string;
    user_id: string;
    lesson_key: string;
    created_at: string;
  } | null;
}

interface HiddenRow {
  user_id: string;
  reason: string | null;
  created_at: string;
}

function ModerationTab() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [hidden, setHidden] = useState<HiddenRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, PublicProfile>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'resolved' | 'all'>('pending');
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: repData }, { data: hidData }] = await Promise.all([
      supabase
        .from('comment_reports')
        .select('*, course_comments(id, content, user_id, lesson_key, created_at)')
        .order('created_at', { ascending: false }),
      supabase
        .from('hidden_users')
        .select('user_id, reason, created_at')
        .order('created_at', { ascending: false }),
    ]);

    const reportRows = (repData ?? []) as ReportRow[];
    const hiddenRows = (hidData ?? []) as HiddenRow[];
    setReports(reportRows);
    setHidden(hiddenRows);

    const ids: string[] = [];
    reportRows.forEach(r => {
      if (r.reporter_id) ids.push(r.reporter_id);
      if (r.course_comments?.user_id) ids.push(r.course_comments.user_id);
    });
    hiddenRows.forEach(h => ids.push(h.user_id));
    setProfiles(await fetchPublicProfiles(ids));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const nameOf = (id: string | null | undefined) =>
    (id && profiles[id]?.display_name) || (id ? `${id.slice(0, 8)}…` : 'Nieznany');

  const resolveReport = async (id: string) => {
    setBusy(id);
    await supabase.from('comment_reports').update({ status: 'resolved' }).eq('id', id);
    await load();
    setBusy(null);
  };

  const deleteComment = async (commentId: string, reportId: string) => {
    setBusy(reportId);
    // Deleting the comment cascade-removes its reports; mark resolved as a fallback.
    await supabase.from('course_comments').delete().eq('id', commentId);
    await supabase.from('comment_reports').update({ status: 'resolved' }).eq('id', reportId);
    await load();
    setBusy(null);
  };

  const hideUser = async (userId: string, reportId?: string) => {
    setBusy(reportId || userId);
    await supabase.from('hidden_users').insert({ user_id: userId, reason: 'Zgłoszony komentarz' });
    if (reportId) await supabase.from('comment_reports').update({ status: 'resolved' }).eq('id', reportId);
    await load();
    setBusy(null);
  };

  const unhideUser = async (userId: string) => {
    setBusy(userId);
    await supabase.from('hidden_users').delete().eq('user_id', userId);
    await load();
    setBusy(null);
  };

  const isHidden = (userId: string) => hidden.some(h => h.user_id === userId);

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const filtered = reports.filter(r =>
    filter === 'all' ? true : r.status === filter,
  );

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  return (
    <div className="admin-tab">
      <div className="admin-stats">
        <div className="admin-stat admin-stat--red">
          <div className="admin-stat__value">{pendingCount}</div>
          <div className="admin-stat__label">Oczekujące zgłoszenia</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat__value">{reports.length}</div>
          <div className="admin-stat__label">Wszystkie zgłoszenia</div>
        </div>
        <div className="admin-stat admin-stat--gray">
          <div className="admin-stat__value">{hidden.length}</div>
          <div className="admin-stat__label">Ukryci użytkownicy</div>
        </div>
      </div>

      {/* Reports */}
      <div className="admin-table-header">
        <h3 className="admin-table-title">Zgłoszone komentarze</h3>
        <div className="admin-filter">
          {(['pending', 'resolved', 'all'] as const).map(f => (
            <button
              key={f}
              className={`admin-filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'pending' ? 'Oczekujące' : f === 'resolved' ? 'Rozwiązane' : 'Wszystkie'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Ładowanie zgłoszeń…</div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">Brak zgłoszeń w tej kategorii. 🎉</div>
      ) : (
        <div className="admin-reports-list">
          {filtered.map(r => {
            const c = r.course_comments;
            const authorId = c?.user_id;
            const authorRole = roleOf(authorId ? profiles[authorId] : null);
            return (
              <div key={r.id} className={`admin-report${r.status === 'resolved' ? ' admin-report--resolved' : ''}`}>
                <div className="admin-report__top">
                  <span className={`admin-badge ${r.status === 'pending' ? 'admin-badge--active' : 'admin-badge--used'}`}>
                    {r.status === 'pending' ? 'Oczekuje' : 'Rozwiązane'}
                  </span>
                  {c && <span className="admin-report__lesson">Lekcja: {c.lesson_key}</span>}
                  <span className="admin-report__date">{new Date(r.created_at).toLocaleString('pl-PL')}</span>
                </div>

                {c ? (
                  <div className="admin-report__quote">
                    <div className="admin-report__author">
                      <strong>{nameOf(authorId)}</strong>
                      <RoleBadge role={authorRole} />
                      {authorId && isHidden(authorId) && <span className="admin-report__banned-tag">Ukryty</span>}
                    </div>
                    <p className="admin-report__content">„{c.content}"</p>
                  </div>
                ) : (
                  <div className="admin-report__quote admin-report__quote--gone">
                    Komentarz został już usunięty.
                  </div>
                )}

                <div className="admin-report__meta">
                  <span>Zgłosił: <strong>{nameOf(r.reporter_id)}</strong></span>
                  {r.reason && <span>Powód: „{r.reason}"</span>}
                </div>

                {r.status === 'pending' && (
                  <div className="admin-report__actions">
                    {c && (
                      <button
                        className="admin-mod-btn admin-mod-btn--danger"
                        disabled={busy === r.id}
                        onClick={() => deleteComment(c.id, r.id)}
                      >
                        🗑 Usuń komentarz
                      </button>
                    )}
                    {authorId && !isHidden(authorId) && authorRole !== 'admin' && (
                      <button
                        className="admin-mod-btn admin-mod-btn--ban"
                        disabled={busy === r.id}
                        onClick={() => hideUser(authorId, r.id)}
                      >
                        🙈 Ukryj autora
                      </button>
                    )}
                    <button
                      className="admin-mod-btn"
                      disabled={busy === r.id}
                      onClick={() => resolveReport(r.id)}
                    >
                      ✓ Odrzuć zgłoszenie
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Hidden users */}
      <h3 className="admin-table-title" style={{ margin: '32px 0 16px' }}>Ukryci użytkownicy</h3>
      {hidden.length === 0 ? (
        <div className="admin-empty">Brak ukrytych użytkowników.</div>
      ) : (
        <div className="admin-users-list">
          {hidden.map(h => (
            <div key={h.user_id} className="admin-user-row">
              <div className="admin-user-row__info">
                <span className="admin-user-row__name">{nameOf(h.user_id)}</span>
                <span className="admin-user-row__uid-text" title={h.user_id} style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--admin-text-secondary, #64748b)' }}>
                  {h.user_id}
                  <button
                    className={`admin-copy-btn${copied === h.user_id ? ' copied' : ''}`}
                    onClick={() => copyId(h.user_id)}
                    title="Kopiuj UID"
                    style={{ marginLeft: '6px' }}
                  >
                    {copied === h.user_id ? '✓' : '⎘'}
                  </button>
                </span>
              </div>
              <div className="admin-user-row__date">
                Ukryty: {new Date(h.created_at).toLocaleDateString('pl-PL')}
              </div>
              <div className="admin-user-row__uid">
                <button
                  className="admin-mod-btn"
                  disabled={busy === h.user_id}
                  onClick={() => unhideUser(h.user_id)}
                >
                  Przywróć
                </button>
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

          <div className="admin-nav__section">Moderacja</div>
          <button
            className={`admin-nav__item${activeTab === 'moderation' ? ' active' : ''}`}
            onClick={() => setActiveTab('moderation')}
          >
            <span className="admin-nav__icon">⚑</span> Zgłoszenia
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
            {activeTab === 'moderation' && '⚑ Moderacja'}
          </h1>
          <div className="admin-main__subtitle">
            {activeTab === 'codes' && 'Generuj i zarządzaj kodami aktywacyjnymi Premium'}
            {activeTab === 'subscriptions' && 'Przegląd aktywnych i wygasłych subskrypcji'}
            {activeTab === 'users' && 'Przeglądaj zarejestrowanych użytkowników platformy'}
            {activeTab === 'moderation' && 'Zgłoszone komentarze i ukryci użytkownicy'}
          </div>
        </div>

        <div className="admin-main__content">
          {activeTab === 'codes' && <CodesTab />}
          {activeTab === 'subscriptions' && <SubscriptionsTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'moderation' && <ModerationTab />}
        </div>
      </main>
    </div>
  );
}
// (admin panel)
