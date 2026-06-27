import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  type Profile,
  type UserRole,
  ROLE_BANNER,
  effectiveBanner,
} from '../lib/useProfile';
import Avatar from './Avatar';
import RoleBadge from './RoleBadge';
import './ProfileEditor.css';

// Curated custom banners (the "default" option = the role colour, stored as null).
const BANNER_PRESETS: string[] = [
  'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
  'linear-gradient(135deg, #10b981 0%, #047857 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
  'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
  'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
  'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  'linear-gradient(135deg, #14b8a6 0%, #f59e0b 100%)',
];

interface ProfileEditorProps {
  userId: string;
  email: string;
  role: UserRole;
  profile: Profile | null;
  onClose: () => void;
  onSaved: (patch: Partial<Profile>) => Promise<{ error: string | null }>;
}

export default function ProfileEditor({ userId, email, role, profile, onClose, onSaved }: ProfileEditorProps) {
  const [displayName, setDisplayName] = useState(profile?.display_name || profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  // null = use the role default banner
  const [bannerColor, setBannerColor] = useState<string | null>(profile?.banner_color ?? null);
  const [emailPublic, setEmailPublic] = useState(profile?.email_public ?? false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);

  const [customColor, setCustomColor] = useState('#0066ff');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const banner = effectiveBanner(bannerColor, role);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Wybierz plik graficzny (PNG, JPG, GIF, WEBP).');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError('Obraz jest za duży (maks. 3 MB).');
      return;
    }
    setError(null);
    setUploading(true);

    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const path = `${userId}/avatar_${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, cacheControl: '3600' });

    if (upErr) {
      setError('Nie udało się przesłać obrazu. Sprawdź, czy bucket „avatars" istnieje.');
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const { error: saveErr } = await onSaved({
      display_name: displayName.trim() || null,
      phone: phone.trim() || null,
      banner_color: bannerColor,
      email_public: emailPublic,
      avatar_url: avatarUrl,
    });
    setSaving(false);
    if (saveErr) {
      setError('Nie udało się zapisać zmian. Spróbuj ponownie.');
      return;
    }
    onClose();
  };

  return (
    <div className="pe-overlay" onClick={onClose}>
      <div className="pe-modal" onClick={e => e.stopPropagation()}>
        <div className="pe-modal__head">
          <h2>Edytuj profil</h2>
          <button className="pe-close" onClick={onClose} aria-label="Zamknij">✕</button>
        </div>

        <div className="pe-grid">
          {/* ── Left: form ─────────────────────────────── */}
          <div className="pe-form">
            <section className="pe-section">
              <label className="pe-label" htmlFor="pe-name">Nazwa wyświetlana</label>
              <input
                id="pe-name"
                className="pe-input"
                value={displayName}
                maxLength={40}
                placeholder="Twoja nazwa"
                onChange={e => setDisplayName(e.target.value)}
              />
            </section>

            <section className="pe-section">
              <label className="pe-label" htmlFor="pe-phone">Numer telefonu</label>
              <input
                id="pe-phone"
                className="pe-input"
                type="tel"
                value={phone}
                maxLength={20}
                placeholder="np. +48 600 700 800"
                onChange={e => setPhone(e.target.value)}
              />
              <span className="pe-hint">Opcjonalny. Nie jest jeszcze weryfikowany.</span>
            </section>

            <section className="pe-section">
              <label className="pe-label">Zdjęcie profilowe</label>
              <div className="pe-avatar-row">
                <Avatar name={displayName || email} avatarUrl={avatarUrl} role={role} color={banner} size={56} />
                <div className="pe-avatar-actions">
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
                  <button className="pe-btn pe-btn--secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? 'Przesyłanie…' : 'Prześlij obraz'}
                  </button>
                  {avatarUrl && (
                    <button className="pe-btn pe-btn--ghost" onClick={() => setAvatarUrl(null)}>Usuń</button>
                  )}
                </div>
              </div>
              <span className="pe-hint">PNG, JPG, GIF · maks. 3 MB</span>
            </section>

            <section className="pe-section">
              <label className="pe-label">Kolor banera</label>
              <div className="pe-swatches">
                {/* Default = role colour (stored as null) */}
                <button
                  className={`pe-swatch pe-swatch--default${bannerColor === null ? ' active' : ''}`}
                  style={{ background: ROLE_BANNER[role] }}
                  onClick={() => setBannerColor(null)}
                  title="Domyślny (kolor rangi)"
                >
                  <span className="pe-swatch__star">★</span>
                </button>
                {BANNER_PRESETS.map(preset => (
                  <button
                    key={preset}
                    className={`pe-swatch${bannerColor === preset ? ' active' : ''}`}
                    style={{ background: preset }}
                    onClick={() => setBannerColor(preset)}
                    aria-label="Wybierz kolor"
                  />
                ))}
              </div>
              <div className="pe-custom-color">
                <input
                  type="color"
                  value={customColor}
                  onChange={e => { setCustomColor(e.target.value); setBannerColor(e.target.value); }}
                  aria-label="Własny kolor"
                />
                <span className="pe-hint">★ = domyślny kolor rangi · lub wybierz własny</span>
              </div>
            </section>

            <section className="pe-section">
              <div className="pe-toggle-row">
                <div>
                  <div className="pe-label" style={{ marginBottom: 2 }}>Widoczność adresu e-mail</div>
                  <div className="pe-hint">
                    {emailPublic
                      ? 'E-mail widoczny na Twoim profilu publicznym.'
                      : 'E-mail ukryty przed innymi użytkownikami.'}
                  </div>
                </div>
                <button
                  className={`pe-switch${emailPublic ? ' on' : ''}`}
                  onClick={() => setEmailPublic(v => !v)}
                  role="switch"
                  aria-checked={emailPublic}
                >
                  <span className="pe-switch__dot" />
                </button>
              </div>
            </section>

            {error && <div className="pe-error">{error}</div>}
          </div>

          {/* ── Right: live preview ────────────────────── */}
          <div className="pe-preview-col">
            <div className="pe-preview-label">Podgląd</div>
            <div className="pe-card">
              <div className="pe-card__banner" style={{ background: banner }} />
              <div className="pe-card__avatar">
                <Avatar name={displayName || email} avatarUrl={avatarUrl} role={role} color={banner} size={72} showMarker />
              </div>
              <div className="pe-card__body">
                <div className="pe-card__name">
                  {displayName || 'Użytkownik'}
                  <RoleBadge role={role} />
                </div>
                <div className="pe-card__tag">#{userId.slice(0, 4)}</div>
                <div className="pe-card__rows">
                  <div className="pe-card__row">
                    <span>E-mail</span>
                    <span>{emailPublic ? email : 'Ukryty'}</span>
                  </div>
                  {phone.trim() && (
                    <div className="pe-card__row">
                      <span>Telefon</span>
                      <span>{phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pe-footer">
          <button className="pe-btn pe-btn--ghost" onClick={onClose}>Anuluj</button>
          <button className="pe-btn pe-btn--primary" onClick={handleSave} disabled={saving || uploading}>
            {saving ? 'Zapisywanie…' : 'Zapisz zmiany'}
          </button>
        </div>
      </div>
    </div>
  );
}
