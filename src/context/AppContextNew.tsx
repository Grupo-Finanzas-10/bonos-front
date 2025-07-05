import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, BondData, AppConfig } from '../types';
import { apiService } from '../services/api';
import { useBonds } from '../hooks/useBonds';
import { useAuth as useAuthHook } from '../hooks/useAuth';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, role?: 'emisor' | 'inversor') => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

interface AppContextType {
  bonds: BondData[];
  config: AppConfig;
  addBond: (bond: Omit<BondData, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateBond: (id: string, bond: Partial<BondData>) => Promise<boolean>;
  deleteBond: (id: string) => Promise<boolean>;
  getBond: (id: string) => BondData | undefined;
  updateConfig: (config: Partial<AppConfig>) => void;
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  refreshBonds: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AppContext = createContext<AppContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuthHook();

  const value: AuthContextType = {
    user: auth.user,
    login: auth.login,
    register: auth.register,
    logout: auth.logout,
    isAuthenticated: auth.isAuthenticated,
    loading: auth.loading,
    error: auth.error,
    setError: auth.setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const bondsHook = useBonds();
  
  // Configuración local (esta se mantiene en localStorage por ahora)
  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const savedConfig = localStorage.getItem('finanzas_config');
      return savedConfig ? JSON.parse(savedConfig) : {
        currency: 'PEN',
        interestType: 'effective',
        capitalization: 12,
      };
    } catch (error) {
      console.error('Error loading config from localStorage:', error);
      return {
        currency: 'PEN',
        interestType: 'effective',
        capitalization: 12,
      };
    }
  });

  // Guardar configuración en localStorage cada vez que cambie
  useEffect(() => {
    try {
      localStorage.setItem('finanzas_config', JSON.stringify(config));
    } catch (error) {
      console.error('Error saving config to localStorage:', error);
    }
  }, [config]);

  const updateConfig = (updates: Partial<AppConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
  };

  // Función para buscar un bono local por ID
  const getBond = (id: string): BondData | undefined => {
    return bondsHook.findLocalBond(id);
  };

  const value: AppContextType = {
    bonds: bondsHook.bonds,
    config,
    addBond: bondsHook.addBond,
    updateBond: bondsHook.updateBond,
    deleteBond: bondsHook.deleteBond,
    getBond,
    updateConfig,
    loading: bondsHook.loading,
    error: bondsHook.error,
    setError: bondsHook.setError,
    refreshBonds: bondsHook.fetchBonds,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Hook adicional para trabajar directamente con la simulación de bonos
export const useBondSimulation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simulateBond = async (bondData: BondData, tasaOportunidad: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const bondRequest = {
        name: bondData.name,
        nominalValue: bondData.nominalValue,
        couponRate: bondData.couponRate,
        maturityPeriods: bondData.maturityPeriods,
        frequency: bondData.frequency,
        marketRate: bondData.marketRate,
        gracePeriods: bondData.gracePeriods,
        graceType: bondData.graceType,
        currency: bondData.currency,
        interestType: bondData.interestType,
        capitalization: bondData.capitalization || 12,
      };
      
      const result = await apiService.simulateBond(bondRequest, tasaOportunidad);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al simular bono';
      setError(errorMessage);
      console.error('Bond simulation error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    simulateBond,
    loading,
    error,
    setError,
  };
};

// Configuración de la API (útil para desarrollo/producción)
export const configureApiUrl = (baseUrl: string) => {
  apiService.setBaseUrl(baseUrl);
};
