/**
 * Token Storage Utility
 * Manages storage and retrieval of authentication tokens
 */

const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';
const ROLE_KEY = 'roles';
const STAFF_SESSION_KEY = 'adminStaffSession';

export const tokenStorage = {
  startStaffSession: (token: string, user: any): void => {
    sessionStorage.setItem(STAFF_SESSION_KEY, JSON.stringify({ token, user }));
  },
  getStaffSession: (): { token: string; user: any } | null => {
    try { return JSON.parse(sessionStorage.getItem(STAFF_SESSION_KEY) || 'null'); }
    catch { return null; }
  },
  endStaffSession: (): void => { sessionStorage.removeItem(STAFF_SESSION_KEY); },

  /**
   * Store access token
   */
  setAccessToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  /**
   * Get access token
   */
  getAccessToken: (): string | null => {
    return tokenStorage.getStaffSession()?.token ?? localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Store refresh token
   */
  setRefreshToken: (token: string): void => {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  /**
   * Get refresh token
   */
  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  /**
   * Store both access and refresh tokens
   */
  setTokens: (accessToken: string, refreshToken: string): void => {
    tokenStorage.setAccessToken(accessToken);
    tokenStorage.setRefreshToken(refreshToken);
  },

  /**
   * Store user profile data
   */
  setUser: (user: any): void => {
    const staff = tokenStorage.getStaffSession();
    if (staff) { tokenStorage.startStaffSession(staff.token, user); return; }
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /**
   * Store  Role and Permissions
   */
  setRolesAndPermissions: (roles: string): void => {
    const staff = tokenStorage.getStaffSession();
    if (staff) { tokenStorage.startStaffSession(staff.token, { ...staff.user, roleId: roles }); return; }
    localStorage.setItem('roles', JSON.stringify(roles));
  },

  /**
   * Get Role and Permissions
   */
  getRolesAndPermissions: (): any | null => {
    const staff = tokenStorage.getStaffSession();
    if (staff) return staff.user?.roleId ?? null;
    const roles = localStorage.getItem('roles');
    return roles ? JSON.parse(roles) : null;
  },

  /**
   * Get user profile data
   */
  getUser: (): any | null => {
    const staff = tokenStorage.getStaffSession();
    if (staff) return staff.user;
    const user = localStorage.getItem(USER_KEY);

    return user ? JSON.parse(user) : null;
  },

  /**
   * Clear all authentication data
   */
  clearAuth: (): void => {
    tokenStorage.endStaffSession();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ROLE_KEY);
  },

  /**
   * Check if user is authenticated (has valid token)
   */
  isAuthenticated: (): boolean => {
    return !!tokenStorage.getAccessToken();
  },
};
