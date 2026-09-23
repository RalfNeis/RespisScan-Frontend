import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../utils/api';

type Role = 'admin' | 'employee';

interface User {
  id: number;
  username: string;
  email?: string;
  role: Role;
  title?: string;
  department?: string;
  license_number?: string;
  bio?: string;
  first_name?: string;
  last_name?: string;
}

interface LoginResult {
  otpRequired: boolean;
  userId?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string, role: Role, otpToken?: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// UserSerializer already returns `role` as 'admin' | 'employee' directly —
// no transformation needed, just typing the response.
function normalizeUser(raw: any): User {
  return raw as User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on page load/refresh by asking the backend who's logged in.
  useEffect(() => {
    api
      .get('/auth/me/')
      .then((data) => setUser(normalizeUser(data)))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (
    username: string,
    password: string,
    role: Role,
    otpToken?: string
  ): Promise<LoginResult> => {
    const body: Record<string, unknown> = { username, password, role };
    if (otpToken) body.otp_token = otpToken;

    const data = await api.post('/auth/login/', body);

    // Password correct but a confirmed TOTP device exists — caller must
    // re-submit with otpToken set.
    if (data.otp_required) {
      return { otpRequired: true, userId: data.user_id };
    }

    setUser(normalizeUser(data));
    return { otpRequired: false };
  };

  const logout = async () => {
    await api.post('/auth/logout/');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
