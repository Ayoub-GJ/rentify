export function fullName(user: { prenom?: string; nom?: string } | null | undefined): string {
  if (!user) return 'Utilisateur';
  const p = (user.prenom ?? '').trim();
  const n = (user.nom ?? '').trim();
  if (!p && n) return n;
  if (p && !n) return p;
  if (!p && !n) return 'Utilisateur';
  return `${p} ${n}`;
}

export function getInitials(user: { prenom?: string; nom?: string } | null | undefined): string {
  if (!user) return '?';
  const p = (user.prenom ?? '').trim();
  const n = (user.nom ?? '').trim();
  if (p && n) return (p[0] + n[0]).toUpperCase();
  if (p) return p.slice(0, 2).toUpperCase();
  if (n) return n.slice(0, 2).toUpperCase();
  return '?';
}

export function shortName(user: { prenom?: string; nom?: string } | null | undefined): string {
  if (!user) return 'Utilisateur';
  const p = (user.prenom ?? '').trim();
  const n = (user.nom ?? '').trim();
  if (p && n) return `${p} ${n[0]}.`;
  return fullName(user);
}

const AVATAR_COLORS = ['#E85D26', '#1A9E75', '#2980E8', '#9B59B6', '#F0A020', '#34495E', '#E67E22'];

export function avatarColorFromUid(uid: string): string {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '');
}

export function formatDateRange(start: Date, end: Date): string {
  return `${formatDateShort(start)} → ${formatDateShort(end)}`;
}
