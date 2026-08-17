export interface ClientUser {
  id: number;
  email: string;
  role: 'applicant' | 'admin';
  full_name: string;
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getDecodedToken(token: string): { exp?: number; [key: string]: any } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (e) {
    return null;
  }
}

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const decoded = getDecodedToken(token);
  if (!decoded || !decoded.exp) return true;
  
  // exp is in seconds, Date.now() is in milliseconds
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp <= currentTime;
}

export function getValidAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('token');
  if (!token || isTokenExpired(token)) {
    clearAuthSession();
    return null;
  }
  return token;
}

export function getStoredUser(): ClientUser | null {
  if (typeof window === 'undefined') return null;
  const token = getValidAuthToken();
  if (!token) return null;

  const userStr = localStorage.getItem('user');
  if (!userStr) {
    clearAuthSession();
    return null;
  }

  try {
    return JSON.parse(userStr) as ClientUser;
  } catch (e) {
    clearAuthSession();
    return null;
  }
}
