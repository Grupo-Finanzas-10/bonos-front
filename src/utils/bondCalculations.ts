import type { BondData, CashFlowItem, BondResults } from '../types';

// Función para convertir tasa nominal a efectiva
export const nominalToEffective = (nominalRate: number, capitalization: number): number => {
  return Math.pow(1 + nominalRate / capitalization, capitalization) - 1;
};

// Función para convertir tasa efectiva a nominal
export const effectiveToNominal = (effectiveRate: number, capitalization: number): number => {
  return capitalization * (Math.pow(1 + effectiveRate, 1 / capitalization) - 1);
};

// Función para calcular el flujo de caja del bono americano
export const calculateAmericanBondCashFlow = (bondData: BondData): CashFlowItem[] => {
  const cashFlow: CashFlowItem[] = [];
  const { nominalValue, couponRate, maturityPeriods, frequency, gracePeriods, graceType, interestType, capitalization } = bondData;
  
  // Calcular la tasa efectiva por período
  let effectivePeriodRate: number;
  
  if (interestType === 'nominal' && capitalization) {
    // Si es tasa nominal, primero convertir a efectiva anual, luego a efectiva del período
    const effectiveAnnualRate = nominalToEffective(couponRate, capitalization);
    effectivePeriodRate = Math.pow(1 + effectiveAnnualRate, 1 / frequency) - 1;
  } else {
    // Si es tasa efectiva anual, convertir directamente a efectiva del período
    effectivePeriodRate = Math.pow(1 + couponRate, 1 / frequency) - 1;
  }
  
  // Calcular el cupón por período usando la tasa efectiva del período
  const couponPayment = nominalValue * effectivePeriodRate;
  
  // En el método americano, el capital se paga SOLO en el último período
  let outstandingBalance = nominalValue;
  
  for (let period = 1; period <= maturityPeriods; period++) {
    let coupon = 0;
    let capitalPayment = 0;
    
    // Aplicar período de gracia
    if (period <= gracePeriods) {
      if (graceType === 'total') {
        // Gracia total: no se paga nada
        coupon = 0;
        capitalPayment = 0;
      } else if (graceType === 'partial') {
        // Gracia parcial: solo se pagan intereses
        coupon = couponPayment;
        capitalPayment = 0;
      }
    } else {
      // Períodos normales: siempre se pagan intereses
      coupon = couponPayment;
      
      // MÉTODO AMERICANO: Capital solo en el último período
      if (period === maturityPeriods) {
        capitalPayment = nominalValue;
        outstandingBalance = 0;
      } else {
        capitalPayment = 0;
        // El saldo pendiente sigue siendo el valor nominal hasta el último período
      }
    }
    
    const totalPayment = coupon + capitalPayment;
    
    cashFlow.push({
      period,
      coupon,
      capitalPayment,
      totalPayment,
      outstandingBalance: Math.max(0, outstandingBalance),
    });
  }
  
  return cashFlow;
};

// Función para calcular el valor presente de los flujos de caja
export const calculatePresentValue = (cashFlow: CashFlowItem[], marketRate: number, frequency: number): number => {
  const periodRate = marketRate / frequency;
  return cashFlow.reduce((pv, item, index) => {
    const period = index + 1;
    return pv + item.totalPayment / Math.pow(1 + periodRate, period);
  }, 0);
};

// Función para calcular la duración
export const calculateDuration = (cashFlow: CashFlowItem[], marketRate: number, frequency: number, presentValue: number): number => {
  const periodRate = marketRate / frequency;
  const weightedTime = cashFlow.reduce((sum, item, index) => {
    const period = index + 1;
    const pv = item.totalPayment / Math.pow(1 + periodRate, period);
    return sum + (period * pv);
  }, 0);
  
  return (weightedTime / presentValue) / frequency; // Convertir a años
};

// Función para calcular la duración modificada
export const calculateModifiedDuration = (duration: number, marketRate: number, frequency: number): number => {
  return duration / (1 + marketRate / frequency);
};

// Función para calcular la convexidad
export const calculateConvexity = (cashFlow: CashFlowItem[], marketRate: number, frequency: number, presentValue: number): number => {
  const periodRate = marketRate / frequency;
  const convexitySum = cashFlow.reduce((sum, item, index) => {
    const period = index + 1;
    const pv = item.totalPayment / Math.pow(1 + periodRate, period);
    return sum + (period * (period + 1) * pv);
  }, 0);
  
  return (convexitySum / presentValue) / Math.pow(frequency, 2);
};

// Función para calcular TCEA (Tasa de Coste Efectivo Anual)
export const calculateTCEA = (bondData: BondData, cashFlow: CashFlowItem[], emissionPrice: number): number => {
  // TCEA es la TIR desde la perspectiva del emisor
  // Flujo del emisor: +Valor recibido inicialmente, -pagos futuros
  
  // Usamos el método de Newton-Raphson para encontrar la TIR del emisor
  let rate = 0.1; // Tasa inicial del 10%
  const tolerance = 1e-10;
  const maxIterations = 100;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = emissionPrice; // Flujo inicial positivo (el emisor recibe dinero)
    let npvDerivative = 0;
    
    cashFlow.forEach((item, index) => {
      const period = index + 1;
      const periodRate = rate / bondData.frequency;
      const factor = Math.pow(1 + periodRate, period);
      
      // VPN: resta los pagos que hace el emisor (flujos negativos para el emisor)
      npv -= item.totalPayment / factor;
      
      // Derivada del VPN respecto a la tasa
      npvDerivative += (period * item.totalPayment) / (bondData.frequency * factor * (1 + periodRate));
    });
    
    // Si el VPN es suficientemente pequeño, hemos encontrado la solución
    if (Math.abs(npv) < tolerance) break;
    
    // Actualizar la tasa usando Newton-Raphson
    rate = rate - npv / npvDerivative;
    
    // Evitar tasas negativas extremas
    if (rate < -0.99) rate = -0.99;
  }
  
  // Convertir la tasa periódica a efectiva anual
  return Math.pow(1 + rate / bondData.frequency, bondData.frequency) - 1;
};

// Función para calcular TREA (Tasa de Rendimiento Efectivo Anual)
export const calculateTREA = (cashFlow: CashFlowItem[], investmentAmount: number, frequency: number): number => {
  // Usamos el método de Newton-Raphson para encontrar la TIR (Tasa Interna de Retorno)
  let rate = 0.1; // Tasa inicial del 10%
  const tolerance = 1e-10;
  const maxIterations = 100;
  
  for (let i = 0; i < maxIterations; i++) {
    // Calculamos el VPN y su derivada
    let npv = -investmentAmount; // Flujo inicial negativo (inversión)
    let npvDerivative = 0;
    
    cashFlow.forEach((item, index) => {
      const period = index + 1;
      const periodRate = rate / frequency;
      const factor = Math.pow(1 + periodRate, period);
      
      // VPN: suma de flujos descontados
      npv += item.totalPayment / factor;
      
      // Derivada del VPN respecto a la tasa
      npvDerivative -= (period * item.totalPayment) / (frequency * factor * (1 + periodRate));
    });
    
    // Si el VPN es suficientemente pequeño, hemos encontrado la solución
    if (Math.abs(npv) < tolerance) break;
    
    // Actualizar la tasa usando Newton-Raphson: x_{n+1} = x_n - f(x_n)/f'(x_n)
    rate = rate - npv / npvDerivative;
    
    // Evitar tasas negativas extremas
    if (rate < -0.99) rate = -0.99;
  }
  
  // Convertir la tasa periódica a efectiva anual
  return Math.pow(1 + rate / frequency, frequency) - 1;
};

// Función para calcular el precio máximo del mercado
export const calculateMaxMarketPrice = (cashFlow: CashFlowItem[], couponRate: number, frequency: number): number => {
  // El precio máximo del mercado se calcula usando la tasa cupón como tasa de descuento
  // Representa el escenario donde el mercado estaría dispuesto a pagar más (menor exigencia de rendimiento)
  return calculatePresentValue(cashFlow, couponRate, frequency);
};

// Función para calcular todos los resultados del bono usando la API del backend
export const calculateBondResultsFromAPI = async (bondData: BondData): Promise<BondResults> => {
  // Importar dinámicamente el apiService para evitar problemas de dependencias circulares
  const { apiService } = await import('../services/api');
  
  try {
    console.log('🌐 Calculando resultados usando API backend...');
    console.log('📋 Datos del bono:', bondData);
    
    // Preparar datos para la API según el formato exacto que espera el backend
    const apiData = {
      name: bondData.name,
      nominalValue: bondData.nominalValue,
      couponRate: bondData.couponRate, // Enviar como decimal (0.05 para 5%)
      maturityPeriods: bondData.maturityPeriods,
      frequency: bondData.frequency,
      marketRate: bondData.marketRate, // Enviar como decimal (0.08 para 8%)
      gracePeriods: bondData.gracePeriods,
      graceType: bondData.graceType,
      currency: bondData.currency,
      interestType: bondData.interestType,
      capitalization: bondData.capitalization || 1
    };
    
    console.log('📤 Enviando datos a API:', apiData);
    
    // Usar marketRate como tasa de oportunidad (enviar como decimal)
    const tasaOportunidad = bondData.marketRate; // Mantener como decimal
    
    // Llamar a la API
    const apiResponse = await apiService.simulateBond(apiData, tasaOportunidad);
    
    console.log('📨 Respuesta de API:', apiResponse);
    
    // Validar respuesta de la API - usar nombres en minúsculas como devuelve el backend
    console.log('🔍 Validando datos de respuesta:');
    console.log('  - tcea:', apiResponse.tcea, typeof apiResponse.tcea, isNaN(apiResponse.tcea));
    console.log('  - trea:', apiResponse.trea, typeof apiResponse.trea, isNaN(apiResponse.trea));
    console.log('  - duracion:', apiResponse.duracion, typeof apiResponse.duracion, isNaN(apiResponse.duracion));
    console.log('  - convexidad:', apiResponse.convexidad, typeof apiResponse.convexidad, isNaN(apiResponse.convexidad));
    console.log('  - precioMaximo:', apiResponse.precioMaximo, typeof apiResponse.precioMaximo, isNaN(apiResponse.precioMaximo));
    
    // Función helper para convertir valores a números válidos
    const toValidNumber = (value: any, fallback: number = 0): number => {
      if (value === null || value === undefined) return fallback;
      const num = parseFloat(value);
      return isNaN(num) ? fallback : num;
    };
    
    // Calcular flujo de caja localmente (necesario para exportación y tabla)
    const cashFlow = calculateAmericanBondCashFlow(bondData);
    
    // Ajustar tasa de mercado si es necesario para el precio del bono
    let effectiveMarketRate = bondData.marketRate;
    if (bondData.interestType === 'nominal' && bondData.capitalization) {
      effectiveMarketRate = nominalToEffective(bondData.marketRate, bondData.capitalization);
    }
    
    // Calcular precio del bono usando los cálculos locales
    const presentValue = calculatePresentValue(cashFlow, effectiveMarketRate, bondData.frequency);
    
    // Convertir respuesta de API al formato esperado por la interfaz con validaciones
    const duracion = toValidNumber(apiResponse.duracion);
    const tcea = toValidNumber(apiResponse.tcea) * 100; // Convertir a porcentaje (0.1 -> 10%)
    const trea = toValidNumber(apiResponse.trea) * 100; // Convertir a porcentaje (0.12 -> 12%)
    const convexidad = toValidNumber(apiResponse.convexidad);
    const precioMaximo = toValidNumber(apiResponse.precioMaximo, presentValue);
    
    const results: BondResults = {
      cashFlow,
      presentValue, // Precio calculado localmente para mantener compatibilidad
      duration: duracion,
      modifiedDuration: apiResponse.duracionModificada ? toValidNumber(apiResponse.duracionModificada) : (duracion > 0 ? duracion / (1 + effectiveMarketRate / bondData.frequency) : 0),
      convexity: convexidad,
      tcea: tcea,
      trea: trea,
      maxMarketPrice: precioMaximo,
    };
    
    console.log('✅ Resultados procesados de la API:');
    console.log('  - TCEA final:', results.tcea, typeof results.tcea);
    console.log('  - TREA final:', results.trea, typeof results.trea);
    console.log('  - Duracion final:', results.duration, typeof results.duration);
    console.log('  - Convexidad final:', results.convexity, typeof results.convexity);
    console.log('  - Precio máximo final:', results.maxMarketPrice, typeof results.maxMarketPrice);
    
    console.log('✅ Resultados procesados de la API:', results);
    
    return results;
  } catch (error) {
    console.error('❌ Error calculando con API, usando cálculos locales como fallback:', error);
    
    // Fallback a cálculos locales si la API falla
    console.log('🔄 Usando cálculos locales como fallback...');
    return calculateBondResultsLocally(bondData);
  }
};

// Función principal para calcular todos los resultados del bono usando cálculos locales (LEGACY)
export const calculateBondResultsLocally = (bondData: BondData): BondResults => {
  // Ajustar tasa de mercado si es necesario
  let effectiveMarketRate = bondData.marketRate;
  if (bondData.interestType === 'nominal' && bondData.capitalization) {
    effectiveMarketRate = nominalToEffective(bondData.marketRate, bondData.capitalization);
  }
  
  const cashFlow = calculateAmericanBondCashFlow(bondData);
  const presentValue = calculatePresentValue(cashFlow, effectiveMarketRate, bondData.frequency);
  const duration = calculateDuration(cashFlow, effectiveMarketRate, bondData.frequency, presentValue);
  const modifiedDuration = calculateModifiedDuration(duration, effectiveMarketRate, bondData.frequency);
  const convexity = calculateConvexity(cashFlow, effectiveMarketRate, bondData.frequency, presentValue);
  
  // TCEA: Costo para el emisor (asume emisión a valor nominal)
  const tcea = calculateTCEA(bondData, cashFlow, bondData.nominalValue) * 100; // Convertir a porcentaje
  
  // TREA: Rendimiento para el inversionista (basado en precio de mercado)
  const trea = calculateTREA(cashFlow, presentValue, bondData.frequency) * 100; // Convertir a porcentaje
  
  // Precio máximo del mercado usando la tasa cupón como descuento
  let effectiveCouponRate = bondData.couponRate;
  if (bondData.interestType === 'nominal' && bondData.capitalization) {
    effectiveCouponRate = nominalToEffective(bondData.couponRate, bondData.capitalization);
  }
  const maxMarketPrice = calculateMaxMarketPrice(cashFlow, effectiveCouponRate, bondData.frequency);
  
  return {
    cashFlow,
    presentValue,
    duration,
    modifiedDuration,
    convexity,
    tcea,
    trea,
    maxMarketPrice,
  };
};

// Función principal que usa la API del backend (recomendada)
export const calculateBondResults = calculateBondResultsFromAPI;
