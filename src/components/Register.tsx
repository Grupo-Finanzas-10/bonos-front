import React, { useState } from 'react';
import { useAuth } from '../context/AppContext';
import type { User } from '../types';
import { Eye, EyeOff, User as UserIcon, Building, Mail, Lock, ArrowLeft } from 'lucide-react';

interface RegisterProps {
  onSuccess: (user: User) => void;
  onCancel: () => void;
}

interface FormData {
  username: string;
  password: string;
  confirmPassword: string;
  name: string;
  email: string;
  role: 'emisor' | 'inversor' | '';
  // Campos específicos para emisor
  companyName: string;
  ruc: string;
  sector: string;
  // Campos específicos para inversor
  investorType: 'individual' | 'institutional' | '';
  riskProfile: 'conservative' | 'moderate' | 'aggressive' | '';
  investmentAmount: string;
}

const Register: React.FC<RegisterProps> = ({ onSuccess, onCancel }) => {
  const { register } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    email: '',
    role: '',
    companyName: '',
    ruc: '',
    sector: '',
    investorType: '',
    riskProfile: '',
    investmentAmount: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Datos básicos, 2: Datos específicos del rol

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username) {
      newErrors.username = 'El nombre de usuario es obligatorio';
    } else if (formData.username.length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    }

    if (!formData.email) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El formato del email no es válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.name) {
      newErrors.name = 'El nombre completo es obligatorio';
    }

    if (!formData.role) {
      newErrors.role = 'Selecciona un rol';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.role === 'emisor') {
      if (!formData.companyName) {
        newErrors.companyName = 'El nombre de la empresa es obligatorio';
      }
      if (!formData.ruc) {
        newErrors.ruc = 'El RUC es obligatorio';
      } else if (!/^\d{11}$/.test(formData.ruc)) {
        newErrors.ruc = 'El RUC debe tener 11 dígitos';
      }
      if (!formData.sector) {
        newErrors.sector = 'El sector es obligatorio';
      }
    } else if (formData.role === 'inversor') {
      if (!formData.investorType) {
        newErrors.investorType = 'El tipo de inversor es obligatorio';
      }
      if (!formData.riskProfile) {
        newErrors.riskProfile = 'El perfil de riesgo es obligatorio';
      }
      if (!formData.investmentAmount) {
        newErrors.investmentAmount = 'El monto de inversión es obligatorio';
      } else if (isNaN(Number(formData.investmentAmount)) || Number(formData.investmentAmount) <= 0) {
        newErrors.investmentAmount = 'Ingresa un monto válido mayor a 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNextStep = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) return;

    setIsLoading(true);
    
    try {
      // Crear el objeto de usuario para registrar
      const userData: Omit<User, 'id' | 'createdAt'> = {
        username: formData.username,
        password: formData.password,
        name: formData.name,
        email: formData.email,
        role: formData.role as 'emisor' | 'inversor',
        ...(formData.role === 'emisor' && {
          companyName: formData.companyName,
          ruc: formData.ruc,
          sector: formData.sector
        }),
        ...(formData.role === 'inversor' && {
          investorType: formData.investorType as 'individual' | 'institutional',
          riskProfile: formData.riskProfile as 'conservative' | 'moderate' | 'aggressive',
          investmentAmount: Number(formData.investmentAmount)
        })
      };

      console.log('📝 Register: Enviando datos de registro:', userData);

      // Usar la función register del contexto (ahora es asíncrona)
      const success = await register(userData);
      
      if (success) {
        console.log('✅ Register: Registro exitoso');
        
        // Crear un objeto de usuario para mantener compatibilidad con la interfaz
        const userForCallback: User = {
          ...userData,
          id: '', // Se asignará automáticamente
          createdAt: new Date(),
        };
        
        onSuccess(userForCallback);
      } else {
        console.error('❌ Register: Fallo en el registro');
        setErrors({ general: 'Error en el registro. Verifica los datos o intenta con otros.' });
      }
    } catch (error) {
      console.error('💥 Register: Error en el registro:', error);
      setErrors({ general: 'Error al registrar usuario. Inténtalo de nuevo.' });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'emisor': return 'Emisor de Bonos';
      case 'inversor': return 'Inversor';
      default: return role;
    }
  };

  const getSectorOptions = () => [
    'Tecnología', 'Financiero', 'Energía', 'Salud', 'Consumo', 
    'Inmobiliario', 'Industrial', 'Telecomunicaciones', 'Retail', 'Otro'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {step === 2 && (
                <button
                  onClick={handlePrevStep}
                  className="mr-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft size={20} className="text-gray-600" />
                </button>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Crear Cuenta</h2>
                <p className="text-gray-600 text-sm">
                  Paso {step} de 2: {step === 1 ? 'Datos básicos' : `Datos de ${getRoleDisplayName(formData.role)}`}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={step === 1 ? handleNextStep : handleSubmit} className="p-6">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Usuario
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.username ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Tu nombre de usuario"
                  />
                </div>
                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="tu@email.com"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Tu nombre completo"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Usuario
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.role ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecciona tu rol</option>
                  <option value="emisor">Emisor de Bonos</option>
                  <option value="inversor">Inversor</option>
                </select>
                {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Repite tu contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Continuar
              </button>
            </div>
          )}

          {step === 2 && formData.role === 'emisor' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <Building className="mx-auto text-blue-600 mb-2" size={40} />
                <h3 className="text-lg font-semibold text-gray-900">Información de la Empresa</h3>
                <p className="text-gray-600 text-sm">Completa los datos de tu empresa emisora</p>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.companyName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Nombre de tu empresa"
                />
                {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
              </div>

              {/* RUC */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RUC
                </label>
                <input
                  type="text"
                  name="ruc"
                  value={formData.ruc}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.ruc ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="20123456789"
                  maxLength={11}
                />
                {errors.ruc && <p className="text-red-500 text-sm mt-1">{errors.ruc}</p>}
              </div>

              {/* Sector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sector
                </label>
                <select
                  name="sector"
                  value={formData.sector}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.sector ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecciona el sector</option>
                  {getSectorOptions().map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
                {errors.sector && <p className="text-red-500 text-sm mt-1">{errors.sector}</p>}
              </div>
            </div>
          )}

          {step === 2 && formData.role === 'inversor' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <UserIcon className="mx-auto text-green-600 mb-2" size={40} />
                <h3 className="text-lg font-semibold text-gray-900">Perfil de Inversor</h3>
                <p className="text-gray-600 text-sm">Define tu perfil de inversión</p>
              </div>

              {/* Investor Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Inversor
                </label>
                <select
                  name="investorType"
                  value={formData.investorType}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.investorType ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecciona el tipo</option>
                  <option value="individual">Individual</option>
                  <option value="institutional">Institucional</option>
                </select>
                {errors.investorType && <p className="text-red-500 text-sm mt-1">{errors.investorType}</p>}
              </div>

              {/* Risk Profile */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Perfil de Riesgo
                </label>
                <select
                  name="riskProfile"
                  value={formData.riskProfile}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.riskProfile ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecciona tu perfil</option>
                  <option value="conservative">Conservador</option>
                  <option value="moderate">Moderado</option>
                  <option value="aggressive">Agresivo</option>
                </select>
                {errors.riskProfile && <p className="text-red-500 text-sm mt-1">{errors.riskProfile}</p>}
              </div>

              {/* Investment Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto de Inversión Disponible (S/.)
                </label>
                <input
                  type="number"
                  name="investmentAmount"
                  value={formData.investmentAmount}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.investmentAmount ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="10000"
                  min="1"
                />
                {errors.investmentAmount && <p className="text-red-500 text-sm mt-1">{errors.investmentAmount}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 pb-6">
          <div className="text-center">
            <button
              onClick={onCancel}
              className="text-blue-600 hover:text-blue-800 text-sm transition-colors"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
