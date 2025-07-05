import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, BondData, AppConfig } from '../types';
import { apiService } from '../services/api';
import { 
  loadConfigFromLocalStorage, 
  saveConfigToLocalStorage
} from '../utils/localStorage';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

interface AppContextType {
  bonds: BondData[];
  config: AppConfig;
  addBond: (bond: Omit<BondData, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBond: (id: string, bond: Partial<BondData>) => Promise<void>;
  deleteBond: (id: string) => Promise<void>;
  getBond: (id: string) => BondData | undefined;
  updateConfig: (config: Partial<AppConfig>) => void;
  loadBonds: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AppContext = createContext<AppContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verificar si hay una sesión guardada (token y datos del usuario)
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('current_user');
    
    console.log('🔍 Verificando sesión guardada...');
    console.log('🎫 Token encontrado:', token ? 'SÍ' : 'NO');
    console.log('👤 Usuario guardado:', savedUser ? 'SÍ' : 'NO');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('🔄 Restaurando usuario desde localStorage:', userData);
        setUser(userData);
        console.log('✅ Sesión restaurada exitosamente');
      } catch (error) {
        console.error('❌ Error parseando usuario guardado:', error);
        // Si hay error, limpiar datos corruptos
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
      }
    } else if (token && !savedUser) {
      console.log('⚠️ Token encontrado pero sin datos de usuario, limpiando...');
      localStorage.removeItem('auth_token');
    } else {
      console.log('ℹ️ No hay sesión guardada');
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    console.log('🔐 AuthProvider: Iniciando login...');
    setLoading(true);
    
    try {
      const response = await apiService.login({ username, password });
      console.log('🎯 AuthProvider: Respuesta de login:', response);
      
      if (response.token && response.role) {
        // Crear objeto usuario con los datos disponibles
        const userData: User = {
          id: response.id ? String(response.id) : username, // Usar el ID real si está disponible, sino usar username como fallback
          username: response.username || username,
          password: '', // No guardamos la contraseña
          name: response.name || username, // Usar el nombre real si está disponible
          email: response.email || `${username}@demo.com`, // Usar el email real si está disponible
          role: response.role as 'emisor' | 'inversor',
          createdAt: new Date(),
        };
        
        console.log('👤 AuthProvider: Usuario creado con ID:', userData.id);
        
        // Guardar token y datos del usuario en localStorage para persistencia
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('current_user', JSON.stringify(userData));
        
        setUser(userData);
        console.log('✅ AuthProvider: Usuario autenticado y sesión guardada:', userData);
        
        // Disparar evento personalizado para que AppProvider cargue los bonos
        window.dispatchEvent(new CustomEvent('userAuthenticated'));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ AuthProvider: Error en login:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: Omit<User, 'id' | 'createdAt'>): Promise<boolean> => {
    console.log('📝 AuthProvider: Iniciando registro...');
    console.log('📋 AuthProvider: Datos de registro:', userData);
    setLoading(true);
    
    try {
      // Enviar todos los datos del usuario al backend
      const registerData = {
        username: userData.username,
        password: userData.password,
        role: userData.role,
        name: userData.name,
        email: userData.email,
        // Campos específicos del emisor
        ...(userData.role === 'emisor' && {
          companyName: userData.companyName,
          ruc: userData.ruc,
          sector: userData.sector,
        }),
        // Campos específicos del inversor
        ...(userData.role === 'inversor' && {
          investorType: userData.investorType,
          riskProfile: userData.riskProfile,
          investmentAmount: userData.investmentAmount,
        }),
      };
      
      console.log('📤 AuthProvider: Enviando datos al backend:', registerData);
      await apiService.register(registerData);
      
      console.log('✅ AuthProvider: Registro completado exitosamente');
      
      // Si el registro es exitoso, intentar loguear automáticamente al usuario
      console.log('🔄 AuthProvider: Auto-logueando usuario después del registro...');
      const loginSuccess = await login(userData.username, userData.password);
      
      if (loginSuccess) {
        console.log('✅ AuthProvider: Usuario logueado automáticamente después del registro');
      } else {
        console.log('⚠️ AuthProvider: Registro exitoso pero fallo en auto-login');
      }
      
      return true;
    } catch (error) {
      console.error('❌ AuthProvider: Error en registro:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('👋 AuthProvider: Cerrando sesión...');
    setUser(null);
    
    // Limpiar token del API service
    apiService.logout();
    
    // Limpiar también los datos del usuario en localStorage
    localStorage.removeItem('current_user');
    
    console.log('✅ AuthProvider: Sesión cerrada y localStorage limpiado');
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth(); // Acceder al usuario del contexto de autenticación
  const [bonds, setBonds] = useState<BondData[]>([]);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<AppConfig>(() => {
    const savedConfig = loadConfigFromLocalStorage();
    return savedConfig || {
      currency: 'PEN',
      interestType: 'effective',
      capitalization: 12,
    };
  });

  // Guardar configuración en localStorage cada vez que cambie
  useEffect(() => {
    saveConfigToLocalStorage(config);
  }, [config]);

  const loadBonds = useCallback(async () => {
    console.log('📋 AppProvider: Cargando bonos desde API...');
    console.log('👤 AppProvider: Usuario actual:', user);
    console.log('🎭 AppProvider: Rol del usuario:', user?.role);
    console.log('🆔 AppProvider: ID del usuario:', user?.id);
    console.log('🆔 AppProvider: Tipo de ID:', typeof user?.id);
    
    setLoading(true);
    try {
      let bondsData: any[];
      
      if (user?.role === 'emisor') {
        // Emisores ven solo sus bonos
        console.log('🏭 AppProvider: Cargando bonos del emisor con ID:', user.id);
        console.log('🌐 AppProvider: URL que se llamará: /api/bonds/user/' + user.id);
        bondsData = await apiService.getUserBonds(user.id);
      } else {
        // Inversores ven todos los bonos disponibles
        console.log('💰 AppProvider: Cargando todos los bonos disponibles');
        bondsData = await apiService.getAllBonds();
      }
      
      console.log('✅ AppProvider: Bonos cargados:', bondsData);
      setBonds(bondsData);
    } catch (error) {
      console.error('❌ AppProvider: Error cargando bonos:', error);
      // Mantener bonos vacíos en caso de error
      setBonds([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Auto-cargar bonos cuando el usuario está autenticado
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token && apiService.isAuthenticated() && user) {
      console.log('🔄 AppProvider: Usuario autenticado detectado, cargando bonos...');
      // Solo cargar si no hay bonos ya cargados
      if (bonds.length === 0) {
        loadBonds();
      }
    }

    // Escuchar el evento de autenticación para cargar bonos
    const handleUserAuthenticated = () => {
      console.log('🔔 AppProvider: Evento de autenticación recibido, cargando bonos...');
      loadBonds();
    };

    window.addEventListener('userAuthenticated', handleUserAuthenticated);

    return () => {
      window.removeEventListener('userAuthenticated', handleUserAuthenticated);
    };
  }, [loadBonds, bonds.length, user]);

  // Limpiar bonos cuando cambie el usuario
  useEffect(() => {
    if (user) {
      console.log('👤 AppProvider: Usuario cambió, limpiando bonos y recargando...');
      setBonds([]);
      loadBonds();
    }
  }, [user?.id, loadBonds]);

  const addBond = async (bondData: Omit<BondData, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('💰 AppProvider: Añadiendo bono...');
    setLoading(true);
    try {
      const newBond = await apiService.createBond({
        name: bondData.name,
        nominalValue: bondData.nominalValue,
        couponRate: bondData.couponRate,
        maturityPeriods: bondData.maturityPeriods,
        frequency: bondData.frequency,
        marketRate: bondData.marketRate,
        gracePeriods: bondData.gracePeriods || 0,
        graceType: bondData.graceType || 'none',
        currency: bondData.currency || config.currency,
        interestType: bondData.interestType || config.interestType,
        capitalization: bondData.capitalization || config.capitalization,
      });
      
      console.log('✅ AppProvider: Bono añadido:', newBond);
      
      // Recargar todos los bonos para tener la lista actualizada
      await loadBonds();
    } catch (error) {
      console.error('❌ AppProvider: Error añadiendo bono:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateBond = async (id: string, updates: Partial<BondData>) => {
    console.log('📝 AppProvider: Actualizando bono:', id);
    setLoading(true);
    try {
      await apiService.updateBond(id, updates);
      console.log('✅ AppProvider: Bono actualizado');
      
      // Recargar todos los bonos para tener la lista actualizada
      await loadBonds();
    } catch (error) {
      console.error('❌ AppProvider: Error actualizando bono:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteBond = async (id: string) => {
    console.log('🗑️ AppProvider: Eliminando bono:', id);
    setLoading(true);
    try {
      await apiService.deleteBond(id);
      console.log('✅ AppProvider: Bono eliminado');
      
      // Recargar todos los bonos para tener la lista actualizada
      await loadBonds();
    } catch (error) {
      console.error('❌ AppProvider: Error eliminando bono:', error);
      throw error;
    } finally {
      setLoading(false);
    }
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
    loadBonds,
    loading,
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
