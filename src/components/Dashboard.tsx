import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useForecastData } from '../hooks/useForecastData';
import { calculateMetrics } from '../utils/calculations';
import DashboardHeader from './DashboardHeader';
import RevenueSection from './RevenueSection';
import OnboardingServicesCard from './OnboardingServicesCard';
import OperatingCostsSection from './OperatingCostsSection';
import MarketingCostsSection from './MarketingCostsSection';
import SummarySection from './SummarySection';
import ChartsSection from './ChartsSection';
import type { ForecastScenario, TechSupportRow, PlanAddonRow, SurgicalTierRow, SurgicalTierKey, SurgicalExtras, OnboardingRow } from '../types/forecast';

interface DashboardProps {
  onSimulateClick: (scenarioId: string) => void;
}

export default function Dashboard({ onSimulateClick }: DashboardProps) {
  const [scenarios, setScenarios] = useState<ForecastScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const {
    scenario,
    pricingPlans,
    addOnFeatures,
    operatingCosts,
    marketingCosts,
    techSupportRevenue,
    planAddonRows: loadedPlanAddonRows,
    surgicalTierRows: loadedSurgicalTierRows,
    surgicalExtras: loadedSurgicalExtras,
    onboardingRows: loadedOnboardingRows,
    loading,
    reload,
  } = useForecastData(selectedScenarioId);

  function defaultTechSupportForPlan(planName: string) {
    const n = planName.toLowerCase();
    if (n.includes('basic')) return { priority: { tier_price: 39, seat_addon_price: 10 }, urgent: { tier_price: 99, seat_addon_price: 25 } };
    if (n.includes('professional') || n.includes('pro')) return { priority: { tier_price: 79, seat_addon_price: 10 }, urgent: { tier_price: 199, seat_addon_price: 25 } };
    return { priority: { tier_price: 149, seat_addon_price: 8 }, urgent: { tier_price: 349, seat_addon_price: 20 } };
  }

  function buildTechSupportRows(plans: { id: string; name: string }[]): TechSupportRow[] {
    const planList = plans.length > 0 ? plans : [
      { id: 'sample-basic', name: 'Basic' },
      { id: 'sample-professional', name: 'Professional' },
      { id: 'sample-enterprise', name: 'Enterprise' },
    ];
    const rows: TechSupportRow[] = [];
    for (const p of planList) {
      const def = defaultTechSupportForPlan(p.name);
      const planName = p.name.replace(/\s+Plan$/i, '') || p.name;
      rows.push(
        { plan_id: p.id, plan_name: planName, tier: 'Priority', customers: 10, extra_seats: 0, ...def.priority },
        { plan_id: p.id, plan_name: planName, tier: 'Urgent', customers: 10, extra_seats: 0, ...def.urgent },
      );
    }
    return rows;
  }

  const [techSupportRows, setTechSupportRows] = useState<TechSupportRow[]>(() => buildTechSupportRows([]));

  function buildPlanAddonRows(plans: { id: string; name: string }[]): PlanAddonRow[] {
    const planList = plans.length > 0 ? plans : [
      { id: 'sample-basic', name: 'Basic' },
      { id: 'sample-professional', name: 'Professional' },
      { id: 'sample-enterprise', name: 'Enterprise' },
    ];
    const rows: PlanAddonRow[] = [];
    for (const p of planList) {
      const planName = p.name.replace(/\s+Plan$/i, '') || p.name;
      const n = p.name.toLowerCase();
      const isBasic = n.includes('basic') && !n.includes('professional') && !n.includes('enterprise');
      rows.push({ plan_id: p.id, plan_name: planName, addon_type: 'additional_staff', price: 35, quantity: 10 });
      if (!isBasic) {
        rows.push({ plan_id: p.id, plan_name: planName, addon_type: 'additional_provider', price: 75, quantity: 10 });
      }
    }
    return rows;
  }

  const [planAddonRows, setPlanAddonRows] = useState<PlanAddonRow[]>(() => buildPlanAddonRows([]));

  const SURGICAL_TIERS: { key: SurgicalTierKey; addon: number }[] = [
    { key: '0-10', addon: 0 },
    { key: '11-25', addon: 150 },
    { key: '26-50', addon: 300 },
    { key: '51-100', addon: 600 },
    { key: '100+', addon: 0 },
  ];

  function buildSurgicalTierRows(plans: { id: string; name: string }[]): SurgicalTierRow[] {
    const planList = plans.length > 0 ? plans : [
      { id: 'sample-basic', name: 'Basic' },
      { id: 'sample-professional', name: 'Professional' },
      { id: 'sample-enterprise', name: 'Enterprise' },
    ];
    const rows: SurgicalTierRow[] = [];
    for (const p of planList) {
      const n = p.name.toLowerCase();
      const base = n.includes('enterprise') ? 349 : n.includes('professional') || n.includes('pro') ? 219 : 129;
      const planName = p.name.replace(/\s+Plan$/i, '') || p.name;
      for (const { key, addon } of SURGICAL_TIERS) {
        rows.push({ plan_id: p.id, plan_name: planName, base_price: base, tier_key: key, addon_price: addon, customers: 10 });
      }
    }
    return rows;
  }

  const [surgicalTierRows, setSurgicalTierRows] = useState<SurgicalTierRow[]>(() => buildSurgicalTierRows([]));
  const [surgicalExtras, setSurgicalExtras] = useState<SurgicalExtras>({
    additional_provider_price: 75,
    additional_provider_quantity: 0,
    automation_price_per_1000: 25,
    automation_overage_thousands: 0,
  });

  function buildOnboardingRows(plans: { id: string; name: string }[]): OnboardingRow[] {
    const planList = plans.length > 0 ? plans : [
      { id: 'sample-basic', name: 'Basic' },
      { id: 'sample-professional', name: 'Professional' },
      { id: 'sample-enterprise', name: 'Enterprise' },
    ];
    const rows: OnboardingRow[] = [];
    const sessionPrices = { basic: 299, professional: 399, enterprise: 499 };
    const bundlePrices = { basic: 799, professional: 1049, enterprise: 1299 };
    for (const p of planList) {
      const n = p.name.toLowerCase();
      const planKey = n.includes('enterprise') ? 'enterprise' : n.includes('professional') || n.includes('pro') ? 'professional' : 'basic';
      const planName = p.name.replace(/\s+Plan$/i, '') || p.name;
      rows.push({ plan_id: p.id, plan_name: planName, upgrade_type: 'session', price: sessionPrices[planKey], customers: 10 });
      rows.push({ plan_id: p.id, plan_name: planName, upgrade_type: 'bundle', price: bundlePrices[planKey], customers: 10 });
    }
    return rows;
  }

  const [onboardingRows, setOnboardingRows] = useState<OnboardingRow[]>(() => buildOnboardingRows([]));

  useEffect(() => {
    loadScenarios();
  }, []);

  useEffect(() => {
    const built = buildTechSupportRows(pricingPlans);
    if (techSupportRevenue.length > 0) {
      const merged = built.map((row) => {
        const fromApi = techSupportRevenue.find((r) => r.plan_id === row.plan_id && r.tier === row.tier);
        if (!fromApi) return row;
        return { ...row, tier_price: fromApi.tier_price, customers: fromApi.customers, seat_addon_price: fromApi.seat_addon_price, extra_seats: fromApi.extra_seats };
      });
      setTechSupportRows(merged);
    } else {
      setTechSupportRows(built);
    }
  }, [pricingPlans, techSupportRevenue]);

  useEffect(() => {
    if (loadedPlanAddonRows.length > 0) {
      setPlanAddonRows(loadedPlanAddonRows);
    } else {
      setPlanAddonRows(buildPlanAddonRows(pricingPlans));
    }
  }, [pricingPlans, loadedPlanAddonRows]);

  useEffect(() => {
    if (loadedSurgicalTierRows.length > 0) {
      setSurgicalTierRows(loadedSurgicalTierRows);
    } else {
      setSurgicalTierRows(buildSurgicalTierRows(pricingPlans));
    }
  }, [pricingPlans, loadedSurgicalTierRows]);

  useEffect(() => {
    if (loadedSurgicalExtras != null) {
      setSurgicalExtras(loadedSurgicalExtras);
    } else {
      setSurgicalExtras({
        additional_provider_price: 75,
        additional_provider_quantity: 0,
        automation_price_per_1000: 25,
        automation_overage_thousands: 0,
      });
    }
  }, [loadedSurgicalExtras]);

  useEffect(() => {
    if (loadedOnboardingRows.length > 0) {
      setOnboardingRows(loadedOnboardingRows);
    } else {
      setOnboardingRows(buildOnboardingRows(pricingPlans));
    }
  }, [pricingPlans, loadedOnboardingRows]);

  async function persistPlanAddonRows(rows: PlanAddonRow[]) {
    if (!selectedScenarioId) return;
    try {
      await supabase.from('plan_addon_rows').delete().eq('scenario_id', selectedScenarioId);
      if (rows.length) {
        await supabase.from('plan_addon_rows').insert(
          rows.map((r) => ({
            scenario_id: selectedScenarioId,
            plan_id: r.plan_id,
            plan_name: r.plan_name,
            addon_type: r.addon_type,
            price: r.price,
            quantity: r.quantity,
          }))
        );
      }
      reload();
    } catch (e) {
      console.warn('Persist plan_addon_rows failed (table may not exist yet):', e);
    }
  }

  async function persistSurgicalTierRows(rows: SurgicalTierRow[]) {
    if (!selectedScenarioId) return;
    try {
      await supabase.from('surgical_tier_rows').delete().eq('scenario_id', selectedScenarioId);
      if (rows.length) {
        await supabase.from('surgical_tier_rows').insert(
          rows.map((r) => ({
            scenario_id: selectedScenarioId,
            plan_id: r.plan_id,
            plan_name: r.plan_name,
            base_price: r.base_price,
            tier_key: r.tier_key,
            addon_price: r.addon_price,
            customers: r.customers,
          }))
        );
      }
      reload();
    } catch (e) {
      console.warn('Persist surgical_tier_rows failed (table may not exist yet):', e);
    }
  }

  async function persistSurgicalExtras(extras: SurgicalExtras) {
    if (!selectedScenarioId) return;
    try {
      await supabase.from('surgical_extras').upsert(
        {
          scenario_id: selectedScenarioId,
          additional_provider_price: extras.additional_provider_price,
          additional_provider_quantity: extras.additional_provider_quantity,
          automation_price_per_1000: extras.automation_price_per_1000,
          automation_overage_thousands: extras.automation_overage_thousands,
        },
        { onConflict: 'scenario_id' }
      );
      reload();
    } catch (e) {
      console.warn('Persist surgical_extras failed (table may not exist yet):', e);
    }
  }

  async function persistOnboardingRows(rows: OnboardingRow[]) {
    if (!selectedScenarioId) return;
    try {
      await supabase.from('onboarding_rows').delete().eq('scenario_id', selectedScenarioId);
      if (rows.length) {
        await supabase.from('onboarding_rows').insert(
          rows.map((r) => ({
            scenario_id: selectedScenarioId,
            plan_id: r.plan_id,
            plan_name: r.plan_name,
            upgrade_type: r.upgrade_type,
            price: r.price,
            customers: r.customers,
            delivery_cost: r.delivery_cost ?? null,
          }))
        );
      }
      reload();
    } catch (e) {
      console.warn('Persist onboarding_rows failed (table may not exist yet):', e);
    }
  }

  async function loadScenarios() {
    const { data } = await supabase
      .from('forecast_scenarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setScenarios(data);
      setSelectedScenarioId((prev) => {
        const valid = prev && data.some((s) => s.id === prev);
        return valid ? prev : data[0].id;
      });
    }
  }

  async function createNewScenario() {
    const { data, error } = await supabase
      .from('forecast_scenarios')
      .insert({
        name: `Scenario ${scenarios.length + 1}`,
        capital_expenditure: 60000,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating scenario:', error);
      return;
    }

    if (data) {
      await initializeScenarioData(data.id);
      await loadScenarios();
      setSelectedScenarioId(data.id);
    }
  }

  async function initializeScenarioData(scenarioId: string) {
    const { data: insertedPlans } = await supabase
      .from('pricing_plans')
      .insert([
        { scenario_id: scenarioId, name: 'Basic Plan', price: 99, customers: 20, display_order: 1 },
        { scenario_id: scenarioId, name: 'Professional Plan', price: 382, customers: 20, display_order: 2 },
        { scenario_id: scenarioId, name: 'Enterprise Plan', price: 655, customers: 10, display_order: 3 },
      ])
      .select('id, name');

    const defaultTechSupport = (planName: string) => {
      const n = planName.toLowerCase();
      if (n.includes('basic')) return { priority: { tier_price: 39, seat_addon_price: 10 }, urgent: { tier_price: 99, seat_addon_price: 25 } };
      if (n.includes('professional') || n.includes('pro')) return { priority: { tier_price: 79, seat_addon_price: 10 }, urgent: { tier_price: 199, seat_addon_price: 25 } };
      return { priority: { tier_price: 149, seat_addon_price: 8 }, urgent: { tier_price: 349, seat_addon_price: 20 } };
    };

    if (insertedPlans?.length) {
      const techRows: { scenario_id: string; plan_id: string; tier: string; tier_price: number; customers: number; seat_addon_price: number; extra_seats: number }[] = [];
      for (const p of insertedPlans) {
        const def = defaultTechSupport(p.name);
        techRows.push(
          { scenario_id: scenarioId, plan_id: p.id, tier: 'Priority', customers: 10, extra_seats: 0, ...def.priority },
          { scenario_id: scenarioId, plan_id: p.id, tier: 'Urgent', customers: 10, extra_seats: 0, ...def.urgent },
        );
      }
      await supabase.from('tech_support_revenue').insert(techRows);

      const planList = insertedPlans.map((p) => ({ id: p.id, name: p.name }));
      const planAddonDefaults = buildPlanAddonRows(planList);
      const surgicalTierDefaults = buildSurgicalTierRows(planList);
      const onboardingDefaults = buildOnboardingRows(planList);

      await Promise.allSettled([
        planAddonDefaults.length
          ? supabase.from('plan_addon_rows').insert(
              planAddonDefaults.map((r) => ({
                scenario_id: scenarioId,
                plan_id: r.plan_id,
                plan_name: r.plan_name,
                addon_type: r.addon_type,
                price: r.price,
                quantity: r.quantity,
              }))
            )
          : Promise.resolve(),
        surgicalTierDefaults.length
          ? supabase.from('surgical_tier_rows').insert(
              surgicalTierDefaults.map((r) => ({
                scenario_id: scenarioId,
                plan_id: r.plan_id,
                plan_name: r.plan_name,
                base_price: r.base_price,
                tier_key: r.tier_key,
                addon_price: r.addon_price,
                customers: r.customers,
              }))
            )
          : Promise.resolve(),
        supabase.from('surgical_extras').insert({
          scenario_id: scenarioId,
          additional_provider_price: 75,
          additional_provider_quantity: 0,
          automation_price_per_1000: 25,
          automation_overage_thousands: 0,
        }),
        onboardingDefaults.length
          ? supabase.from('onboarding_rows').insert(
              onboardingDefaults.map((r) => ({
                scenario_id: scenarioId,
                plan_id: r.plan_id,
                plan_name: r.plan_name,
                upgrade_type: r.upgrade_type,
                price: r.price,
                customers: r.customers,
                delivery_cost: r.delivery_cost ?? null,
              }))
            )
          : Promise.resolve(),
      ]);
    }

    await Promise.all([
      supabase.from('add_on_features').insert([
        { scenario_id: scenarioId, name: 'AI Scalp Analysis', price: 149, customers: 10, is_revenue: true, operating_cost_per_customer: 6 },
        { scenario_id: scenarioId, name: 'Appointment Scheduling', price: 79, customers: 10, is_revenue: true, operating_cost_per_customer: 0 },
        { scenario_id: scenarioId, name: 'Quotation Management', price: 79, customers: 10, is_revenue: true, operating_cost_per_customer: 0 },
        { scenario_id: scenarioId, name: 'Client Portal', price: 99, customers: 10, is_revenue: true, operating_cost_per_customer: 10 },
        { scenario_id: scenarioId, name: 'Extra Storage (5GB pack)', price: 20, customers: 10, is_revenue: true, operating_cost_per_customer: 0 },
        { scenario_id: scenarioId, name: 'Image Scans (5k pack)', price: 59, customers: 10, is_revenue: true, operating_cost_per_customer: 0 },
        { scenario_id: scenarioId, name: 'Surgical Services Pack', price: 129, customers: 10, is_revenue: true, operating_cost_per_customer: 0 },
      ]),
      supabase.from('operating_costs').insert([
        { scenario_id: scenarioId, name: 'All Modules + Features + Maintenance', amount: 4000, is_fixed: true },
        { scenario_id: scenarioId, name: 'Server Costs', amount: 0, is_fixed: false, unit_price: 10, units: 50 },
      ]),
      supabase.from('marketing_costs').insert([
        { scenario_id: scenarioId, name: 'Advertisements, discounts, etc', rate: 0, price_plan: 'Basic', customers: 20 },
        { scenario_id: scenarioId, name: 'Field Agent Subscription Commissions', rate: 8, price_plan: 'Basic', customers: 20 },
        { scenario_id: scenarioId, name: 'Regional Manager Subscription Commissions', rate: 4, price_plan: 'Basic', customers: 20 },
        { scenario_id: scenarioId, name: 'Country Manager Subscription Commissions', rate: 4, price_plan: 'Basic', customers: 20 },
        { scenario_id: scenarioId, name: 'Affiliate Subscription Commissions', rate: 10, price_plan: 'Basic', customers: 20 },
      ]),
    ]);
  }

  function updateTechSupportRow(planId: string, tier: 'Priority' | 'Urgent', field: keyof Pick<TechSupportRow, 'tier_price' | 'customers' | 'seat_addon_price' | 'extra_seats'>, value: number) {
    setTechSupportRows((prev) =>
      prev.map((row) => (row.plan_id === planId && row.tier === tier ? { ...row, [field]: value } : row))
    );
  }

  function updatePlanAddonRow(planId: string, addonType: 'additional_staff' | 'additional_provider', field: keyof Pick<PlanAddonRow, 'price' | 'quantity'>, value: number) {
    setPlanAddonRows((prev) => {
      const next = prev.map((row) => (row.plan_id === planId && row.addon_type === addonType ? { ...row, [field]: value } : row));
      persistPlanAddonRows(next);
      return next;
    });
  }

  function updateSurgicalTierRow(planId: string, tierKey: SurgicalTierKey, field: keyof Pick<SurgicalTierRow, 'base_price' | 'addon_price' | 'customers'>, value: number) {
    setSurgicalTierRows((prev) => {
      const next = prev.map((row) => (row.plan_id === planId && row.tier_key === tierKey ? { ...row, [field]: value } : row));
      persistSurgicalTierRows(next);
      return next;
    });
  }

  function updateSurgicalBasePrice(planId: string, value: number) {
    setSurgicalTierRows((prev) => {
      const next = prev.map((row) => (row.plan_id === planId ? { ...row, base_price: value } : row));
      persistSurgicalTierRows(next);
      return next;
    });
  }

  function updateSurgicalExtras(field: keyof SurgicalExtras, value: number) {
    setSurgicalExtras((prev) => {
      const next = { ...prev, [field]: value };
      persistSurgicalExtras(next);
      return next;
    });
  }

  function updateOnboardingRow(
    planId: string,
    upgradeType: 'session' | 'bundle',
    field: keyof Pick<OnboardingRow, 'price' | 'customers' | 'plan_name' | 'delivery_cost'>,
    value: number | string
  ) {
    setOnboardingRows((prev) => {
      const next = prev.map((row) =>
        row.plan_id === planId && row.upgrade_type === upgradeType ? { ...row, [field]: value } : row
      );
      persistOnboardingRows(next);
      return next;
    });
  }

  function deleteOnboardingRow(planId: string, upgradeType: 'session' | 'bundle') {
    setOnboardingRows((prev) => {
      const next = prev.filter((row) => !(row.plan_id === planId && row.upgrade_type === upgradeType));
      persistOnboardingRows(next);
      return next;
    });
  }

  function addOnboardingSession() {
    setOnboardingRows((prev) => {
      const next = [
        ...prev,
        {
          plan_id: `custom-session-${Date.now()}`,
          plan_name: 'New Session',
          upgrade_type: 'session' as const,
          price: 299,
          customers: 0,
          delivery_cost: 125,
        },
      ];
      persistOnboardingRows(next);
      return next;
    });
  }

  function addOnboardingBundle() {
    setOnboardingRows((prev) => {
      const next = [
        ...prev,
        {
          plan_id: `custom-bundle-${Date.now()}`,
          plan_name: 'New Bundle',
          upgrade_type: 'bundle' as const,
          price: 799,
          customers: 0,
          delivery_cost: 375,
        },
      ];
      persistOnboardingRows(next);
      return next;
    });
  }

  const calculations = scenario
    ? calculateMetrics(
        scenario.capital_expenditure,
        pricingPlans,
        addOnFeatures,
        operatingCosts,
        marketingCosts,
        techSupportRows,
        planAddonRows,
        surgicalTierRows,
        surgicalExtras,
        onboardingRows
      )
    : null;

  if (loading && !scenario) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (scenarios.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">No Scenarios Found</h2>
          <button
            onClick={createNewScenario}
            className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Create First Scenario
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader
        scenarios={scenarios}
        selectedScenarioId={selectedScenarioId}
        onScenarioChange={setSelectedScenarioId}
        onCreateScenario={createNewScenario}
        onSimulateClick={() => selectedScenarioId && onSimulateClick(selectedScenarioId)}
        scenario={scenario}
      />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {calculations && (
          <SummarySection
            calculations={calculations}
            onboardingRows={onboardingRows}
          />
        )}

        <RevenueSection
          scenarioId={selectedScenarioId!}
          pricingPlans={pricingPlans}
          addOnFeatures={addOnFeatures}
          techSupportRows={techSupportRows}
          onUpdateTechSupportRow={updateTechSupportRow}
          planAddonRows={planAddonRows}
          onUpdatePlanAddonRow={updatePlanAddonRow}
          surgicalTierRows={surgicalTierRows}
          onUpdateSurgicalTierRow={updateSurgicalTierRow}
          onUpdateSurgicalBasePrice={updateSurgicalBasePrice}
          surgicalExtras={surgicalExtras}
          onUpdateSurgicalExtras={updateSurgicalExtras}
          onboardingRows={onboardingRows}
          onUpdate={reload}
        />

        <OnboardingServicesCard
          onboardingRows={onboardingRows}
          onUpdateOnboardingRow={updateOnboardingRow}
          onDeleteOnboardingRow={deleteOnboardingRow}
          onAddSession={addOnboardingSession}
          onAddBundle={addOnboardingBundle}
        />

        <OperatingCostsSection
          scenarioId={selectedScenarioId!}
          operatingCosts={operatingCosts}
          addOnFeatures={addOnFeatures}
          onUpdate={reload}
        />

        <MarketingCostsSection
          scenarioId={selectedScenarioId!}
          marketingCosts={marketingCosts}
          pricingPlans={pricingPlans}
          onUpdate={reload}
        />

        {calculations && (
          <ChartsSection
            calculations={calculations}
            pricingPlans={pricingPlans}
            addOnFeatures={addOnFeatures}
          />
        )}
      </div>
    </div>
  );
}
