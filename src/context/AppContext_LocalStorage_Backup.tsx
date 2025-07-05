import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, BondData, AppConfig } from '../types';
import { 
  loadBondsFromLocalStorage, 
  saveBondsToLocalStorage, 
  loadConfigFromLocalStorage, 
  saveConfigToLocalStorage,
  loadUsersFromLocalStorage,
  saveUsersToLocalStorage,
  loadCurrentUserFromLocalStorage,
  removeCurrentUserFromLocalStorage,
  validateUserCredentials
} from '../utils/localStorage';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  register: (userData: Omit<User, 'id' | 'createdAt'>) => boolean;
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

// Usuarios de ejemplo (en producción esto vendría de una base de datos)
const defaultUsers: User[] = [
  {
    id: '1',
    username: 'emisor',
    password: 'emisor123',
    name: 'Empresa Emisora',
    email: 'emisor@demo.com',
    role: 'emisor',
    createdAt: new Date('2024-01-01'),
    companyName: 'Demo Corp S.A.C.',
    ruc: '20123456789',
    sector: 'Tecnología'
  },
  {
    id: '2',
    username: 'inversor',
    password: 'inversor123',
    name: 'Inversor Demo',
    email: 'inversor@demo.com',
    role: 'inversor',
    createdAt: new Date('2024-01-01'),
    investorType: 'individual',
    riskProfile: 'moderate',
    investmentAmount: 50000
  },
  {
    id: '3',
    username: 'admin',
    password: 'admin123',
    name: 'Administrador',
    email: 'admin@demo.com',
    role: 'emisor', // Admin tiene permisos de emisor
    createdAt: new Date('2024-01-01'),
    companyName: 'Admin Corp',
    ruc: '20987654321',
    sector: 'Servicios'
  },
];

// Función para inicializar usuarios demo si no existen
const initializeDemoUsers = () => {
  const existingUsers = loadUsersFromLocalStorage();
  
  // Si no hay usuarios, crear los de demo
  if (existingUsers.length === 0) {
    saveUsersToLocalStorage(defaultUsers);
  } else {
    // Verificar que los usuarios demo existan, si no, agregarlos
    const usernames = existingUsers.map(u => u.username);
    const missingDemoUsers = defaultUsers.filter(user => !usernames.includes(user.username));
    
    if (missingDemoUsers.length > 0) {
      const updatedUsers = [...existingUsers, ...missingDemoUsers];
      saveUsersToLocalStorage(updatedUsers);
    }
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Inicializar usuarios demo
    initializeDemoUsers();
    
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

  const register = (userData: Omit<User, 'id' | 'createdAt'>): boolean => {
    try {
      // Verificar si el usuario ya existe
      const existingUsers = loadUsersFromLocalStorage();
      if (existingUsers.find(u => u.username === userData.username || u.email === userData.email)) {
        return false; // Usuario ya existe
      }

      // Crear nuevo usuario con ID y fecha de creación
      const newUser: User = {
        ...userData,
        id: Date.now().toString(),
        createdAt: new Date(),
      };

      // Guardar el nuevo usuario
      const updatedUsers = [...existingUsers, newUser];
      saveUsersToLocalStorage(updatedUsers);

      return true;
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    removeCurrentUserFromLocalStorage();
  };

  const value = {
    user,
    login,
    register,
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
