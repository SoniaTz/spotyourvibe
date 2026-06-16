import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest, storageKeys } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'visitor' | 'user' | 'organizer' | 'admin' | 'superadmin';
  verified?: boolean;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: 'user' | 'organizer', organizerData?: { organizationName?: string; phone?: string; description?: string; website?: string; securityQuestion?: string; securityAnswer?: string }) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

interface BackendAuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      verified?: boolean;
    };
    token: string;
  };
}

interface BackendMeResponse {
  success: boolean;
  data: {
    id: string;
    email: string;
    name: string;
    role: string;
    verified?: boolean;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toFrontendRole = (role: string): User['role'] => {
  const normalized = role?.toUpperCase?.() || role;
  if (normalized === 'SUPERADMIN') return 'superadmin';
  if (normalized === 'ADMIN') return 'admin';
  if (normalized === 'ORGANIZER') return 'organizer';
  if (normalized === 'USER') return 'user';
  return 'visitor';
};

const mapBackendUser = (backendUser: {
  id: string;
  email: string;
  name: string;
  role: string;
  verified?: boolean;
}): User => ({
  id: backendUser.id,
  email: backendUser.email,
  name: backendUser.name,
  role: toFrontendRole(backendUser.role),
  verified: backendUser.verified
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(storageKeys.user);
    const token = localStorage.getItem(storageKeys.token);

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(storageKeys.user);
      }
    }

    if (token) {
      apiRequest<BackendMeResponse>('/auth/me')
        .then((res) => {
          const freshUser = mapBackendUser(res.data);
          setUser(freshUser);
          localStorage.setItem(storageKeys.user, JSON.stringify(freshUser));
        })
        .catch(() => {
          if (!storedUser) {
            localStorage.removeItem(storageKeys.token);
            localStorage.removeItem(storageKeys.user);
            setUser(null);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
      return;
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiRequest<BackendAuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    const mappedUser = mapBackendUser(res.data.user);
    setUser(mappedUser);
    localStorage.setItem(storageKeys.user, JSON.stringify(mappedUser));
    localStorage.setItem(storageKeys.token, res.data.token);
  };

  const signup = async (email: string, password: string, name: string, role: 'user' | 'organizer', organizerData?: { organizationName?: string; phone?: string; description?: string; website?: string; securityQuestion?: string; securityAnswer?: string }) => {
    const backendRole = role.toUpperCase();
    const body: Record<string, string> = { email, password, name, role: backendRole };
    if (organizerData) {
      if (organizerData.organizationName) body.organizationName = organizerData.organizationName;
      if (organizerData.phone) body.phone = organizerData.phone;
      if (organizerData.description) body.description = organizerData.description;
      if (organizerData.website) body.website = organizerData.website;
      if (organizerData.securityQuestion) body.securityQuestion = organizerData.securityQuestion;
      if (organizerData.securityAnswer) body.securityAnswer = organizerData.securityAnswer;
    }
    const res = await apiRequest<BackendAuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    const mappedUser = mapBackendUser(res.data.user);
    setUser(mappedUser);
    localStorage.setItem(storageKeys.user, JSON.stringify(mappedUser));
    localStorage.setItem(storageKeys.token, res.data.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(storageKeys.user);
    localStorage.removeItem(storageKeys.token);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem(storageKeys.user, JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateUser
      }}
    >
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
