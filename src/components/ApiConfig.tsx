import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface ApiConfigProps {
  onConfigured?: () => void;
}

const ApiConfig: React.FC<ApiConfigProps> = ({ onConfigured }) => {
  const [apiUrl, setApiUrl] = useState('http://localhost:8080');
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Cargar URL guardada
    const savedUrl = localStorage.getItem('api_base_url') || 'http://localhost:8080';
    setApiUrl(savedUrl);
    apiService.setBaseUrl(savedUrl);
    
    // Verificar conexión inicial
    checkConnection(savedUrl);
  }, []);

  const checkConnection = async (url: string) => {
    setIsChecking(true);
    setErrorMessage('');
    
    try {
      console.log('🌐 Verificando conexión con:', url);
      
      // Probar endpoint de health check o login
      const response = await fetch(`${url}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Body vacío para probar conectividad
        mode: 'cors',
      });
      
      // Si el servidor responde (incluso con error 400/401), significa que está funcionando
      if (response.status === 400 || response.status === 401 || response.status === 422 || response.ok) {
        setIsConnected(true);
        console.log('✅ Conexión exitosa con el backend');
        if (onConfigured) {
          onConfigured();
        }
      } else {
        setIsConnected(false);
        setErrorMessage(`Error HTTP: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('❌ Error al verificar conexión:', error);
      setIsConnected(false);
      
      // Proporcionar mensaje de error más específico
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setErrorMessage('No se puede conectar al backend. Verifica que esté ejecutándose y que no haya bloqueadores de anuncios activos.');
      } else {
        setErrorMessage(`Error: ${error.message}`);
      }
    }
    
    setIsChecking(false);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiUrl(e.target.value);
  };

  const handleSaveUrl = () => {
    localStorage.setItem('api_base_url', apiUrl);
    apiService.setBaseUrl(apiUrl);
    checkConnection(apiUrl);
  };

  const handleTestConnection = () => {
    checkConnection(apiUrl);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#28F09D' }}>
        🔧 Configuración del Backend
      </h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="api-url" className="block text-sm font-medium text-gray-700 mb-2">
            URL del Backend
          </label>
          <div className="flex space-x-2">
            <input
              id="api-url"
              type="text"
              value={apiUrl}
              onChange={handleUrlChange}
              placeholder="http://localhost:8080"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleSaveUrl}
              className="px-4 py-2 text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ backgroundColor: '#28F09D' }}
            >
              Guardar
            </button>
            <button
              onClick={handleTestConnection}
              disabled={isChecking}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isChecking ? 'Verificando...' : 'Probar'}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className={`text-sm font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
            {isConnected ? '✅ Conectado al backend' : '❌ Sin conexión al backend'}
          </span>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800 font-medium mb-2">💡 Consejos para resolver problemas:</p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• <strong>Para desarrollo local:</strong> <code>http://localhost:8080</code></li>
            <li>• <strong>Backend no responde:</strong> Verifica que esté ejecutándose en el puerto correcto</li>
            <li>• <strong>Error ERR_BLOCKED_BY_CLIENT:</strong> Desactiva bloqueadores de anuncios para localhost</li>
            <li>• <strong>Error CORS:</strong> Asegúrate de que el backend tenga CORS habilitado</li>
            <li>• <strong>Proxy de Vite:</strong> En desarrollo, usa el proxy configurado automáticamente</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export { ApiConfig };
export default ApiConfig;
