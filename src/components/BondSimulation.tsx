import React, { useState } from 'react';
import { useBondSimulation } from '../context/AppContextNew';
import type { BondData } from '../types';
import { Loader2, Calculator, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

interface BondSimulationProps {
  bond: BondData;
}

const BondSimulation: React.FC<BondSimulationProps> = ({ bond }) => {
  const [tasaOportunidad, setTasaOportunidad] = useState<number>(5);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const { simulateBond, loading, error, setError } = useBondSimulation();

  const handleSimulate = async () => {
    setError(null);
    setSimulationResult(null);

    if (tasaOportunidad <= 0) {
      setError('La tasa de oportunidad debe ser mayor a 0');
      return;
    }

    const result = await simulateBond(bond, tasaOportunidad);
    if (result) {
      setSimulationResult(result);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: bond.currency || 'PEN',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`; // Para tasas ya convertidas a porcentaje (TREA, TCEA)
  };

  const formatBondPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`; // Para tasas del bono almacenadas como decimal
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center mb-6">
        <Calculator className="h-6 w-6 text-blue-600 mr-3" />
        <h3 className="text-lg font-medium text-gray-900">
          Simulación de Bono - {bond.name}
        </h3>
      </div>

      {/* Información del bono */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Datos del Bono</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Valor Nominal:</span>
            <p className="font-medium">{formatCurrency(bond.nominalValue)}</p>
          </div>
          <div>
            <span className="text-gray-600">Tasa Cupón:</span>
            <p className="font-medium">{formatBondPercentage(bond.couponRate)}</p>
          </div>
          <div>
            <span className="text-gray-600">Períodos:</span>
            <p className="font-medium">{bond.maturityPeriods}</p>
          </div>
          <div>
            <span className="text-gray-600">Frecuencia:</span>
            <p className="font-medium">{bond.frequency}x/año</p>
          </div>
        </div>
      </div>

      {/* Input para tasa de oportunidad */}
      <div className="mb-6">
        <label htmlFor="tasaOportunidad" className="block text-sm font-medium text-gray-700 mb-2">
          Tasa de Oportunidad (%)
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="number"
            id="tasaOportunidad"
            value={tasaOportunidad}
            onChange={(e) => setTasaOportunidad(Number(e.target.value))}
            min="0"
            step="0.1"
            className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
          <button
            onClick={handleSimulate}
            disabled={loading}
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
            {loading ? 'Simulando...' : 'Simular'}
          </button>
        </div>
      </div>

      {/* Mensajes de error */}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                Error en la simulación
              </p>
              <p className="text-sm text-red-700 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Resultados de la simulación */}
      {simulationResult && (
        <div className="space-y-6">
          {/* Mensaje de éxito */}
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Simulación completada exitosamente
                </p>
              </div>
            </div>
          </div>

          {/* Resultados principales */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
              Resultados de la Simulación
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-center">
                  <h5 className="text-sm font-medium text-gray-600 mb-1">Precio Máximo</h5>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(simulationResult.PrecioMaximo)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Valor presente del bono
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-center">
                  <h5 className="text-sm font-medium text-gray-600 mb-1">Duración</h5>
                  <p className="text-2xl font-bold text-green-600">
                    {simulationResult.Duracion.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Años de duración
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-center">
                  <h5 className="text-sm font-medium text-gray-600 mb-1">Convexidad</h5>
                  <p className="text-2xl font-bold text-purple-600">
                    {simulationResult.Convexidad.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Medida de curvatura
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-center">
                  <h5 className="text-sm font-medium text-gray-600 mb-1">TCEA</h5>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatPercentage(simulationResult.TCEA)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Tasa Costo Efectivo Anual
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-center">
                  <h5 className="text-sm font-medium text-gray-600 mb-1">TREA</h5>
                  <p className="text-2xl font-bold text-red-600">
                    {formatPercentage(simulationResult.TREA)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Tasa Rendimiento Efectivo Anual
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-center">
                  <h5 className="text-sm font-medium text-gray-600 mb-1">Tasa Oportunidad</h5>
                  <p className="text-2xl font-bold text-gray-600">
                    {formatBondPercentage(tasaOportunidad / 100)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Tasa de descuento usada
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interpretación de resultados */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h5 className="text-sm font-medium text-yellow-800 mb-2">
              💡 Interpretación de Resultados
            </h5>
            <div className="text-sm text-yellow-700 space-y-2">
              <p>
                • <strong>Precio Máximo:</strong> Es el valor presente del bono considerando la tasa de oportunidad del {formatBondPercentage(tasaOportunidad / 100)}.
              </p>
              <p>
                • <strong>Duración:</strong> Indica la sensibilidad del precio del bono a cambios en las tasas de interés.
              </p>
              <p>
                • <strong>Convexidad:</strong> Mide la curvatura de la relación precio-rendimiento del bono.
              </p>
              <p>
                • <strong>TCEA/TREA:</strong> Representan las tasas efectivas anuales de costo y rendimiento respectivamente.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BondSimulation;
