import React, { useState, useEffect } from 'react';
import { configureApiUrl } from '../context/AppContextNew';

interface ApiConfigProps {
  onConfigured?: () => void;
}

const ApiConfig: React.FC<ApiConfigProps> = ({ onConfigured }) => {
  const [apiUrl, setApiUrl] = useState('http://localhost:8080');
  const [isConfigured, setIsConfigured] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Cargar URL guardada
    const savedUrl = localStorage.getItem('api_base_url');
    if (savedUrl) {
      setApiUrl(savedUrl);
      configureApiUrl(savedUrl);
      setIsConfigured(true);
    }
  }, []);

  const testConnection = async () => {
    console.log('🧪 Probando conexión con el backend...');
    console.log('🌐 URL a probar:', apiUrl);
    
    setTestingConnection(true);
    setConnectionStatus('idle');
    setErrorMessage('');

    try {
      // Verificar que la URL sea válida
      const urlObj = new URL(apiUrl);
      console.log('✅ URL válida:', urlObj.toString());
      
      // Hacer un fetch simple para verificar conectividad
      const testUrl = `${apiUrl}/api/auth/login`;
      console.log('📡 Enviando petición de prueba a:', testUrl);
      
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: '', password: '' })
      });

      console.log('📨 Respuesta de prueba:');
      console.log('  Status:', response.status);
      console.log('  Status Text:', response.statusText);
      console.log('  Headers:', Object.fromEntries(response.headers.entries()));

      // Si llegamos aquí, el servidor responde (aunque sea con error de autenticación)
      console.log('✅ Servidor responde - conexión exitosa');
      setConnectionStatus('success');
      
    } catch (error) {
      console.error('❌ Error en prueba de conexión:', error);
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Error de conexión');
    } finally {
      setTestingConnection(false);
      console.log('🏁 Prueba de conexión terminada');
    }
  };

  const saveConfiguration = () => {
    console.log('💾 Guardando configuración de API...');
    console.log('🌐 URL a guardar:', apiUrl);
    
    // Guardar en localStorage
    localStorage.setItem('api_base_url', apiUrl);
    console.log('✅ URL guardada en localStorage');
    
    // Configurar el servicio API
    configureApiUrl(apiUrl);
    console.log('⚙️ API service configurado con nueva URL');
    
    setIsConfigured(true);
    console.log('🎯 Configuración marcada como completada');
    onConfigured?.();
  };

  const resetConfiguration = () => {
    localStorage.removeItem('api_base_url');
    setIsConfigured(false);
    setConnectionStatus('idle');
    setErrorMessage('');
  };

  if (isConfigured) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                API Configurada
              </h3>
              <div className="mt-1 text-sm text-green-700">
                Conectado a: {apiUrl}
              </div>
            </div>
          </div>
          <button
            onClick={resetConfiguration}
            className="text-green-800 hover:text-green-900 text-sm font-medium"
          >
            Cambiar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="mb-4">
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          Configuración del Backend
        </h2>
        <p className="text-sm text-gray-600">
          Configura la URL de tu servidor backend para conectar la aplicación.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="api-url" className="block text-sm font-medium text-gray-700 mb-1">
            URL del Backend
          </label>
          <input
            type="url"
            id="api-url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="http://localhost:8080"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Ejemplo: http://localhost:8080 o https://tu-backend.com
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={testConnection}
            disabled={testingConnection || !apiUrl}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testingConnection ? 'Probando...' : 'Probar Conexión'}
          </button>

          <button
            onClick={saveConfiguration}
            disabled={!apiUrl || connectionStatus === 'error'}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Guardar Configuración
          </button>
        </div>

        {connectionStatus === 'success' && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  ¡Conexión exitosa! El servidor está respondiendo.
                </p>
              </div>
            </div>
          </div>
        )}

        {connectionStatus === 'error' && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  Error de conexión
                </p>
                <p className="text-sm text-red-700 mt-1">
                  {errorMessage || 'No se pudo conectar al servidor. Verifica la URL y que el servidor esté ejecutándose.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Asegúrate de que tu servidor backend esté ejecutándose y sea accesible desde tu navegador. 
                Verifica también que el CORS esté configurado correctamente en el backend.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiConfig;
