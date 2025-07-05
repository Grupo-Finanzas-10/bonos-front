import React, { useState } from 'react';
import type { User } from '../types';
import { useAuth } from '../context/AppContextNew';
import { Eye, EyeOff, User as UserIcon, Building, Mail, Lock, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

interface RegisterNewProps {
  onSuccess: (user: User) => void;
  onBackToLogin: () => void;
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

const RegisterNew: React.FC<RegisterNewProps> = ({ onSuccess, onBackToLogin }) => {
  const { register, loading, error, setError } = useAuth();
  
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
  const [step, setStep] = useState(1); // 1: Datos básicos, 2: Datos específicos del rol

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    } else if (formData.username.length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirme su contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.role) {
      newErrors.role = 'Seleccione un tipo de usuario';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.role === 'emisor') {
      if (!formData.companyName.trim()) {
        newErrors.companyName = 'El nombre de la empresa es requerido';
      }
      if (!formData.ruc.trim()) {
        newErrors.ruc = 'El RUC es requerido';
      } else if (!/^\d{11}$/.test(formData.ruc)) {
        newErrors.ruc = 'El RUC debe tener 11 dígitos';
      }
      if (!formData.sector.trim()) {
        newErrors.sector = 'El sector es requerido';
      }
    } else if (formData.role === 'inversor') {
      if (!formData.investorType) {
        newErrors.investorType = 'Seleccione el tipo de inversor';
      }
      if (!formData.riskProfile) {
        newErrors.riskProfile = 'Seleccione el perfil de riesgo';
      }
      if (!formData.investmentAmount.trim()) {
        newErrors.investmentAmount = 'El monto de inversión es requerido';
      } else if (isNaN(Number(formData.investmentAmount)) || Number(formData.investmentAmount) <= 0) {
        newErrors.investmentAmount = 'El monto debe ser un número positivo';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo al empezar a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateStep2()) {
      return;
    }

    try {
      const success = await register(formData.username, formData.password, formData.role as 'emisor' | 'inversor');
      
      if (success) {
        // Crear objeto de usuario para el callback
        const user: User = {
          id: Date.now().toString(),
          username: formData.username,
          password: '', // No incluir contraseña
          name: formData.name,
          email: formData.email,
          role: formData.role as 'emisor' | 'inversor',
          createdAt: new Date(),
          // Campos específicos según el rol
          ...(formData.role === 'emisor' && {
            companyName: formData.companyName,
            ruc: formData.ruc,
            sector: formData.sector,
          }),
          ...(formData.role === 'inversor' && {
            investorType: formData.investorType as 'individual' | 'institutional',
            riskProfile: formData.riskProfile as 'conservative' | 'moderate' | 'aggressive',
            investmentAmount: Number(formData.investmentAmount),
          }),
        };
        
        onSuccess(user);
      }
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  const renderStep1 = () => (
    <form onSubmit={handleNextStep} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Nombre de Usuario *
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="username"
              id="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                errors.username ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ingrese su nombre de usuario"
            />
          </div>
          {errors.username && (
            <p className="mt-2 text-sm text-red-600">{errors.username}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Contraseña *
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              id="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`block w-full pl-10 pr-10 py-2 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                errors.password ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ingrese su contraseña"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {errors.password && (
            <p className="mt-2 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirmar Contraseña *
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`block w-full pl-10 pr-10 py-2 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Confirme su contraseña"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nombre Completo *
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ingrese su nombre completo"
            />
          </div>
          {errors.name && (
            <p className="mt-2 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Correo Electrónico *
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ingrese su correo electrónico"
            />
          </div>
          {errors.email && (
            <p className="mt-2 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Tipo de Usuario *
          </label>
          <div className="mt-1">
            <select
              name="role"
              id="role"
              value={formData.role}
              onChange={handleInputChange}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                errors.role ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccione un tipo</option>
              <option value="emisor">Emisor (Empresa)</option>
              <option value="inversor">Inversor</option>
            </select>
          </div>
          {errors.role && (
            <p className="mt-2 text-sm text-red-600">{errors.role}</p>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBackToLogin}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Login
        </button>
        <button
          type="submit"
          className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Siguiente
        </button>
      </div>
    </form>
  );

  const renderStep2 = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formData.role === 'emisor' && (
        <div className="grid grid-cols-1 gap-6">
          {/* Company Name */}
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
              Nombre de la Empresa *
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="companyName"
                id="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.companyName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ingrese el nombre de su empresa"
              />
            </div>
            {errors.companyName && (
              <p className="mt-2 text-sm text-red-600">{errors.companyName}</p>
            )}
          </div>

          {/* RUC */}
          <div>
            <label htmlFor="ruc" className="block text-sm font-medium text-gray-700">
              RUC *
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="ruc"
                id="ruc"
                value={formData.ruc}
                onChange={handleInputChange}
                maxLength={11}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.ruc ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ingrese el RUC de su empresa (11 dígitos)"
              />
            </div>
            {errors.ruc && (
              <p className="mt-2 text-sm text-red-600">{errors.ruc}</p>
            )}
          </div>

          {/* Sector */}
          <div>
            <label htmlFor="sector" className="block text-sm font-medium text-gray-700">
              Sector *
            </label>
            <div className="mt-1">
              <select
                name="sector"
                id="sector"
                value={formData.sector}
                onChange={handleInputChange}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.sector ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccione un sector</option>
                <option value="Agricultura">Agricultura</option>
                <option value="Construcción">Construcción</option>
                <option value="Educación">Educación</option>
                <option value="Energía">Energía</option>
                <option value="Finanzas">Finanzas</option>
                <option value="Manufactura">Manufactura</option>
                <option value="Minería">Minería</option>
                <option value="Retail">Retail</option>
                <option value="Salud">Salud</option>
                <option value="Tecnología">Tecnología</option>
                <option value="Telecomunicaciones">Telecomunicaciones</option>
                <option value="Transporte">Transporte</option>
                <option value="Turismo">Turismo</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
            {errors.sector && (
              <p className="mt-2 text-sm text-red-600">{errors.sector}</p>
            )}
          </div>
        </div>
      )}

      {formData.role === 'inversor' && (
        <div className="grid grid-cols-1 gap-6">
          {/* Investor Type */}
          <div>
            <label htmlFor="investorType" className="block text-sm font-medium text-gray-700">
              Tipo de Inversor *
            </label>
            <div className="mt-1">
              <select
                name="investorType"
                id="investorType"
                value={formData.investorType}
                onChange={handleInputChange}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.investorType ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccione un tipo</option>
                <option value="individual">Individual</option>
                <option value="institutional">Institucional</option>
              </select>
            </div>
            {errors.investorType && (
              <p className="mt-2 text-sm text-red-600">{errors.investorType}</p>
            )}
          </div>

          {/* Risk Profile */}
          <div>
            <label htmlFor="riskProfile" className="block text-sm font-medium text-gray-700">
              Perfil de Riesgo *
            </label>
            <div className="mt-1">
              <select
                name="riskProfile"
                id="riskProfile"
                value={formData.riskProfile}
                onChange={handleInputChange}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.riskProfile ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccione un perfil</option>
                <option value="conservative">Conservador</option>
                <option value="moderate">Moderado</option>
                <option value="aggressive">Agresivo</option>
              </select>
            </div>
            {errors.riskProfile && (
              <p className="mt-2 text-sm text-red-600">{errors.riskProfile}</p>
            )}
          </div>

          {/* Investment Amount */}
          <div>
            <label htmlFor="investmentAmount" className="block text-sm font-medium text-gray-700">
              Monto de Inversión (PEN) *
            </label>
            <div className="mt-1">
              <input
                type="number"
                name="investmentAmount"
                id="investmentAmount"
                value={formData.investmentAmount}
                onChange={handleInputChange}
                min="1"
                step="0.01"
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.investmentAmount ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ingrese el monto disponible para inversión"
              />
            </div>
            {errors.investmentAmount && (
              <p className="mt-2 text-sm text-red-600">{errors.investmentAmount}</p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={handlePrevStep}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && (
            <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
          )}
          {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Lado izquierdo - Información */}
      <div className="hidden lg:block lg:w-1/2 bg-blue-600 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center px-8">
            <h1 className="text-4xl font-bold mb-4">Únete a Nuestra Plataforma</h1>
            <p className="text-xl mb-8">Crea tu cuenta y comienza a gestionar bonos corporativos</p>
            <div className="space-y-4">
              <div className="flex items-center text-left">
                <div className="bg-white bg-opacity-20 rounded-full p-2 mr-4">
                  <Building className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Para Empresas</h3>
                  <p className="text-sm opacity-90">Emite y gestiona bonos corporativos</p>
                </div>
              </div>
              <div className="flex items-center text-left">
                <div className="bg-white bg-opacity-20 rounded-full p-2 mr-4">
                  <UserIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Para Inversores</h3>
                  <p className="text-sm opacity-90">Analiza y evalúa oportunidades de inversión</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lado derecho - Formulario */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Crear Nueva Cuenta
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Paso {step} de 2: {step === 1 ? 'Datos básicos' : 'Información específica'}
            </p>
          </div>

          <div className="mt-8">
            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex items-center">
                <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className="px-3">
                  <div className={`w-4 h-4 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                </div>
                <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form steps */}
            {step === 1 ? renderStep1() : renderStep2()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterNew;
