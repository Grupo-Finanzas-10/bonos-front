import React, { useState } from 'react';
import { Eye, TrendingUp, DollarSign, Target, Search, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateBondResults } from '../utils/bondCalculations';
import type { BondData, BondResults } from '../types';

const InversorDashboard: React.FC = () => {
  const { bonds } = useApp();
  const [selectedBond, setSelectedBond] = useState<BondData | null>(null);
  const [bondResults, setBondResults] = useState<BondResults | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');

  // Filtrar bonos disponibles
  const filteredBonds = bonds.filter(bond => {
    const matchesSearch = bond.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCurrency = filterCurrency === 'all' || bond.currency === filterCurrency;
    return matchesSearch && matchesCurrency;
  });

  const handleAnalyzeBond = async (bond: BondData) => {
    setSelectedBond(bond);
    try {
      console.log('🔍 Analizando bono:', bond.name);
      const results = await calculateBondResults(bond);
      setBondResults(results);
      console.log('✅ Resultados obtenidos:', results);
    } catch (error) {
      console.error('❌ Error calculating bond results:', error);
      setBondResults(null);
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    const symbol = currency === 'PEN' ? 'S/.' : currency === 'USD' ? '$' : '€';
    return `${symbol} ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    return `${value.toFixed(4)}%`; // Valor ya viene como porcentaje, no multiplicar por 100
  };

  const formatBondPercentage = (value: number) => {
    return `${(value * 100).toFixed(4)}%`; // Para tasas del bono almacenadas como decimal
  };

  // Estadísticas para el inversor
  const bondsAvailable = filteredBonds.length;
  const avgMarketRate = bonds.length > 0 
    ? bonds.reduce((sum: number, bond: BondData) => sum + bond.marketRate, 0) / bonds.length 
    : 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-primary-dark">Panel del Inversor</h1>
              <p className="mt-1 text-sm text-gray-500">
                Analiza bonos disponibles y evalúa oportunidades de inversión
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas del Inversor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-6 w-6 text-primary-accent" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Bonos Disponibles
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {bondsAvailable}
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
                  <TrendingUp className="h-6 w-6 text-primary-accent" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Tasa Mercado Promedio
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {avgMarketRate.toFixed(2)}%
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
                  <DollarSign className="h-6 w-6 text-primary-accent" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Enfoque Principal
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      TREA (Rentabilidad)
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lista de Bonos Disponibles */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Bonos Disponibles para Inversión</h2>
              
              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Buscar bonos..."
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <select
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={filterCurrency}
                    onChange={(e) => setFilterCurrency(e.target.value)}
                  >
                    <option value="all">Todas las monedas</option>
                    <option value="PEN">PEN</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tasa de Interés
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Moneda
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBonds.map((bond) => (
                    <tr key={bond.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{bond.name}</div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(bond.nominalValue, bond.currency)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatBondPercentage(bond.couponRate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bond.currency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleAnalyzeBond(bond)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-black bg-primary-accent hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Analizar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Análisis del Bono Seleccionado */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                {selectedBond ? `Análisis: ${selectedBond.name}` : 'Selecciona un bono para analizar'}
              </h2>
            </div>

            {selectedBond && bondResults ? (
              <div className="p-6">
                {/* Métricas Clave para el Inversor */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-green-600">TREA (Tu Rentabilidad)</div>
                    <div className="text-2xl font-bold text-green-900">
                      {formatPercentage(bondResults.trea)}
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-blue-600">Precio Máximo a Pagar</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {formatCurrency(bondResults.maxMarketPrice, selectedBond.currency)}
                    </div>
                  </div>
                </div>

                {/* Información del Bono */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Información del Bono</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">Valor Nominal:</span>
                      <span className="ml-2 text-gray-900">
                        {formatCurrency(selectedBond.nominalValue, selectedBond.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Períodos:</span>
                      <span className="ml-2 text-gray-900">{selectedBond.maturityPeriods}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Duración:</span>
                      <span className="ml-2 text-gray-900">{bondResults.duration.toFixed(4)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Convexidad:</span>
                      <span className="ml-2 text-gray-900">{bondResults.convexity.toFixed(4)}</span>
                    </div>
                  </div>
                </div>

                {/* Comparación TCEA vs TREA */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Comparación de Tasas</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">TCEA (Costo del Emisor):</span>
                      <span className="text-sm font-medium text-red-600">
                        {formatPercentage(bondResults.tcea)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">TREA (Tu Rentabilidad):</span>
                      <span className="text-sm font-medium text-green-600">
                        {formatPercentage(bondResults.trea)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm font-medium text-gray-700">Diferencia:</span>
                      <span className="text-sm font-bold text-blue-600">
                        {formatPercentage(bondResults.trea - bondResults.tcea)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <Eye className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>Selecciona un bono de la lista para ver su análisis detallado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InversorDashboard;
