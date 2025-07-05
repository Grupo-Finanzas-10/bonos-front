import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, BondData, AppConfig } from '../types';
import { apiService } from '../services/api';
import { 
  loadConfigFromLocalStorage, 
  saveConfigToLocalStorage,
} from '../utils/localStorage';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

interface AppContextType {
  bonds: BondData[];
  config: AppConfig;
  addBond: (bond: Omit<BondData, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBond: (id: string, bond: Partial<BondData>) => void;
  deleteBond: (id: string) => void;
  getBond: (id: string) => BondData | undefined;
  updateConfig: (config: Partial<AppConfig>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AppContext = createContext<AppContextType | undefined>(undefined);

// Configurar URL del backend si está guardada
const initializeApiConfig = () => {
  const savedUrl = localStorage.getItem('api_base_url');
  if (savedUrl) {
    apiService.setBaseUrl(savedUrl);
  } else {
    // URL por defecto
    const defaultUrl = 'http://localhost:8080';
    localStorage.setItem('api_base_url', defaultUrl);
    apiService.setBaseUrl(defaultUrl);
    console.log('🔧 URL del backend configurada por defecto:', defaultUrl);
  }
};

// Función para decodificar token JWT (simple)
const decodeToken = (token: string): Partial<User> | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub || payload.userId || payload.id || '',
      username: payload.username || payload.sub || '',
      role: payload.role || 'inversor',
      name: payload.name || payload.username || '',
      email: payload.email || '',
    };
  } catch (error) {
    console.error('Error decodificando token:', error);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Inicializar configuración API
    initializeApiConfig();
    
    // Verificar si hay una sesión guardada
    const token = localStorage.getItem('auth_token');
    if (token && apiService.isAuthenticated()) {
      const userInfo = decodeToken(token);
      if (userInfo) {
        setUser({
          ...userInfo,
          password: '',
          createdAt: new Date(),
        } as User);
      } else {
        // Token inválido, limpiar
        apiService.logout();
      }
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    console.log('🔐 AuthProvider: Intentando login con backend...');
    
    // Hacer login asíncrono pero retornar boolean para mantener compatibilidad
    apiService.login({ username, password })
      .then(response => {
        console.log('✅ Login exitoso:', response);
        if (response.token) {
          const userInfo = decodeToken(response.token);
          if (userInfo) {
            const userData: User = {
              ...userInfo,
              password: '',
              createdAt: new Date(),
              lastLogin: new Date(),
            } as User;
            
            setUser(userData);
            localStorage.setItem('current_user', JSON.stringify(userData));
            
            // Recargar la página para actualizar el estado
            setTimeout(() => window.location.reload(), 100);
          }
        }
      })
      .catch(error => {
        console.error('❌ Error en login:', error);
        alert(`Error de login: ${error.message}`);
      });

    // Retornar true temporalmente para mantener compatibilidad
    // El estado real se actualizará cuando llegue la respuesta
    return true;
  };

  const logout = () => {
    apiService.logout();
    localStorage.removeItem('current_user');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
    
    // Verificar si hay una sesión guardada
    const savedUser = loadCurrentUserFromLocalStorage();
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    // Validar credenciales usando la función de localStorage
    const foundUser = validateUserCredentials(username, password);

    if (foundUser) {
      // No guardar la contraseña en la sesión por seguridad
      const userWithoutPassword = { ...foundUser, password: '' };
      setUser(userWithoutPassword);
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    removeCurrentUserFromLocalStorage();
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Cargar datos del localStorage al inicializar
  const [bonds, setBonds] = useState<BondData[]>(() => loadBondsFromLocalStorage());
  const [config, setConfig] = useState<AppConfig>(() => {
    const savedConfig = loadConfigFromLocalStorage();
    return savedConfig || {
      currency: 'PEN',
      interestType: 'effective',
      capitalization: 12,
    };
  });

  // Guardar bonos en localStorage cada vez que cambien
  useEffect(() => {
    saveBondsToLocalStorage(bonds);
  }, [bonds]);

  // Guardar configuración en localStorage cada vez que cambie
  useEffect(() => {
    saveConfigToLocalStorage(config);
  }, [config]);

  const saveBonds = (newBonds: BondData[]) => {
    setBonds(newBonds);
  };

  const saveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
  };

  const addBond = (bondData: Omit<BondData, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newBond: BondData = {
      ...bondData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newBonds = [...bonds, newBond];
    saveBonds(newBonds);
  };

  const updateBond = (id: string, updates: Partial<BondData>) => {
    const newBonds = bonds.map(bond =>
      bond.id === id
        ? { ...bond, ...updates, updatedAt: new Date() }
        : bond
    );
    saveBonds(newBonds);
  };

  const deleteBond = (id: string) => {
    const newBonds = bonds.filter(bond => bond.id !== id);
    saveBonds(newBonds);
  };

  const getBond = (id: string) => {
    return bonds.find(bond => bond.id === id);
  };

  const updateConfig = (updates: Partial<AppConfig>) => {
    const newConfig = { ...config, ...updates };
    saveConfig(newConfig);
  };

  const value = {
    bonds,
    config,
    addBond,
    updateBond,
    deleteBond,
    getBond,
    updateConfig,
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
