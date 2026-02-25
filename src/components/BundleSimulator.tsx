import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Play, Package, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useForecastData } from '../hooks/useForecastData';
import { calculateMetrics } from '../utils/calculations';
import { calculateSimulation } from '../utils/simulationCalculations';
import BundleConfigSection from './BundleConfigSection';
import SimulationComparison from './SimulationComparison';
import AffiliateCommissionCalculator from './AffiliateCommissionCalculator';
import type { SimulationResult } from '../types/forecast';

interface BundleSimulatorProps {
  scenarioId: string;
  onBack: () => void;
}

type TabType = 'bundling' | 'commissions';

export default function BundleSimulator({ scenarioId, onBack }: BundleSimulatorProps) {
  const { scenario, pricingPlans, addOnFeatures, operatingCosts, marketingCosts, techSupportRevenue, loading } =
    useForecastData(scenarioId);

  const [activeTab, setActiveTab] = useState<TabType>('bundling');
  const [bundleConfig, setBundleConfig] = useState<Record<string, string[]>>({});
  const [adjustedPrices, setAdjustedPrices] = useState<Record<string, number>>({});
  const [adjustedCustomers, setAdjustedCustomers] = useState<Record<string, number>>({});
  const [simulationName, setSimulationName] = useState('New Bundle Simulation');
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (pricingPlans.length > 0) {
      const initialConfig: Record<string, string[]> = {};
      const initialPrices: Record<string, number> = {};
      const initialCustomers: Record<string, number> = {};
      pricingPlans.forEach((plan) => {
        initialConfig[plan.id] = [];
        initialPrices[plan.id] = plan.price;
        initialCustomers[plan.id] = plan.customers;
      });
      setBundleConfig(initialConfig);
      setAdjustedPrices(initialPrices);
      setAdjustedCustomers(initialCustomers);
    }
  }, [pricingPlans]);

  function runSimulation() {
    if (!scenario) return;

    const result = calculateSimulation(
      scenario.capital_expenditure,
      pricingPlans,
      addOnFeatures,
      operatingCosts,
      marketingCosts,
      bundleConfig,
      adjustedPrices,
      adjustedCustomers,
      techSupportRevenue,
      [],
      [],
      { additional_provider_price: 0, additional_provider_quantity: 0, automation_price_per_1000: 0, automation_overage_thousands: 0 }
    );

    setSimulationResult(result);
    setShowComparison(true);
  }

  async function saveSimulation() {
    if (!scenario) return;

    const { error } = await supabase.from('bundle_simulations').insert({
      scenario_id: scenario.id,
      name: simulationName,
      description: `Bundle simulation created on ${new Date().toLocaleDateString()}`,
      bundle_config: bundleConfig,
      adjusted_plan_prices: adjustedPrices,
      adjusted_plan_customers: adjustedCustomers,
    });

    if (error) {
      console.error('Error saving simulation:', error);
    } else {
      alert('Simulation saved successfully!');
    }
  }

  const currentCalculations = scenario
    ? calculateMetrics(
        scenario.capital_expenditure,
        pricingPlans,
        addOnFeatures,
        operatingCosts,
        marketingCosts,
        techSupportRevenue,
        [],
        [],
        { additional_provider_price: 0, additional_provider_quantity: 0, automation_price_per_1000: 0, automation_overage_thousands: 0 },
        []
      )
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <p className="text-slate-700 font-medium mb-2">Scenario not found or failed to load</p>
          <p className="text-sm text-slate-500 mb-4">
            Check your connection and that the scenario exists. You can go back and try another scenario.
          </p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Simulation Tools</h1>
              <p className="text-sm text-slate-600">
                Test bundling strategies and analyze affiliate commissions
              </p>
            </div>

            {activeTab === 'bundling' && (
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={simulationName}
                  onChange={(e) => setSimulationName(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Simulation name"
                />
                <button
                  onClick={saveSimulation}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={runSimulation}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Run Simulation
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-6 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('bundling')}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'bundling'
                  ? 'text-slate-900 border-slate-900'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              <Package className="w-4 h-4" />
              Bundle Configuration
            </button>
            <button
              onClick={() => setActiveTab('commissions')}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'commissions'
                  ? 'text-slate-900 border-slate-900'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Affiliate Commissions
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'bundling' && (
          <>
            <BundleConfigSection
              pricingPlans={pricingPlans}
              addOnFeatures={addOnFeatures}
              bundleConfig={bundleConfig}
              adjustedPrices={adjustedPrices}
              adjustedCustomers={adjustedCustomers}
              onBundleConfigChange={setBundleConfig}
              onPriceChange={setAdjustedPrices}
              onCustomersChange={setAdjustedCustomers}
            />

            {showComparison && simulationResult && currentCalculations && (
              <SimulationComparison
                currentCalculations={currentCalculations}
                simulationResult={simulationResult}
                pricingPlans={pricingPlans}
                adjustedPrices={adjustedPrices}
              />
            )}
          </>
        )}

        {activeTab === 'commissions' && (
          <AffiliateCommissionCalculator
            pricingPlans={pricingPlans}
            addOnFeatures={addOnFeatures}
          />
        )}
      </div>
    </div>
  );
}
