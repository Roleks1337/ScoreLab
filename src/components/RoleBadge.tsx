import type { UserRole } from '../lib/useProfile';
import './RoleBadge.css';

/** Small pill that labels a user as Admin / Premium. Nothing renders for normal users. */
export default function RoleBadge({ role }: { role: UserRole }) {
  if (role === 'admin') {
    return <span className="sl-role sl-role--admin">🛡️ Admin</span>;
  }
  if (role === 'premium') {
    return <span className="sl-role sl-role--premium">👑 Premium</span>;
  }
  return null;
}
