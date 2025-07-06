import React from 'react';
import { useAuth } from '../context/AppContext';
import EmisorDashboard from './EmisorDashboard';
import InversorDashboard from './InversorDashboard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Error de Autenticación
          </h2>
          <p className="text-gray-600">
            No se pudo verificar la sesión del usuario.
          </p>
        </div>
      </div>
    );
  }

  // Renderizar dashboard según el rol del usuario
  if (user.role === 'emisor') {
    return <EmisorDashboard />;
  } else if (user.role === 'inversor') {
    return <InversorDashboard />;
  }

  // Fallback en caso de rol no reconocido
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Rol no reconocido
        </h2>
        <p className="text-gray-600">
          El rol "{user.role}" no está configurado en el sistema.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
