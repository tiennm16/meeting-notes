import { createContext, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/src/constant';

export type AuthState = {
  token: string | null;
  userId: string | null;
  /** True while we're hydrating credentials from secure storage on app launch. */
  loading: boolean;
  /** True while a login request is in flight. */
  loggingIn: boolean;
  /** Last login error message, cleared on the next attempt. */
  error: string | null;
};

export type AuthContextValue = AuthState & {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export const authStorage = {
  async load(): Promise<{ token: string | null; userId: string | null }> {
    const [token, userId] = await Promise.all([
      SecureStore.getItemAsync(STORAGE_KEYS.authToken),
      SecureStore.getItemAsync(STORAGE_KEYS.userId),
    ]);
    return { token, userId };
  },
  async save(token: string, userId: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(STORAGE_KEYS.authToken, token),
      SecureStore.setItemAsync(STORAGE_KEYS.userId, userId),
    ]);
  },
  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.authToken),
      SecureStore.deleteItemAsync(STORAGE_KEYS.userId),
    ]);
  },
};
