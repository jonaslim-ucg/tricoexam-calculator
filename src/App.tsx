import { useState } from 'react';
import Dashboard from './components/Dashboard';
import BundleSimulator from './components/BundleSimulator';
import PlanFeaturesManager from './components/PlanFeaturesManager';

function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'simulator' | 'plan-management'>('dashboard');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  if (currentPage === 'simulator' && selectedScenarioId) {
    return (
      <BundleSimulator
        scenarioId={selectedScenarioId}
        onBack={() => setCurrentPage('dashboard')}
      />
    );
  }

  if (currentPage === 'plan-management') {
    return (
      <PlanFeaturesManager onBack={() => setCurrentPage('dashboard')} />
    );
  }

  return (
    <Dashboard
      onSimulateClick={(scenarioId: string) => {
        setSelectedScenarioId(scenarioId);
        setCurrentPage('simulator');
      }}
    />
  );
}

export default App;
