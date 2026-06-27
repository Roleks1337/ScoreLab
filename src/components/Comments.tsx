import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../lib/useAdmin';
import {
  fetchPublicProfiles,
  roleOf,
  effectiveBanner,
  type PublicProfile,
} from '../lib/useProfile';
import Avatar from './Avatar';
import RoleBadge from './RoleBadge';
import './Comments.css';

interface CommentRow {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface VoteAgg {
  up: number;
  down: number;
  mine: number; // -1 | 0 | 1
}

type SortKey = 'new' | 'old' | 'top';

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

interface CommentsProps {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
}

export default function Comments({ courseId, lessonId, lessonTitle }: CommentsProps) {
  const lessonKey = `${courseId}/${lessonId}`;

  const [user, setUser] = useState<any>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, PublicProfile>>({});
  const [votes, setVotes] = useState<Record<string, VoteAgg>>({});
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [hiddenSet, setHiddenSet] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const [sort, setSort] = useState<SortKey>('new');
  const [rulesOpen, setRulesOpen] = useState(false);

  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportedIds, setReportedIds] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmHide, setConfirmHide] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<string | null>(null);

  const { isAdmin } = useAdmin(user?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const loadHidden = useCallback(async () => {
    if (!isAdmin) {
      setHiddenSet(new Set());
      return;
    }
    const { data } = await supabase.from('hidden_users').select('user_id');
    setHiddenSet(new Set((data ?? []).map((r: any) => r.user_id)));
  }, [isAdmin]);

  useEffect(() => { loadHidden(); }, [loadHidden]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('course_comments')
      .select('id, user_id, content, created_at')
      .eq('lesson_key', lessonKey)
      .order('created_at', { ascending: false });

    const rows = (data ?? []) as CommentRow[];
    setComments(rows);
    // Include the current user's id so the composer avatar (banner color, role)
    // shows correctly even before they've posted their first comment.
    const profileIds = rows.map(r => r.user_id);
    if (user) profileIds.push(user.id);
    setProfiles(await fetchPublicProfiles(profileIds));

    const ids = rows.map(r => r.id);
    if (ids.length) {
      const { data: vData } = await supabase
        .from('comment_votes')
        .select('comment_id, user_id, value')
        .in('comment_id', ids);

      const agg: Record<string, VoteAgg> = {};
      ids.forEach(id => { agg[id] = { up: 0, down: 0, mine: 0 }; });
      (vData ?? []).forEach((v: any) => {
        const a = agg[v.comment_id] || (agg[v.comment_id] = { up: 0, down: 0, mine: 0 });
        if (v.value === 1) a.up++; else a.down++;
        if (user && v.user_id === user.id) a.mine = v.value;
      });
      setVotes(agg);
    } else {
      setVotes({});
    }
    setLoading(false);
  }, [lessonKey, user]);

  useEffect(() => { load(); }, [load]);

  const flash = (msg: string) => {
    setActionNote(msg);
    setTimeout(() => setActionNote(null), 4000);
  };

  const handlePost = async () => {
    const content = draft.trim();
    if (!content || !user) return;
    setPosting(true);
    setError(null);

    const { error: insErr } = await supabase.from('course_comments').insert({
      lesson_key: lessonKey,
      course_id: courseId,
      lesson_id: lessonId,
      user_id: user.id,
      content,
    });

    setPosting(false);
    if (insErr) {
      setError('Nie udało się dodać komentarza. Spróbuj ponownie.');
      return;
    }
    setDraft('');
    load();
  };

  const vote = async (commentId: string, value: 1 | -1) => {
    if (!user) {
      flash('Zaloguj się, aby oceniać komentarze.');
      return;
    }
    const mine = votes[commentId]?.mine ?? 0;
    if (mine === value) {
      await supabase.from('comment_votes').delete()
        .eq('comment_id', commentId).eq('user_id', user.id);
    } else {
      await supabase.from('comment_votes').upsert(
        { comment_id: commentId, user_id: user.id, value },
        { onConflict: 'comment_id,user_id' },
      );
    }
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('course_comments').delete().eq('id', id);
    setConfirmDelete(null);
    setComments(prev => prev.filter(c => c.id !== id));
  };

  const handleReport = async (id: string) => {
    if (!user) return;
    const { error: repErr } = await supabase.from('comment_reports').insert({
      comment_id: id,
      reporter_id: user.id,
      reason: reportReason.trim() || null,
    });
    setReportingId(null);
    setReportReason('');
    if (repErr && !repErr.message.toLowerCase().includes('duplicate')) {
      flash('Nie udało się wysłać zgłoszenia.');
    } else {
      setReportedIds(prev => [...prev, id]);
      flash('Zgłoszenie wysłane do moderacji. Dziękujemy!');
    }
  };

  const handleHide = async (targetUserId: string) => {
    await supabase.from('hidden_users').insert({
      user_id: targetUserId,
      hidden_by: user?.id ?? null,
      reason: `Ukryty z poziomu lekcji ${lessonKey}`,
    });
    setConfirmHide(null);
    flash('Użytkownik został ukryty. Jego komentarze widzą tylko administratorzy.');
    loadHidden();
  };

  const myProfile = user ? profiles[user.id] : null;
  const myRole = roleOf(myProfile);

  const score = (id: string) => {
    const v = votes[id];
    return v ? v.up - v.down : 0;
  };

  const sorted = [...comments].sort((a, b) => {
    if (sort === 'top') return score(b.id) - score(a.id);
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    return sort === 'old' ? ta - tb : tb - ta;
  });

  return (
    <div className="cm">
      <div className="cm__bar">
        <span className="cm__title" title={lessonTitle}>💬 Komentarze <span className="cm__count">{comments.length}</span></span>
        <button className="cm__rules-btn" onClick={() => setRulesOpen(o => !o)}>ⓘ Zasady</button>
        <select className="cm__sort" value={sort} onChange={e => setSort(e.target.value as SortKey)}>
          <option value="new">Najnowsze</option>
          <option value="old">Najstarsze</option>
          <option value="top">Najlepsze</option>
        </select>
      </div>

      {rulesOpen && (
        <div className="cm__rules">
          Bądź uprzejmy i pomocny. Bez spamu, obraźliwych treści i danych osobowych.
          Komentarze łamiące zasady mogą zostać usunięte, a autorzy ukryci.
        </div>
      )}

      {actionNote && <div className="cm__note">{actionNote}</div>}

      {/* Composer */}
      {!user ? (
        <div className="cm__login">
          <Link to="/cennik">Zaloguj się</Link>, aby komentować
        </div>
      ) : (
        <div className="cm__composer">
          <Avatar
            name={myProfile?.display_name || user.user_metadata?.full_name || user.email}
            avatarUrl={myProfile?.avatar_url}
            role={myRole}
            color={effectiveBanner(myProfile?.banner_color, myRole)}
            size={34}
          />
          <div className="cm__composer-body">
            <textarea
              className="cm__textarea"
              placeholder="Napisz komentarz…"
              value={draft}
              maxLength={2000}
              onChange={e => setDraft(e.target.value)}
            />
            {error && <div className="cm__error">{error}</div>}
            <div className="cm__composer-actions">
              <span className="cm__charcount">{draft.length}/2000</span>
              <button className="cm__post" onClick={handlePost} disabled={posting || !draft.trim()}>
                {posting ? 'Wysyłanie…' : 'Opublikuj'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="cm__empty">Ładowanie…</div>
      ) : sorted.length === 0 ? (
        <div className="cm__empty">Brak komentarzy. Bądź pierwszy!</div>
      ) : (
        <div className="cm__list">
          {sorted.map(c => {
            const p = profiles[c.user_id];
            const role = roleOf(p);
            const name = p?.display_name || 'Użytkownik';
            const isOwn = user?.id === c.user_id;
            const isHidden = hiddenSet.has(c.user_id);
            const v = votes[c.id] || { up: 0, down: 0, mine: 0 };
            return (
              <div key={c.id} className={`cm-item${isHidden ? ' cm-item--hidden' : ''}`}>
                <Avatar
                  name={name}
                  avatarUrl={p?.avatar_url}
                  role={role}
                  color={effectiveBanner(p?.banner_color, role)}
                  size={36}
                  showMarker
                />
                <div className="cm-item__body">
                  <div className="cm-item__head">
                    <span className="cm-item__name">{name}</span>
                    {role === 'user'
                      ? <span className="cm-registered">Zarejestrowany</span>
                      : <RoleBadge role={role} />}
                    {isHidden && <span className="cm-hidden">🙈 Ukryty</span>}
                    <span className="cm-item__date">{fmtDate(c.created_at)}</span>
                  </div>
                  <p className="cm-item__text">{c.content}</p>
                  <div className="cm-item__actions">
                    <button
                      className={`cm-vote${v.mine === 1 ? ' cm-vote--on' : ''}`}
                      onClick={() => vote(c.id, 1)}
                    >👍 {v.up}</button>
                    <button
                      className={`cm-vote${v.mine === -1 ? ' cm-vote--ondown' : ''}`}
                      onClick={() => vote(c.id, -1)}
                    >👎 {v.down}</button>

                    {user && !isOwn && (
                      reportedIds.includes(c.id) ? (
                        <span className="cm-done">✓ Zgłoszono</span>
                      ) : reportingId === c.id ? (
                        <span className="cm-inline">
                          <input
                            className="cm-reason"
                            placeholder="Powód (opcjonalnie)"
                            value={reportReason}
                            maxLength={200}
                            onChange={e => setReportReason(e.target.value)}
                          />
                          <button className="cm-link cm-link--danger" onClick={() => handleReport(c.id)}>Wyślij</button>
                          <button className="cm-link" onClick={() => { setReportingId(null); setReportReason(''); }}>Anuluj</button>
                        </span>
                      ) : (
                        <button className="cm-link" onClick={() => setReportingId(c.id)}>⚑ Zgłoś</button>
                      )
                    )}

                    {(isOwn || isAdmin) && (
                      confirmDelete === c.id ? (
                        <span className="cm-inline">
                          Usunąć?
                          <button className="cm-link cm-link--danger" onClick={() => handleDelete(c.id)}>Tak</button>
                          <button className="cm-link" onClick={() => setConfirmDelete(null)}>Nie</button>
                        </span>
                      ) : (
                        <button className="cm-link cm-link--danger" onClick={() => setConfirmDelete(c.id)}>🗑</button>
                      )
                    )}

                    {isAdmin && !isOwn && role !== 'admin' && !isHidden && (
                      confirmHide === c.id ? (
                        <span className="cm-inline">
                          Ukryć autora?
                          <button className="cm-link cm-link--danger" onClick={() => handleHide(c.user_id)}>Tak</button>
                          <button className="cm-link" onClick={() => setConfirmHide(null)}>Nie</button>
                        </span>
                      ) : (
                        <button className="cm-link cm-link--ban" onClick={() => setConfirmHide(c.id)}>🙈 Ukryj</button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
