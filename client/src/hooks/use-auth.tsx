import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface Investor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  tier: string;
  paymentStatus: string;
  paymentMethod: string;
  amount: number;
  questProgress: any;
  createdAt: Date;
}

interface AuthContextType {
  investor: Investor | null;
  token: string | null;
  login: (email: string, phone: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('investor_token');
    if (storedToken) {
      setToken(storedToken);
      fetchInvestor(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchInvestor = async (authToken: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInvestor(data);
      } else {
        // Token invalid, clear it
        localStorage.removeItem('investor_token');
        setToken(null);
      }
    } catch (error) {
      console.error('Error fetching investor:', error);
      localStorage.removeItem('investor_token');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, phone: string) => {
    const response = await apiRequest('POST', '/api/auth/login', { email, phone });
    const data = await response.json();
    
    setToken(data.token);
    setInvestor(data.investor);
    localStorage.setItem('investor_token', data.token);
  };

  const logout = () => {
    setInvestor(null);
    setToken(null);
    localStorage.removeItem('investor_token');
  };

  return (
    <AuthContext.Provider value={{ investor, token, login, logout, isLoading }}>
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
