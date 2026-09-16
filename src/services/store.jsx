import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { engine } from './simulationEngine';

const SimulationContext = createContext(null);

export function SimulationProvider({ children }) {
  useEffect(() => {
    engine.start();
    return () => engine.stop();
  }, []);

  const state = useSyncExternalStore(
    (listener) => engine.subscribe(listener),
    () => engine.getState(),
  );

  const value = {
    ...state,
    acknowledgeIncident: (id) => engine.acknowledgeIncident(id),
    resolveManually: (id) => engine.resolveManually(id),
  };

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulation must be used within a SimulationProvider');
  return ctx;
}
