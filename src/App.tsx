// src/App.tsx
import React, { useState } from 'react';
import { AuthProvider, AppProvider, useAuth } from './context/AppContext';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import BondsList from './components/BondsList';
import Configuration from './components/Configuration';
import UserProfile from './components/UserProfile';
import './App.css';

const AppContent: React.FC = () => {
    const { isAuthenticated, user } = useAuth();
    const [currentView, setCurrentView] = useState('dashboard');
    const [sidebarWidth, setSidebarWidth] = useState('ml-64'); // Estado para el ancho de la barra lateral

    // Log para debugging
    console.log('🏠 App: Estado de autenticación:', isAuthenticated);
    console.log('👤 App: Usuario actual:', user);
    console.log('🎭 App: Rol del usuario:', user?.role);

    if (!isAuthenticated) {
        return <Login />;
    }

    const handleToggleCollapse = (isCollapsed: boolean) => {
        setSidebarWidth(isCollapsed ? 'ml-20' : 'ml-64');
    };

    const renderView = () => {
        console.log('🎯 App: Renderizando vista:', currentView);
        console.log('🎭 App: Rol del usuario para renderizar:', user?.role);
        
        // Para inversores, permitir dashboard y perfil
        if (user?.role === 'inversor') {
            console.log('👥 App: Renderizando para INVERSOR');
            switch (currentView) {
                case 'profile':
                    return <UserProfile />;
                default:
                    return <Dashboard />;
            }
        }

        // Para emisores, permitir navegación completa
        if (user?.role === 'emisor') {
            console.log('🏢 App: Renderizando para EMISOR');
            switch (currentView) {
                case 'bonds':
                    return <BondsList />;
                case 'config':
                    return <Configuration />;
                case 'profile':
                    return <UserProfile />;
                default:
                    return <Dashboard />;
            }
        }

        console.log('⚠️ App: Rol no reconocido, usando fallback');
        // Fallback
        return <Dashboard />;
    };

    return (
        <div className="min-h-screen flex">
            <Navbar currentView={currentView} onViewChange={setCurrentView} onToggleCollapse={handleToggleCollapse} />
            {/* Fondo blanco para todas las vistas, manteniendo el navbar con su color */}
            <main
                className={`flex-1 p-6 transition-all duration-300 ease-in-out ${sidebarWidth} bg-white`}
            >
                {renderView()}
            </main>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <AppProvider>
                <AppContent />
            </AppProvider>
        </AuthProvider>
    );
}

export default App;