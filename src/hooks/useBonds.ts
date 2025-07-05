import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { BondRequest, BondSimulationResponse } from '../services/api';
import type { BondData } from '../types';

// Hook para manejar bonos con el backend
export const useBonds = () => {
  const [bonds, setBonds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para convertir datos del backend al formato local
  const convertBackendBondToLocal = (backendBond: any): BondData => {
    return {
      id: backendBond.id?.toString() || '',
      name: backendBond.name || '',
      nominalValue: backendBond.nominalValue || 0,
      couponRate: backendBond.couponRate || 0,
      maturityPeriods: backendBond.maturityPeriods || 0,
      frequency: backendBond.frequency || 1,
      marketRate: backendBond.marketRate || 0,
      gracePeriods: backendBond.gracePeriods || 0,
      graceType: backendBond.graceType as 'total' | 'partial' | 'none' || 'none',
      currency: backendBond.currency as 'PEN' | 'USD' | 'EUR' || 'PEN',
      interestType: backendBond.interestType as 'effective' | 'nominal' || 'effective',
      capitalization: backendBond.capitalization || 12,
      createdAt: backendBond.createdAt ? new Date(backendBond.createdAt) : new Date(),
      updatedAt: backendBond.updatedAt ? new Date(backendBond.updatedAt) : new Date(),
    };
  };

  // Función para convertir datos locales al formato del backend
  const convertLocalBondToBackend = (localBond: Partial<BondData>): BondRequest => {
    return {
      name: localBond.name || '',
      nominalValue: localBond.nominalValue || 0,
      couponRate: localBond.couponRate || 0,
      maturityPeriods: localBond.maturityPeriods || 0,
      frequency: localBond.frequency || 1,
      marketRate: localBond.marketRate || 0,
      gracePeriods: localBond.gracePeriods || 0,
      graceType: localBond.graceType || 'none',
      currency: localBond.currency || 'PEN',
      interestType: localBond.interestType || 'effective',
      capitalization: localBond.capitalization || 12,
    };
  };

  // Cargar todos los bonos
  const fetchBonds = async () => {
    try {
      setLoading(true);
      setError(null);
      const backendBonds = await apiService.getAllBonds();
      const localBonds = backendBonds.map(convertBackendBondToLocal);
      setBonds(localBonds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar bonos');
      console.error('Error fetching bonds:', err);
    } finally {
      setLoading(false);
    }
  };

  // Obtener un bono específico
  const getBond = async (id: string): Promise<BondData | null> => {
    try {
      setLoading(true);
      setError(null);
      const backendBond = await apiService.getBond(id);
      return convertBackendBondToLocal(backendBond);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener bono');
      console.error('Error getting bond:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Agregar un nuevo bono
  const addBond = async (bondData: Omit<BondData, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const backendBond = convertLocalBondToBackend(bondData);
      await apiService.createBond(backendBond);
      
      // Actualizar la lista local
      await fetchBonds();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear bono');
      console.error('Error adding bond:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar un bono existente
  const updateBond = async (id: string, updates: Partial<BondData>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const backendUpdates = convertLocalBondToBackend(updates);
      await apiService.updateBond(id, backendUpdates);
      
      // Actualizar la lista local
      await fetchBonds();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar bono');
      console.error('Error updating bond:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar un bono
  const deleteBond = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await apiService.deleteBond(id);
      
      // Actualizar la lista local
      setBonds(prevBonds => prevBonds.filter(bond => bond.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar bono');
      console.error('Error deleting bond:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Simular un bono
  const simulateBond = async (bondData: BondData, tasaOportunidad: number): Promise<BondSimulationResponse | null> => {
    try {
      setLoading(true);
      setError(null);
      const backendBond = convertLocalBondToBackend(bondData);
      const result = await apiService.simulateBond(backendBond, tasaOportunidad);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al simular bono');
      console.error('Error simulating bond:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Buscar un bono local por ID (sin llamada al backend)
  const findLocalBond = (id: string): BondData | undefined => {
    return bonds.find(bond => bond.id === id);
  };

  // Cargar bonos al montar el componente
  useEffect(() => {
    if (apiService.isAuthenticated()) {
      fetchBonds();
    }
  }, []);

  return {
    bonds,
    loading,
    error,
    fetchBonds,
    getBond,
    addBond,
    updateBond,
    deleteBond,
    simulateBond,
    findLocalBond,
    setError, // Para limpiar errores manualmente
  };
};

export default useBonds;
