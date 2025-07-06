import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import BondForm from './BondForm';
import { calculateBondResults } from '../utils/bondCalculations';
import { Plus, Search, Filter, Calculator, Edit, Trash2, Eye, RefreshCw } from 'lucide-react';
import type { BondResults } from '../types';

// Importación dinámica del componente BondResults
const BondResults = React.lazy(() => import('./BondResults'));

const BondsList: React.FC = () => {
  const { bonds, deleteBond, loadBonds, loading } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingBond, setEditingBond] = useState<string | undefined>();
  const [viewingResults, setViewingResults] = useState<string | undefined>();
  const [bondResults, setBondResults] = useState<BondResults | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const hasTriedToLoad = useRef(false);

  // Filtrar bonos
  const filteredBonds = bonds.filter(bond => {
    const matchesSearch = bond.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCurrency = filterCurrency === 'all' || bond.currency === filterCurrency;
    const matchesType = filterType === 'all' || bond.interestType === filterType;
    
    return matchesSearch && matchesCurrency && matchesType;
  });

  const handleDeleteBond = (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este bono?')) {
      deleteBond(id);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBond(undefined);
  };

  const handleSaveForm = () => {
    setShowForm(false);
    setEditingBond(undefined);
  };

  const handleViewResults = async (bondId: string) => {
    setViewingResults(bondId);
    setLoadingResults(true);
    setBondResults(null);
    
    const bond = bonds.find(b => b.id === bondId);
    if (bond) {
      try {
        console.log('🔍 Calculando resultados para bono:', bond.name);
        const results = await calculateBondResults(bond);
        setBondResults(results);
        console.log('✅ Resultados calculados:', results);
      } catch (error) {
        console.error('❌ Error calculando resultados:', error);
        setBondResults(null);
      } finally {
        setLoadingResults(false);
      }
    }
  };

  // Effect para limpiar resultados cuando se cambia el bono seleccionado
  useEffect(() => {
    if (!viewingResults) {
      setBondResults(null);
      setLoadingResults(false);
    }
  }, [viewingResults]);

  // Effect para cargar bonos cuando se monta el componente
  useEffect(() => {
    console.log('📋 BondsList: Componente montado, verificando bonos...');
    console.log('📊 BondsList: Bonos actuales:', bonds.length);
    console.log('🔍 BondsList: Ya intentó cargar:', hasTriedToLoad.current);
    
    // Resetear la flag si ya hay bonos cargados
    if (bonds.length > 0) {
      hasTriedToLoad.current = false;
    }
    
    // Cargar bonos solo si no hay ninguno, no se están cargando, y no se ha intentado cargar antes
    if (bonds.length === 0 && !loading && !hasTriedToLoad.current) {
      console.log('🔄 BondsList: No hay bonos, cargando desde API...');
      hasTriedToLoad.current = true;
      loadBonds();
    }
  }, [bonds.length, loading]); // Removemos loadBonds de las dependencias

  const formatCurrency = (value: number, currency: string) => {
    const symbol = currency === 'PEN' ? 'S/.' : currency === 'USD' ? '$' : '€';
    return `${symbol} ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    return `${(value * 100).toFixed(2)}%`;
  };

  const getFrequencyText = (frequency: number) => {
    switch (frequency) {
      case 1: return 'Anual';
      case 2: return 'Semestral';
      case 4: return 'Trimestral';
      case 12: return 'Mensual';
      default: return `${frequency}x/año`;
    }
  };

  const getGraceText = (bond: any) => {
    if (bond.gracePeriods === 0) return 'Sin gracia';
    const type = bond.graceType === 'total' ? 'Total' : 'Parcial';
    return `${bond.gracePeriods} períodos (${type})`;
  };
  if (viewingResults) {
    const bond = bonds.find(b => b.id === viewingResults);
    if (bond) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Resultados del Bono</h1>
            <button
              onClick={() => setViewingResults(undefined)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Volver a la Lista
            </button>
          </div>
          
          {/* Mostrar loading mientras se calculan los resultados */}
          {loadingResults && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Calculando resultados...</span>
            </div>
          )}
          
          {/* Mostrar error si no se pudieron calcular los resultados */}
          {!loadingResults && !bondResults && (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="text-red-500 text-lg mb-2">Error al calcular resultados</div>
                <button 
                  onClick={() => handleViewResults(viewingResults)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}
          
          {/* Mostrar resultados cuando estén listos */}
          {!loadingResults && bondResults && (
            <React.Suspense fallback={<div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>}>
              <BondResults bondData={bond} results={bondResults} />
            </React.Suspense>
          )}
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Bonos</h1>
          <p className="text-gray-600 mt-1">Administre sus bonos corporativos</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              hasTriedToLoad.current = false;
              loadBonds();
            }}
            disabled={loading}
            className="bg-primary-dark text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <RefreshCw size={20} className="mr-2" />
            )}
            {loading ? 'Cargando...' : 'Recargar'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-accent text-black px-4 py-2 rounded-lg hover:opacity-90 transition-colors flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Nuevo Bono
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar bonos por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Currency Filter */}
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={filterCurrency}
              onChange={(e) => setFilterCurrency(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas las monedas</option>
              <option value="PEN">Soles (PEN)</option>
              <option value="USD">Dólares (USD)</option>
              <option value="EUR">Euros (EUR)</option>
            </select>
          </div>

          {/* Interest Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los tipos</option>
              <option value="effective">Tasa Efectiva</option>
              <option value="nominal">Tasa Nominal</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600">
          Mostrando {filteredBonds.length} de {bonds.length} bonos
        </div>
      </div>

      {/* Bonds Grid */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Cargando bonos...</h3>
          <p className="text-gray-600">Por favor espere mientras se cargan los datos</p>
        </div>
      ) : filteredBonds.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Calculator className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            {bonds.length === 0 ? 'No hay bonos registrados' : 'No se encontraron bonos'}
          </h3>
          <p className="text-gray-600 mb-4">
            {bonds.length === 0 
              ? 'Comience creando su primer bono corporativo'
              : 'Intente modificar los filtros de búsqueda'
            }
          </p>
          {bonds.length === 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setShowForm(true)}
                className="bg-primary-accent text-black px-4 py-2 rounded-lg hover:opacity-90 transition-colors mr-2"
              >
                Crear Primer Bono
              </button>
              <button
                onClick={() => {
                  hasTriedToLoad.current = false;
                  loadBonds();
                }}
                className="bg-primary-dark text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
              >
                Recargar Bonos
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBonds.map((bond) => (
            <div key={bond.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{bond.name}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      bond.currency === 'PEN' ? 'bg-green-100 text-green-800' :
                      bond.currency === 'USD' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {bond.currency}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewResults(bond.id)}
                      className="text-green-600 hover:text-green-800 transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingBond(bond.id);
                        setShowForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteBond(bond.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Bond Details */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Valor Nominal:</span>
                    <span className="text-sm font-medium">{formatCurrency(bond.nominalValue, bond.currency)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tasa de Interés:</span>
                    <span className="text-sm font-medium">{formatPercentage(bond.couponRate)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Períodos:</span>
                    <span className="text-sm font-medium">{bond.maturityPeriods}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Frecuencia:</span>
                    <span className="text-sm font-medium">{getFrequencyText(bond.frequency)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tasa Mercado:</span>
                    <span className="text-sm font-medium">{formatPercentage(bond.marketRate)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Gracia:</span>
                    <span className="text-sm font-medium">{getGraceText(bond)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tipo Interés:</span>
                    <span className="text-sm font-medium">
                      {bond.interestType === 'effective' ? 'Efectiva' : 'Nominal'}
                    </span>
                  </div>
                  
                  {bond.interestType === 'nominal' && bond.capitalization && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Capitalización:</span>
                      <span className="text-sm font-medium">{bond.capitalization}/año</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Creado: {new Date(bond.createdAt).toLocaleDateString('es-PE')}
                  </span>
                  <button
                    onClick={() => handleViewResults(bond.id)}
                    className="bg-blue-50 text-blue-600 px-3 py-1 rounded-md text-sm hover:bg-blue-100 transition-colors flex items-center"
                  >
                    <Calculator size={14} className="mr-1" />
                    Calcular
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Forms */}
      {showForm && (
        <BondForm
          bondId={editingBond}
          onClose={handleCloseForm}
          onSave={handleSaveForm}
        />
      )}
    </div>
  );
};

export default BondsList;
