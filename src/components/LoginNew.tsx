import React, { useState } from 'react';
import { AlertCircle, User, KeyRound, CheckCircle, Loader2 } from 'lucide-react';
import backgroundImage from '../assets/164ca665-b3af-401e-8434-96a0b40608c9 1.png';
import logo from '../assets/Logo.png';
import { useAuth } from '../context/AppContextNew';
// import RegisterNew from '../components/RegisterNew';
import ApiConfig from './ApiConfig';

// Componente temporal para registro
const RegisterNew: React.FC<{onSuccess: (user: any) => void, onBackToLogin: () => void}> = ({ onBackToLogin }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Registro Temporal</h2>
        <p className="text-gray-600 mb-4">Esta es una versión temporal del registro.</p>
        <p className="text-sm text-yellow-600 mb-6">
          Por ahora, use las credenciales que ya tenga en su backend para hacer login.
        </p>
        <button
          onClick={onBackToLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          ← Volver al Login
        </button>
      </div>
    </div>
  );
};
import type { User as UserType } from '../types';

const LoginNew: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showRegister, setShowRegister] = useState(false);
    const [showApiConfig, setShowApiConfig] = useState(false);
    const { login, loading, error, setError, isAuthenticated } = useAuth();

    // Verificar si la API está configurada
    const isApiConfigured = !!localStorage.getItem('api_base_url');
    
    // Logs de depuración
    console.log('🔧 Estado de configuración API:');
    console.log('  - API configurada:', isApiConfigured);
    console.log('  - URL guardada:', localStorage.getItem('api_base_url'));
    console.log('  - Token actual:', localStorage.getItem('auth_token') ? 'Existe' : 'No existe');
    console.log('  - Usuario autenticado:', isAuthenticated);
    console.log('  - Loading state:', loading);
    console.log('  - Error state:', error);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('📝 LoginNew: Formulario enviado');
        console.log('👤 Usuario:', username);
        console.log('🔐 Contraseña:', password ? '***' : 'vacía');
        
        setError(null);
        setSuccessMessage('');

        if (!username || !password) {
            const errorMsg = 'Por favor, ingrese usuario y contraseña.';
            console.log('⚠️ Validación fallida:', errorMsg);
            setError(errorMsg);
            return;
        }

        console.log('✅ Validación pasada, llamando al hook de autenticación...');
        const success = await login(username, password);
        console.log('🎯 Resultado del login:', success);
        
        if (!success) {
            console.log('❌ Login falló, limpiando contraseña');
            setPassword('');
        } else {
            console.log('✅ Login exitoso!');
        }
    };

    const handleRegisterSuccess = (user: UserType) => {
        // Mostrar mensaje de éxito y regresar al login
        setSuccessMessage(`¡Bienvenido ${user.name}! Tu cuenta ha sido creada exitosamente. Ahora puedes iniciar sesión.`);
        setShowRegister(false);
        setError(null);
        
        // Pre-llenar el campo de usuario para facilitar el login
        setUsername(user.username);
        
        // Limpiar el mensaje después de unos segundos
        setTimeout(() => {
            setSuccessMessage('');
        }, 5000);
    };

    const handleShowRegister = () => {
        setShowRegister(true);
        setError(null);
        setSuccessMessage('');
    };

    const handleBackToLogin = () => {
        setShowRegister(false);
        setError(null);
        setSuccessMessage('');
    };

    const handleApiConfigured = () => {
        setShowApiConfig(false);
    };

    // Si no está configurada la API, mostrar la configuración
    if (!isApiConfigured) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="text-center mb-8">
                        <img src={logo} alt="Logo" className="h-16 w-auto mx-auto mb-4" />
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración Inicial</h1>
                        <p className="text-gray-600">Configura la conexión con tu backend</p>
                    </div>
                    <ApiConfig onConfigured={handleApiConfigured} />
                </div>
            </div>
        );
    }

    // Si quiere mostrar la configuración de API
    if (showApiConfig) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="text-center mb-8">
                        <img src={logo} alt="Logo" className="h-16 w-auto mx-auto mb-4" />
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración API</h1>
                        <button
                            onClick={() => setShowApiConfig(false)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            ← Volver al login
                        </button>
                    </div>
                    <ApiConfig onConfigured={handleApiConfigured} />
                </div>
            </div>
        );
    }

    if (showRegister) {
        return (
            <RegisterNew 
                onSuccess={handleRegisterSuccess}
                onBackToLogin={handleBackToLogin}
            />
        );
    }

    // Si ya está autenticado, no mostrar el login
    if (isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Lado izquierdo - Imagen de fondo */}
            <div className="hidden lg:block lg:w-1/2 relative">
                <img
                    className="absolute inset-0 h-full w-full object-cover"
                    src={backgroundImage}
                    alt="Background"
                />
                <div className="absolute inset-0 bg-blue-600 bg-opacity-75"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-center">
                        <h1 className="text-4xl font-bold mb-4">Sistema de Bonos Corporativos</h1>
                        <p className="text-xl">Gestiona y analiza bonos con facilidad</p>
                    </div>
                </div>
            </div>

            {/* Lado derecho - Formulario de login */}
            <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div>
                        <img className="h-12 w-auto" src={logo} alt="Logo" />
                        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                            Iniciar Sesión
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Accede a tu cuenta para gestionar bonos
                        </p>
                    </div>

                    <div className="mt-8">
                        <div className="mt-6">
                            {/* Mensajes de estado */}
                            {successMessage && (
                                <div className="mb-4 rounded-md bg-green-50 p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <CheckCircle className="h-5 w-5 text-green-400" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-green-800">
                                                {successMessage}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="mb-4 rounded-md bg-red-50 p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <AlertCircle className="h-5 w-5 text-red-400" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-red-800">
                                                {error}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                        Usuario
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="username"
                                            name="username"
                                            type="text"
                                            autoComplete="username"
                                            required
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Ingrese su usuario"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Contraseña
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <KeyRound className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            autoComplete="current-password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Ingrese su contraseña"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading && (
                                            <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                        )}
                                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                                    </button>
                                </div>
                            </form>

                            <div className="mt-6">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white text-gray-500">¿No tienes cuenta?</span>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <button
                                        onClick={handleShowRegister}
                                        className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        disabled={loading}
                                    >
                                        Crear nueva cuenta
                                    </button>
                                </div>

                                <div className="mt-4 text-center">
                                    <button
                                        onClick={() => setShowApiConfig(true)}
                                        className="text-sm text-gray-600 hover:text-gray-900 underline"
                                    >
                                        Configurar servidor
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginNew;
