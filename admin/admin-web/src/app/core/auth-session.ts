const TOKEN_KEY = 'admin_jwt';
const USER_KEY = 'admin_user';

export function clearStoredSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isStoredSessionValid(): boolean {
  const token = localStorage.getItem(TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);
  if (!token || !userRaw) return false;

  try {
    JSON.parse(userRaw);
    const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
    if (!payload.exp || payload.exp * 1000 <= Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}
