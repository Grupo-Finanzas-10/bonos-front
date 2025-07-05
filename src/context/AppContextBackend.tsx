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
    console.log('🔧 URL del backend cargada:', savedUrl);
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

// Función para convertir datos del backend al formato local
const convertBackendBondToLocal = (backendBond: any): BondData => {
  return {
    id: backendBond.id?.toString() || '',
    name: backendBond.name || '',
    nominalValue: backendBond.nominalValue || 0,
    couponRate: backendBond.couponRate || 0,
    maturityPeriods: backendBond.maturityPeriods || 0,
    frequency: backendBond.frequency || 1,
    marketRate: backendBond.marketRate || 0,
    gracePeriods: backendBond.gracePeriods || 0,
    graceType: backendBond.graceType as 'total' | 'partial' | 'none' || 'none',
    currency: backendBond.currency as 'PEN' | 'USD' | 'EUR' || 'PEN',
    interestType: backendBond.interestType as 'effective' | 'nominal' || 'effective',
    capitalization: backendBond.capitalization || 12,
    createdAt: backendBond.createdAt ? new Date(backendBond.createdAt) : new Date(),
    updatedAt: backendBond.updatedAt ? new Date(backendBond.updatedAt) : new Date(),
  };
};

// Función para convertir datos locales al formato del backend
const convertLocalBondToBackend = (localBond: Partial<BondData>) => {
  return {
    name: localBond.name || '',
    nominalValue: localBond.nominalValue || 0,
    couponRate: localBond.couponRate || 0,
    maturityPeriods: localBond.maturityPeriods || 0,
    frequency: localBond.frequency || 1,
    marketRate: localBond.marketRate || 0,
    gracePeriods: localBond.gracePeriods || 0,
    graceType: localBond.graceType || 'none',
    currency: localBond.currency || 'PEN',
    interestType: localBond.interestType || 'effective',
    capitalization: localBond.capitalization || 12,
  };
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Estado de bonos (ahora se carga del backend)
  const [bonds, setBonds] = useState<BondData[]>([]);
  
  // Configuración local (se mantiene en localStorage)
  const [config, setConfig] = useState<AppConfig>(() => {
    const savedConfig = loadConfigFromLocalStorage();
    return savedConfig || {
      currency: 'PEN',
      interestType: 'effective',
      capitalization: 12,
    };
  });

  // Cargar bonos del backend al inicializar
  useEffect(() => {
    const loadBondsFromBackend = async () => {
      try {
        if (apiService.isAuthenticated()) {
          console.log('📦 Cargando bonos del backend...');
          const backendBonds = await apiService.getAllBonds();
          const localBonds = backendBonds.map(convertBackendBondToLocal);
          setBonds(localBonds);
          console.log('✅ Bonos cargados:', localBonds.length);
        }
      } catch (error) {
        console.error('❌ Error cargando bonos:', error);
      }
    };

    loadBondsFromBackend();
  }, []);

  // Guardar configuración en localStorage cada vez que cambie
  useEffect(() => {
    saveConfigToLocalStorage(config);
  }, [config]);

  const addBond = (bondData: Omit<BondData, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('➕ Agregando bono al backend...');
    
    const backendBond = convertLocalBondToBackend(bondData);
    
    apiService.createBond(backendBond)
      .then(createdBond => {
        console.log('✅ Bono creado en backend:', createdBond);
        // Recargar bonos del backend
        return apiService.getAllBonds();
      })
      .then(backendBonds => {
        const localBonds = backendBonds.map(convertBackendBondToLocal);
        setBonds(localBonds);
        console.log('🔄 Lista de bonos actualizada');
      })
      .catch(error => {
        console.error('❌ Error creando bono:', error);
        alert(`Error al crear bono: ${error.message}`);
      });
  };

  const updateBond = (id: string, updates: Partial<BondData>) => {
    console.log('📝 Actualizando bono en backend...', id);
    
    const backendUpdates = convertLocalBondToBackend(updates);
    
    apiService.updateBond(id, backendUpdates)
      .then(() => {
        console.log('✅ Bono actualizado en backend');
        // Recargar bonos del backend
        return apiService.getAllBonds();
      })
      .then(backendBonds => {
        const localBonds = backendBonds.map(convertBackendBondToLocal);
        setBonds(localBonds);
        console.log('🔄 Lista de bonos actualizada');
      })
      .catch(error => {
        console.error('❌ Error actualizando bono:', error);
        alert(`Error al actualizar bono: ${error.message}`);
      });
  };

  const deleteBond = (id: string) => {
    console.log('🗑️ Eliminando bono del backend...', id);
    
    apiService.deleteBond(id)
      .then(() => {
        console.log('✅ Bono eliminado del backend');
        // Actualizar lista local inmediatamente
        setBonds(prevBonds => prevBonds.filter(bond => bond.id !== id));
      })
      .catch(error => {
        console.error('❌ Error eliminando bono:', error);
        alert(`Error al eliminar bono: ${error.message}`);
      });
  };

  const getBond = (id: string) => {
    return bonds.find(bond => bond.id === id);
  };

  const updateConfig = (updates: Partial<AppConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
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
