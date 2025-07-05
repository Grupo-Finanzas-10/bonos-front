// src/AppNew.tsx
import React, { useState } from 'react';
import { AuthProvider, AppProvider, useAuth } from './context/AppContextNew';
import LoginNew from './components/LoginNew';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import BondsList from './components/BondsList';
import Configuration from './components/Configuration';
import UserProfile from './components/UserProfile';
import './App.css';

const AppContentNew: React.FC = () => {
    const { isAuthenticated, user, loading } = useAuth();
    const [currentView, setCurrentView] = useState('dashboard');
    const [sidebarWidth, setSidebarWidth] = useState('ml-64'); // Estado para el ancho de la barra lateral

    // Mostrar loading mientras se verifica la autenticación
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verificando autenticación...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <LoginNew />;
    }

    const handleToggleCollapse = (isCollapsed: boolean) => {
        setSidebarWidth(isCollapsed ? 'ml-20' : 'ml-64');
    };

    const renderView = () => {
        // Para inversores, permitir dashboard y perfil
        if (user?.role === 'inversor') {
            switch (currentView) {
                case 'profile':
                    return <UserProfile />;
                default:
                    return <Dashboard />;
            }
        }

        // Para emisores, permitir navegación completa
        if (user?.role === 'emisor') {
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

        // Fallback
        return <Dashboard />;
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <Navbar 
                currentView={currentView} 
                onViewChange={setCurrentView} 
                onToggleCollapse={handleToggleCollapse}
            />
            <main className={`flex-1 transition-all duration-300 ${sidebarWidth} bg-gray-50 overflow-hidden`}>
                <div className="h-full p-6 overflow-y-auto">
                    {renderView()}
                </div>
            </main>
        </div>
    );
};

const AppNew: React.FC = () => {
    return (
        <AuthProvider>
            <AppProvider>
                <AppContentNew />
            </AppProvider>
        </AuthProvider>
    );
};

export default AppNew;
