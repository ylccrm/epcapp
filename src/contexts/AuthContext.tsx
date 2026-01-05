import { createContext, useContext } from 'react';
import type { Database } from '../lib/database.types';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

interface AuthContextType {
  userProfile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const userProfile: UserProfile | null = {
    id: 'public-user',
    full_name: 'Admin',
    email: 'admin@solarepc.com',
    role: 'admin',
    active: true,
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString()
  };

  return (
    <AuthContext.Provider value={{ userProfile, loading: false }}>
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
