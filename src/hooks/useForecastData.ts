import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type {
  ForecastScenario,
  PricingPlan,
  AddOnFeature,
  OperatingCost,
  MarketingCost,
  TechSupportRevenue,
  PlanAddonRow,
  SurgicalTierRow,
  SurgicalExtras,
  OnboardingRow,
} from '../types/forecast';

export function useForecastData(scenarioId: string | null) {
  const [scenario, setScenario] = useState<ForecastScenario | null>(null);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [addOnFeatures, setAddOnFeatures] = useState<AddOnFeature[]>([]);
  const [operatingCosts, setOperatingCosts] = useState<OperatingCost[]>([]);
  const [marketingCosts, setMarketingCosts] = useState<MarketingCost[]>([]);
  const [techSupportRevenue, setTechSupportRevenue] = useState<TechSupportRevenue[]>([]);
  const [planAddonRows, setPlanAddonRows] = useState<PlanAddonRow[]>([]);
  const [surgicalTierRows, setSurgicalTierRows] = useState<SurgicalTierRow[]>([]);
  const [surgicalExtras, setSurgicalExtras] = useState<SurgicalExtras | null>(null);
  const [onboardingRows, setOnboardingRows] = useState<OnboardingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!scenarioId) {
      setLoading(false);
      return;
    }
    loadData();
  }, [scenarioId]);

  async function loadData() {
    if (!scenarioId) return;
    try {
      setLoading(true);

      const core = await Promise.all([
        supabase.from('forecast_scenarios').select('*').eq('id', scenarioId).maybeSingle(),
        supabase.from('pricing_plans').select('*').eq('scenario_id', scenarioId).order('display_order'),
        supabase.from('add_on_features').select('*').eq('scenario_id', scenarioId),
        supabase.from('operating_costs').select('*').eq('scenario_id', scenarioId),
        supabase.from('marketing_costs').select('*').eq('scenario_id', scenarioId),
        supabase.from('tech_support_revenue').select('*').eq('scenario_id', scenarioId),
      ]);

      const [scenarioRes, plansRes, featuresRes, costsRes, marketingRes, techSupportRes] = core;
      if (scenarioRes.data) setScenario(scenarioRes.data);
      if (plansRes.data) setPricingPlans(plansRes.data);
      if (featuresRes.data) setAddOnFeatures(featuresRes.data);
      if (costsRes.data) setOperatingCosts(costsRes.data);
      if (marketingRes.data) setMarketingCosts(marketingRes.data);
      if (techSupportRes.data) setTechSupportRevenue(techSupportRes.data);

      const optional = await Promise.allSettled([
        supabase.from('plan_addon_rows').select('plan_id, plan_name, addon_type, price, quantity').eq('scenario_id', scenarioId),
        supabase.from('surgical_tier_rows').select('plan_id, plan_name, base_price, tier_key, addon_price, customers').eq('scenario_id', scenarioId),
        supabase.from('surgical_extras').select('*').eq('scenario_id', scenarioId).maybeSingle(),
        supabase.from('onboarding_rows').select('id, plan_id, plan_name, upgrade_type, price, customers, delivery_cost').eq('scenario_id', scenarioId),
      ]);

      const planAddonRes = optional[0].status === 'fulfilled' ? optional[0].value : null;
      const surgicalTierRes = optional[1].status === 'fulfilled' ? optional[1].value : null;
      const surgicalExtrasRes = optional[2].status === 'fulfilled' ? optional[2].value : null;
      const onboardingRes = optional[3].status === 'fulfilled' ? optional[3].value : null;

      if (planAddonRes?.data?.length) {
        setPlanAddonRows(
          planAddonRes.data.map((r: { plan_id: string; plan_name: string; addon_type: string; price: number; quantity: number }) => ({
            plan_id: r.plan_id,
            plan_name: r.plan_name,
            addon_type: r.addon_type as 'additional_staff' | 'additional_provider',
            price: Number(r.price),
            quantity: Number(r.quantity),
          }))
        );
      } else {
        setPlanAddonRows([]);
      }

      if (surgicalTierRes?.data?.length) {
        setSurgicalTierRows(
          surgicalTierRes.data.map((r: { plan_id: string; plan_name: string; base_price: number; tier_key: string; addon_price: number; customers: number }) => ({
            plan_id: r.plan_id,
            plan_name: r.plan_name,
            base_price: Number(r.base_price),
            tier_key: r.tier_key as SurgicalTierRow['tier_key'],
            addon_price: Number(r.addon_price),
            customers: Number(r.customers),
          }))
        );
      } else {
        setSurgicalTierRows([]);
      }

      if (surgicalExtrasRes?.data) {
        const e = surgicalExtrasRes.data;
        setSurgicalExtras({
          additional_provider_price: Number(e.additional_provider_price),
          additional_provider_quantity: Number(e.additional_provider_quantity),
          automation_price_per_1000: Number(e.automation_price_per_1000),
          automation_overage_thousands: Number(e.automation_overage_thousands),
        });
      } else {
        setSurgicalExtras(null);
      }

      if (onboardingRes?.data?.length) {
        setOnboardingRows(
          onboardingRes.data.map((r: { id?: string; plan_id: string; plan_name: string; upgrade_type: string; price: number; customers: number; delivery_cost?: number }) => ({
            id: r.id,
            plan_id: r.plan_id,
            plan_name: r.plan_name,
            upgrade_type: r.upgrade_type as 'session' | 'bundle',
            price: Number(r.price),
            customers: Number(r.customers),
            delivery_cost: r.delivery_cost != null ? Number(r.delivery_cost) : undefined,
          }))
        );
      } else {
        setOnboardingRows([]);
      }
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
    planAddonRows,
    surgicalTierRows,
    surgicalExtras,
    onboardingRows,
    loading,
    reload: loadData,
  };
}
