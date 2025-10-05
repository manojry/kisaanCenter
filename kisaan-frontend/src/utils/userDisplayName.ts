// Centralized user display name helper
// Usage: getUserDisplayName(user) or getUserDisplayNameById(users, id)
import type { User } from '../types/api';

export function getUserDisplayName(user: User | undefined | null): string {
  if (!user) return '';
  return user.firstname && user.firstname.trim() ? user.firstname : user.username;
}

export function getUserDisplayNameById(users: User[], id: string | number): string {
  const user = users.find(u => String(u.id) === String(id));
  return getUserDisplayName(user);
}
