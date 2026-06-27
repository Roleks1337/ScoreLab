import type { UserRole } from '../lib/useProfile';
import './Avatar.css';

interface AvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  role?: UserRole;
  /** Background used when there is no uploaded image (e.g. the user's banner color). */
  color?: string | null;
  size?: number;
  /** Show the floating 👑 / 🛡️ marker above the avatar. */
  showMarker?: boolean;
  className?: string;
}

function initialOf(name?: string | null): string {
  const ch = name?.trim()?.charAt(0);
  return ch ? ch.toUpperCase() : '?';
}

/**
 * Avatar used across the app (comments, navbar, profile).
 * Renders the uploaded image when present, otherwise a colored initial.
 * A colored ring + optional marker distinguishes Admin / Premium / normal users.
 */
export default function Avatar({
  name,
  avatarUrl,
  role = 'user',
  color,
  size = 40,
  showMarker = false,
  className = '',
}: AvatarProps) {
  const fallbackBg = color || '#0066ff';
  const marker = role === 'admin' ? '🛡️' : role === 'premium' ? '👑' : null;

  return (
    <div
      className={`sl-avatar sl-avatar--${role} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      title={name || undefined}
    >
      {avatarUrl ? (
        <img className="sl-avatar__img" src={avatarUrl} alt={name || 'avatar'} />
      ) : (
        <span
          className="sl-avatar__initial"
          style={avatarUrl ? undefined : { background: fallbackBg }}
        >
          {initialOf(name)}
        </span>
      )}
      {showMarker && marker && (
        <span className="sl-avatar__marker" style={{ fontSize: size * 0.34 }}>
          {marker}
        </span>
      )}
    </div>
  );
}
