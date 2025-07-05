import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { LoginRequest, RegisterRequest } from '../services/api';
import type { User } from '../types';

// Hook para manejar autenticación con el backend
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Función para decodificar el JWT y extraer información del usuario
  // Nota: Esta es una implementación básica. En producción, deberías usar una librería como jwt-decode
  const decodeToken = (token: string): Partial<User> | null => {
    try {
      console.log('🔓 Decodificando token JWT...');
      console.log('🎟️ Token completo:', token);
      
      const parts = token.split('.');
      console.log('📋 Partes del token:', parts.length);
      
      if (parts.length !== 3) {
        console.error('❌ Token JWT malformado - debe tener 3 partes');
        return null;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      console.log('📦 Payload decodificado:', payload);
      
      const userInfo = {
        id: payload.sub || payload.userId || payload.id || '',
        username: payload.username || payload.sub || '',
        role: payload.role || 'inversor',
        name: payload.name || payload.username || '',
        email: payload.email || '',
      };
      
      console.log('👤 Información de usuario extraída:', userInfo);
      return userInfo;
    } catch (error) {
      console.error('💥 Error decodificando token:', error);
      console.error('🎟️ Token que causó el error:', token);
      return null;
    }
  };

  // Inicializar autenticación al cargar
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token && apiService.isAuthenticated()) {
      const userInfo = decodeToken(token);
      if (userInfo) {
        setUser({
          ...userInfo,
          password: '', // No almacenar contraseña
          createdAt: new Date(),
        } as User);
        setIsAuthenticated(true);
      } else {
        // Token inválido, limpiar
        apiService.logout();
        setIsAuthenticated(false);
      }
    }
  }, []);

  // Función de login
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('🚀 Hook useAuth: Iniciando login...');
      console.log('👤 Usuario:', username);
      
      setLoading(true);
      setError(null);
      
      const loginData: LoginRequest = { username, password };
      console.log('📤 Enviando datos de login al API service...');
      
      const response = await apiService.login(loginData);
      console.log('📥 Respuesta del API service:', response);
      
      if (response.token) {
        console.log('🎟️ Token recibido, decodificando...');
        const userInfo = decodeToken(response.token);
        console.log('👤 Información de usuario decodificada:', userInfo);
        
        if (userInfo) {
          const userData: User = {
            ...userInfo,
            password: '', // No almacenar contraseña
            createdAt: new Date(),
            lastLogin: new Date(),
          } as User;
          
          console.log('✅ Usuario autenticado exitosamente:', userData);
          setUser(userData);
          setIsAuthenticated(true);
          
          // Guardar información del usuario en localStorage (sin contraseña)
          localStorage.setItem('current_user', JSON.stringify(userData));
          console.log('💾 Información de usuario guardada en localStorage');
          
          return true;
        } else {
          console.error('❌ No se pudo decodificar el token');
        }
      } else {
        console.error('❌ No se recibió token en la respuesta');
      }
      
      setError('Error al procesar la respuesta del servidor');
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de autenticación';
      console.error('💥 Error en login:', err);
      console.error('📝 Mensaje de error:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
      console.log('🏁 Proceso de login terminado');
    }
  };

  // Función de registro
  const register = async (username: string, password: string, role: 'emisor' | 'inversor' = 'inversor'): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const registerData: RegisterRequest = { username, password, role };
      await apiService.register(registerData);
      
      // Después del registro exitoso, hacer login automáticamente
      return await login(username, password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al registrar usuario';
      setError(errorMessage);
      console.error('Register error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función de logout
  const logout = () => {
    apiService.logout();
    localStorage.removeItem('current_user');
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  // Función para verificar si el token sigue siendo válido
  const checkAuthStatus = (): boolean => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      logout();
      return false;
    }

    try {
      // Verificar si el token ha expirado
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp && payload.exp < currentTime) {
        // Token expirado
        logout();
        return false;
      }
      
      return true;
    } catch (error) {
      // Token inválido
      logout();
      return false;
    }
  };

  // Función para actualizar información del usuario (para funciones futuras)
  const updateUserInfo = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuthStatus,
    updateUserInfo,
    setError, // Para limpiar errores manualmente
  };
};

export default useAuth;
