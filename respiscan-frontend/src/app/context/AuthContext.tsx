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
  sessionExpired: boolean;
  sessionTimeout: number;
  updateSessionTimeout: (mins: number) => void;
  login: (username: string, password: string, role: Role, otpToken?: string, rememberMe?: boolean) => Promise<LoginResult>;
  logout: () => Promise<void>;
  clearSessionExpired: () => void;
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
  const [sessionExpired, setSessionExpired] = useState(false);

  // Restore session on page load/refresh by asking the backend who's logged in.
  useEffect(() => {
    let mounted = true;

    const checkSession = async (isInitial = false) => {
      try {
        const data = await api.get('/auth/me/');
        if (mounted) setUser(normalizeUser(data));
      } catch {
        if (mounted) {
          setUser((prevUser) => {
            if (prevUser && !isInitial) {
              setSessionExpired(true);
            }
            return null;
          });
        }
      } finally {
        if (isInitial && mounted) setLoading(false);
      }
    };

    // Initial check on load
    checkSession(true);

    // Poll every 3 seconds for near-instant remote revocation
    const intervalId = setInterval(() => checkSession(false), 3000);
    
    // Also check immediately if they switch back to this tab
    const handleFocus = () => checkSession(false);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkSession(false);
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mounted = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const [sessionTimeout, setSessionTimeout] = useState<number>(() => 
    parseInt(localStorage.getItem('session_timeout') || '30')
  );

  const updateSessionTimeout = (mins: number) => {
    localStorage.setItem('session_timeout', mins.toString());
    setSessionTimeout(mins);
  };

  // Inactivity tracker
  useEffect(() => {
    if (!user) return; // Only track when logged in

    let timeoutId: number;
    let lastActivity = Date.now();

    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(async () => {
        // Idle timeout reached!
        await logout();
        setSessionExpired(true);
      }, sessionTimeout * 60 * 1000);
    };

    const throttledActivity = () => {
      const now = Date.now();
      if (now - lastActivity > 1000) { // Throttle resets to once per second
        lastActivity = now;
        resetTimer();
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(e => document.addEventListener(e, throttledActivity));
    resetTimer(); // start initial timer

    return () => {
      window.clearTimeout(timeoutId);
      events.forEach(e => document.removeEventListener(e, throttledActivity));
    };
  }, [user, sessionTimeout]);

  const login = async (
    username: string,
    password: string,
    role: Role,
    otpToken?: string,
    rememberMe?: boolean
  ): Promise<LoginResult> => {
    const body: Record<string, unknown> = { username, password, role };
    if (otpToken) body.otp_token = otpToken;
    if (rememberMe !== undefined) body.remember_me = rememberMe;

    const data = await api.post('/auth/login/', body);

    if (data.otp_required) {
      return { otpRequired: true, userId: data.user_id };
    }

    setUser(normalizeUser(data));
    setSessionExpired(false);
    return { otpRequired: false };
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout/');
    } catch {
      // ignore
    }
    setUser(null);
  };

  const clearSessionExpired = () => setSessionExpired(false);

  return (
    <AuthContext.Provider value={{ 
      user, loading, sessionExpired, sessionTimeout, updateSessionTimeout, 
      login, logout, clearSessionExpired 
    }}>
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
