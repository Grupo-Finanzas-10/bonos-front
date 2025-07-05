import React, { useState } from 'react'; // Importa useState
import { useAuth } from '../context/AppContext';
import {
  Settings,
  LayoutDashboard,
  BarChart2,
  User,
  ChevronRight,
  PanelLeftClose, // Icono para cuando la barra está abierta y se puede cerrar
  PanelRightOpen // Icono para cuando la barra está cerrada y se puede abrir
} from 'lucide-react';
import logo from '../assets/Logo.png';
import { Toast, useToast } from './Toast';

interface NavbarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  // Añadimos una prop para notificar a App.tsx sobre el cambio de ancho
  onToggleCollapse: (isCollapsed: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onViewChange, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false); // Estado para controlar si está colapsada
  const { toast, showToast, hideToast } = useToast();

  // Opciones de navegación según el rol del usuario
  const getNavItems = () => {
    console.log('🧭 Navbar: Obteniendo items de navegación para rol:', user?.role);
    
    if (user?.role === 'emisor') {
      console.log('🏢 Navbar: Configurando navegación para EMISOR');
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'bonds', label: 'Gestionar Bonos', icon: BarChart2 },
        { id: 'config', label: 'Configuración', icon: Settings },
        { id: 'profile', label: 'Mi Perfil', icon: User },
      ];
    } else if (user?.role === 'inversor') {
      console.log('👥 Navbar: Configurando navegación para INVERSOR');
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'analysis', label: 'Análisis de Bonos', icon: BarChart2 },
        { id: 'profile', label: 'Mi Perfil', icon: User },
      ];
    }
    
    console.log('⚠️ Navbar: Rol no reconocido, sin navegación');
    return [];
  };

  const navItems = getNavItems();
  console.log('📋 Navbar: Items de navegación final:', navItems);

  const accentColor = '#28F09D';
  const darkBgColor = 'rgba(8, 16, 40, 1)';

  // Función para alternar el estado de colapso
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onToggleCollapse(newState); // Notificamos a App.tsx sobre el cambio
  };

  return (
      <nav
          className={`
        fixed left-0 top-0 h-screen text-white shadow-lg z-30 flex flex-col p-4
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
          style={{ backgroundColor: darkBgColor }}
      >
        {/* Sección del Logo y Título */}
        <div className="flex-shrink-0 flex items-center justify-center px-4 py-5 mb-6 relative">
          {/* Solo mostramos el logo y el texto si NO está colapsado */}
          {!isCollapsed && (
              <>
                <div className=" rounded-full p-1.5 shadow-md mr-3">
                  <img src={logo} alt="Flow Box Logo" className="h-20 w-20 object-contain" />
                </div>
                <span className="text-3xl font-extrabold" style={{ color: accentColor }}>
              Flow Box
            </span>
              </>
          )}
          {/* Siempre mostramos el logo sin texto si está colapsado */}
          {isCollapsed && (
              <div className="rounded-full p-0 shadow-md">
                <img src={logo} alt="Flow Box Logo" className="  h-20 w-20 object-contain" />
              </div>
          )}

          {/* Botón de ocultar/mostrar */}
          <button
              onClick={toggleCollapse}
              className="absolute right-0 top-5 -translate-y-1/2 bg-gray-700/50 hover:bg-gray-700 rounded-full p-1 transition-colors duration-200"
          >
            {isCollapsed ? (
                <PanelRightOpen className="h-5 w-5 text-gray-300" /> // Icono para mostrar
            ) : (
                <PanelLeftClose className="h-5 w-5 text-gray-300" /> // Icono para ocultar
            )}
          </button>
        </div>

        {/* Elementos de Navegación */}
        <div className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
                <button
                    key={item.id}
                    onClick={() => {
                      // Para inversores, permitir dashboard y perfil
                      if (user?.role === 'inversor' && item.id !== 'dashboard' && item.id !== 'profile') {
                        showToast(
                          'Como inversor, solo puedes ver el análisis de bonos. Los emisores son quienes crean y gestionan bonos.',
                          'info'
                        );
                        return;
                      }
                      onViewChange(item.id);
                    }}
                    className={`
                flex items-center w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive
                        ? 'text-black font-semibold'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    }
                ${user?.role === 'inversor' && item.id !== 'dashboard' && item.id !== 'profile' ? 'opacity-50 cursor-not-allowed' : ''}
              `}
                    style={isActive ? { backgroundColor: accentColor } : {}}
                    disabled={user?.role === 'inversor' && item.id !== 'dashboard' && item.id !== 'profile'}
                >
                  <Icon className={`h-5 w-5 ${!isCollapsed ? 'mr-3' : ''}`} /> {/* Elimina margen si está colapsado */}
                  {!isCollapsed && item.label} {/* Solo muestra el texto si NO está colapsado */}
                </button>
            );
          })}
        </div>

        {/* Información de Usuario y Cerrar Sesión */}
        <div className="mt-auto pt-6 border-t border-gray-700/50">
          {/* Sección de Bienvenida */}
          <div className="flex flex-col items-start mb-4 px-2">
            <div className="h-10 w-10 bg-gray-600 rounded-full flex items-center justify-center mb-2">
              <User className="h-6 w-6 text-gray-200" />
            </div>
            {!isCollapsed && ( // Solo muestra el texto si NO está colapsado
                <>
                  <span className="text-gray-400 text-xs">Bienvenido,</span>
                  <span className="font-semibold text-lg text-white">{user?.name}</span>
                  <span 
                    className={`text-xs px-2 py-1 rounded-full font-medium mt-1 ${
                      user?.role === 'emisor' 
                        ? 'bg-blue-900/50 text-blue-300' 
                        : 'bg-green-900/50 text-green-300'
                    }`}
                  >
                    {user?.role === 'emisor' ? '👔 Emisor' : '💰 Inversor'}
                  </span>
                </>
            )}
          </div>

          {/* Botón de Salir */}
          <button
              onClick={logout}
              className="flex items-center justify-between w-full px-4 py-2 rounded-lg text-sm font-medium text-black transition-colors duration-200 group"
              style={{ backgroundColor: accentColor }}
          >
            {!isCollapsed && <span>Salir</span>} {/* Solo muestra el texto si NO está colapsado */}
            <ChevronRight className={`h-5 w-5 ${!isCollapsed ? 'ml-2' : ''} transition-transform group-hover:translate-x-1 ${isCollapsed ? 'mx-auto' : ''}`} />
            {/* Centra el icono si está colapsado */}
          </button>
        </div>
        
        {/* Toast de notificaciones */}
        <Toast
          message={toast.message}
          type={toast.type}
          show={toast.show}
          onClose={hideToast}
        />
      </nav>
  );
};

export default Navbar;