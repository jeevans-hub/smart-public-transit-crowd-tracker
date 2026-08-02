/**
 * Digital Twin Hook
 * 
 * Custom hook for digital twin operations with real-time updates
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRealtime } from './useRealtime';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@/utils/eventNames';
import {
  DigitalTwinState,
  City,
  TransitRegion,
  ControlCenter,
  SystemHealth,
  CityComparisonData,
  SimulationParameters,
  SimulationState,
  ResourceRecommendation,
  DigitalTwinFilters,
  DigitalTwinSearch,
} from '@/types/digitalTwin';

export function useDigitalTwin(cityId?: string) {
  const { isConnected, subscribe, unsubscribe, emit } = useRealtime();
  const [state, setState] = useState<DigitalTwinState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch digital twin state
  const fetchState = useCallback(async (cityId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/digital-twin?cityId=${cityId}&type=state`);
      if (!response.ok) throw new Error('Failed to fetch digital twin state');
      const data = await response.json();
      setState(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh state
  const refreshState = useCallback(async (cityId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/digital-twin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh', cityId }),
      });
      if (!response.ok) throw new Error('Failed to refresh digital twin state');
      const data = await response.json();
      setState(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get city health
  const getCityHealth = useCallback(async (cityId: string) => {
    try {
      const response = await fetch(`/api/digital-twin?cityId=${cityId}&type=health`);
      if (!response.ok) throw new Error('Failed to fetch city health');
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  // Get network graph
  const getNetworkGraph = useCallback(async (cityId: string) => {
    try {
      const response = await fetch(`/api/digital-twin?cityId=${cityId}&type=network`);
      if (!response.ok) throw new Error('Failed to fetch network graph');
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  // Get city comparison
  const getCityComparison = useCallback(async () => {
    try {
      const response = await fetch('/api/digital-twin?type=comparison');
      if (!response.ok) throw new Error('Failed to fetch city comparison');
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  // Get resource recommendations
  const getResourceRecommendations = useCallback(async (cityId: string) => {
    try {
      const response = await fetch(`/api/digital-twin?cityId=${cityId}&type=recommendations`);
      if (!response.ok) throw new Error('Failed to fetch resource recommendations');
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  // Start simulation
  const startSimulation = useCallback(async (parameters: SimulationParameters) => {
    try {
      const response = await fetch('/api/digital-twin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'startSimulation', ...parameters }),
      });
      if (!response.ok) throw new Error('Failed to start simulation');
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  // Search
  const search = useCallback(async (query: DigitalTwinSearch) => {
    try {
      const response = await fetch('/api/digital-twin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', ...query }),
      });
      if (!response.ok) throw new Error('Failed to search');
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  // Subscribe to digital twin updates
  useEffect(() => {
    if (!cityId || !isConnected) return;

    const handleUpdate = (data: any) => {
      setState(prev => ({ ...prev, ...data }));
    };

    subscribe(SERVER_EVENTS.DIGITAL_TWIN_UPDATE, handleUpdate);
    subscribe(SERVER_EVENTS.CITY_UPDATE, handleUpdate);
    subscribe(SERVER_EVENTS.CITY_HEALTH_UPDATE, handleUpdate);
    subscribe(SERVER_EVENTS.NETWORK_GRAPH_UPDATE, handleUpdate);
    subscribe(SERVER_EVENTS.RESOURCE_UPDATE, handleUpdate);
    subscribe(SERVER_EVENTS.FLEET_UPDATE, handleUpdate);
    subscribe(SERVER_EVENTS.RECOMMENDATION_UPDATE, handleUpdate);

    // Join digital twin room
    emit(CLIENT_EVENTS.SUBSCRIBE_DIGITAL_TWIN, { cityId });

    return () => {
      unsubscribe(SERVER_EVENTS.DIGITAL_TWIN_UPDATE, handleUpdate);
      unsubscribe(SERVER_EVENTS.CITY_UPDATE, handleUpdate);
      unsubscribe(SERVER_EVENTS.CITY_HEALTH_UPDATE, handleUpdate);
      unsubscribe(SERVER_EVENTS.NETWORK_GRAPH_UPDATE, handleUpdate);
      unsubscribe(SERVER_EVENTS.RESOURCE_UPDATE, handleUpdate);
      unsubscribe(SERVER_EVENTS.FLEET_UPDATE, handleUpdate);
      unsubscribe(SERVER_EVENTS.RECOMMENDATION_UPDATE, handleUpdate);
      emit(CLIENT_EVENTS.UNSUBSCRIBE_DIGITAL_TWIN, { cityId });
    };
  }, [cityId, isConnected, subscribe, unsubscribe, emit]);

  // Initial fetch
  useEffect(() => {
    if (cityId) {
      fetchState(cityId);
    }
  }, [cityId, fetchState]);

  return {
    state,
    loading,
    error,
    fetchState,
    refreshState,
    getCityHealth,
    getNetworkGraph,
    getCityComparison,
    getResourceRecommendations,
    startSimulation,
    search,
    isConnected,
  };
}

/**
 * City hook for city operations
 */
export function useCities() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/cities');
      if (!response.ok) throw new Error('Failed to fetch cities');
      const data = await response.json();
      setCities(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCity = useCallback(async (data: Partial<City>) => {
    try {
      const response = await fetch('/api/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create city');
      const newCity = await response.json();
      setCities(prev => [...prev, newCity]);
      return newCity;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const updateCity = useCallback(async (id: string, data: Partial<City>) => {
    try {
      const response = await fetch(`/api/cities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update city');
      const updatedCity = await response.json();
      setCities(prev => prev.map(c => c._id === id ? updatedCity : c));
      return updatedCity;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const deleteCity = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/cities/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete city');
      setCities(prev => prev.filter(c => c._id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  return {
    cities,
    loading,
    error,
    fetchCities,
    createCity,
    updateCity,
    deleteCity,
  };
}

/**
 * Simulation hook for simulation operations
 */
export function useSimulation() {
  const [simulations, setSimulations] = useState<SimulationState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { subscribe, unsubscribe, emit } = useRealtime();

  const fetchSimulations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/digital-twin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getActiveSimulations' }),
      });
      if (!response.ok) throw new Error('Failed to fetch simulations');
      const data = await response.json();
      setSimulations(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const startSimulation = useCallback(async (parameters: SimulationParameters) => {
    try {
      const response = await fetch('/api/digital-twin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'startSimulation', ...parameters }),
      });
      if (!response.ok) throw new Error('Failed to start simulation');
      const simulation = await response.json();
      setSimulations(prev => [...prev, simulation]);
      
      // Subscribe to simulation updates
      emit(CLIENT_EVENTS.SUBSCRIBE_SIMULATION, { simulationId: simulation.id });
      
      return simulation;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [emit]);

  const stopSimulation = useCallback(async (simulationId: string) => {
    try {
      const response = await fetch(`/api/digital-twin/${simulationId}?type=simulation`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to stop simulation');
      setSimulations(prev => prev.map(s => 
        s.id === simulationId ? { ...s, status: 'completed' as const } : s
      ));
      
      emit(CLIENT_EVENTS.UNSUBSCRIBE_SIMULATION, { simulationId });
      
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [emit]);

  // Subscribe to simulation updates
  useEffect(() => {
    const handleSimulationUpdate = (data: any) => {
      setSimulations(prev => prev.map(s => 
        s.id === data.simulationId ? { ...s, ...data } : s
      ));
    };

    subscribe(SERVER_EVENTS.SIMULATION_UPDATE, handleSimulationUpdate);

    return () => {
      unsubscribe(SERVER_EVENTS.SIMULATION_UPDATE, handleSimulationUpdate);
    };
  }, [subscribe, unsubscribe]);

  return {
    simulations,
    loading,
    error,
    fetchSimulations,
    startSimulation,
    stopSimulation,
  };
}
