import React from 'react';
import type { User } from '../types/user';
import { demoAccounts } from '../data/demoAccounts';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: Partial<User>) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  React.useEffect(() => {
    // Simulate checking for existing session
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setState({
        user: JSON.parse(savedUser),
        isAuthenticated: true,
        isLoading: false
      });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Find demo account
    const demoUser = demoAccounts.find(account => account.email === email);
    if (!demoUser) {
      throw new Error('Invalid credentials');
    }

    // Add a small delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    localStorage.setItem('user', JSON.stringify(demoUser));
    setState({ user: demoUser, isAuthenticated: true, isLoading: false });
  };

  const signup = async (userData: Partial<User>) => {
    // Simulate API call
    const user: User = {
      id: Date.now().toString(),
      name: userData.name || '',
      email: userData.email || '',
      role: userData.role || 'buyer',
      languages: userData.languages || ['English'],
      preferences: {
        language: 'en',
        currency: 'USD',
        notifications: true
      },
      joinedAt: new Date()
    };

    localStorage.setItem('user', JSON.stringify(user));
    setState({ user, isAuthenticated: true, isLoading: false });
  };

  const logout = () => {
    localStorage.removeItem('user');
    setState({ user: null, isAuthenticated: false, isLoading: false });
  };

  const updateProfile = async (userData: Partial<User>) => {
    if (!state.user) return;
    
    const updatedUser = {
      ...state.user,
      ...userData,
    };
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setState(prev => ({ ...prev, user: updatedUser }));
  };
  const value = React.useMemo(() => ({
    ...state,
    login,
    signup,
    updateProfile,
    logout
  }), [state]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}