import React, { useState } from 'react';
import { Plus, Settings, BarChart3, TrendingUp, DollarSign, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import BondForm from './BondForm';
import BondsList from './BondsList';
import Configuration from './Configuration';
import { exportBondSummaryToCSV } from '../utils/exportUtils';
import type { BondData } from '../types';

const EmisorDashboard: React.FC = () => {
  const { bonds } = useApp();
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'config'>('list');
  const [selectedBond, setSelectedBond] = useState<BondData | null>(null);

  const handleCreateBond = () => {
    setSelectedBond(null);
    setActiveTab('create');
  };

  const handleBondSaved = () => {
    setActiveTab('list');
    setSelectedBond(null);
  };

  // Estadísticas para el emisor
  const totalBonds = bonds.length;
  const avgCouponRate = bonds.length > 0 
    ? bonds.reduce((sum: number, bond: BondData) => sum + bond.couponRate, 0) / bonds.length 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel del Emisor</h1>
              <p className="mt-1 text-sm text-gray-500">
                Gestiona tus bonos corporativos y analiza costos de financiamiento
              </p>
            </div>
            {bonds.length > 0 && (
              <button
                onClick={() => exportBondSummaryToCSV(bonds)}
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Resumen
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas del Emisor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Bonos Emitidos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {totalBonds}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Tasa de Interés Promedio
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {avgCouponRate.toFixed(2)}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Enfoque Principal
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      TCEA (Costo)
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navegación por pestañas */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('list')}
                className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'list'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Mis Bonos
              </button>
              <button
                onClick={handleCreateBond}
                className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'create'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Plus className="inline-block w-4 h-4 mr-1" />
                Crear Bono
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'config'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="inline-block w-4 h-4 mr-1" />
                Configuración
              </button>
            </nav>
          </div>

          <div className="p-6">
            <div style={{ display: activeTab === 'list' ? 'block' : 'none' }}>
              <BondsList />
            </div>
            {activeTab === 'create' && (
              <BondForm
                bondId={selectedBond?.id}
                onSave={handleBondSaved}
                onClose={() => setActiveTab('list')}
              />
            )}
            {activeTab === 'config' && <Configuration />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmisorDashboard;
