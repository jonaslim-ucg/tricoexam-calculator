import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { ForecastScenario, PricingPlan, AddOnFeature, OperatingCost, MarketingCost, TechSupportRevenue } from '../types/forecast';

export function useForecastData(scenarioId: string | null) {
  const [scenario, setScenario] = useState<ForecastScenario | null>(null);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [addOnFeatures, setAddOnFeatures] = useState<AddOnFeature[]>([]);
  const [operatingCosts, setOperatingCosts] = useState<OperatingCost[]>([]);
  const [marketingCosts, setMarketingCosts] = useState<MarketingCost[]>([]);
  const [techSupportRevenue, setTechSupportRevenue] = useState<TechSupportRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!scenarioId) {
      setLoading(false);
      return;
    }
    loadData();
  }, [scenarioId]);

  async function loadData() {
    try {
      setLoading(true);

      const [scenarioRes, plansRes, featuresRes, costsRes, marketingRes, techSupportRes] = await Promise.all([
        supabase.from('forecast_scenarios').select('*').eq('id', scenarioId).maybeSingle(),
        supabase.from('pricing_plans').select('*').eq('scenario_id', scenarioId).order('display_order'),
        supabase.from('add_on_features').select('*').eq('scenario_id', scenarioId),
        supabase.from('operating_costs').select('*').eq('scenario_id', scenarioId),
        supabase.from('marketing_costs').select('*').eq('scenario_id', scenarioId),
        supabase.from('tech_support_revenue').select('*').eq('scenario_id', scenarioId),
      ]);

      if (scenarioRes.data) setScenario(scenarioRes.data);
      if (plansRes.data) setPricingPlans(plansRes.data);
      if (featuresRes.data) setAddOnFeatures(featuresRes.data);
      if (costsRes.data) setOperatingCosts(costsRes.data);
      if (marketingRes.data) setMarketingCosts(marketingRes.data);
      if (techSupportRes.data) setTechSupportRevenue(techSupportRes.data);
    } catch (error) {
      console.error('Error loading forecast data:', error);
    } finally {
      setLoading(false);
    }
  }

  return {
    scenario,
    pricingPlans,
    addOnFeatures,
    operatingCosts,
    marketingCosts,
    techSupportRevenue,
    loading,
    reload: loadData,
  };
}
