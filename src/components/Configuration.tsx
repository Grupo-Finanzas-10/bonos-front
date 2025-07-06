import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, Save, AlertCircle } from 'lucide-react';

const Configuration: React.FC = () => {
  const { config, updateConfig } = useApp();
  const [formData, setFormData] = useState(config);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capitalization' ? parseInt(value) : value,
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-primary-accent" />
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">Configuración del Sistema</h1>
          <p className="text-gray-600">Configure los parámetros por defecto para nuevos bonos</p>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Moneda por defecto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moneda por defecto
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PEN">Soles (PEN)</option>
              <option value="USD">Dólares (USD)</option>
              <option value="EUR">Euros (EUR)</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Esta será la moneda seleccionada por defecto al crear nuevos bonos
            </p>
          </div>

          {/* Tipo de tasa de interés */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de tasa de interés por defecto
            </label>
            <select
              name="interestType"
              value={formData.interestType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="effective">Tasa Efectiva</option>
              <option value="nominal">Tasa Nominal</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Seleccione si desea trabajar con tasas efectivas o nominales por defecto
            </p>
          </div>

          {/* Capitalización (solo para tasa nominal) */}
          {formData.interestType === 'nominal' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capitalización por defecto
              </label>
              <select
                name="capitalization"
                value={formData.capitalization}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Anual (1 vez por año)</option>
                <option value={2}>Semestral (2 veces por año)</option>
                <option value={4}>Trimestral (4 veces por año)</option>
                <option value={12}>Mensual (12 veces por año)</option>
                <option value={360}>Diaria (360 veces por año)</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Número de veces que se capitaliza el interés por año
              </p>
            </div>
          )}

          {/* Information Panel */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
              <div className="text-sm text-blue-800">
                <h4 className="font-medium mb-2">Información sobre las configuraciones:</h4>
                <ul className="space-y-1 text-xs">
                  <li><strong>Tasa Efectiva:</strong> Es la tasa real que se aplica al capital durante un período determinado.</li>
                  <li><strong>Tasa Nominal:</strong> Es la tasa declarada que debe convertirse a efectiva considerando la capitalización.</li>
                  <li><strong>Capitalización:</strong> Determina cuántas veces se aplican los intereses por año.</li>
                  <li><strong>Método Americano:</strong> El capital se amortiza en cuotas iguales a lo largo de la vida del bono.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {saved && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="h-5 w-5 bg-green-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-green-600 text-xs">✓</span>
                </div>
                <span className="text-sm text-green-800">
                  Configuración guardada exitosamente
                </span>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-primary-accent text-black px-6 py-2 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors flex items-center"
            >
              <Save size={16} className="mr-2" />
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>

      {/* Current Configuration Display */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-medium text-gray-800 mb-3">Configuración Actual</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Moneda:</p>
            <p className="font-medium">{config.currency}</p>
          </div>
          <div>
            <p className="text-gray-600">Tipo de Interés:</p>
            <p className="font-medium">
              {config.interestType === 'effective' ? 'Efectiva' : 'Nominal'}
            </p>
          </div>
          {config.interestType === 'nominal' && (
            <div>
              <p className="text-gray-600">Capitalización:</p>
              <p className="font-medium">
                {config.capitalization === 1 ? 'Anual' : 
                 config.capitalization === 2 ? 'Semestral' :
                 config.capitalization === 4 ? 'Trimestral' :
                 config.capitalization === 12 ? 'Mensual' :
                 config.capitalization === 360 ? 'Diaria' :
                 `${config.capitalization} veces/año`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Configuration;
