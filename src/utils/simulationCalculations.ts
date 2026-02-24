import type {
  PricingPlan,
  AddOnFeature,
  OperatingCost,
  MarketingCost,
  TechSupportRevenue,
  Calculations,
  SimulationResult,
} from '../types/forecast';
import { getPlanPriceByName } from './calculations';

/** Cost-only add-ons: no revenue, only cost (Extra Storage, Additional AI Image Packs) */
const COST_ONLY_ADDON_NAMES = ['Extra Storage (5GB pack)', 'Image Scans (5k pack)'];

function techSupportRowRevenue(row: TechSupportRevenue): number {
  return row.tier_price * row.customers + row.seat_addon_price * row.extra_seats;
}

export function calculateSimulation(
  capitalExpenditure: number,
  pricingPlans: PricingPlan[],
  addOnFeatures: AddOnFeature[],
  operatingCosts: OperatingCost[],
  marketingCosts: MarketingCost[],
  bundleConfig: Record<string, string[]>,
  adjustedPrices: Record<string, number>,
  adjustedCustomers: Record<string, number>,
  techSupportRevenue: TechSupportRevenue[] = [],
  planAddonRows: { price: number; quantity: number }[] = [],
  surgicalTierRows: { base_price: number; addon_price: number; customers: number }[] = [],
  surgicalExtras: { additional_provider_price: number; additional_provider_quantity: number; automation_price_per_1000: number; automation_overage_thousands: number } = { additional_provider_price: 0, additional_provider_quantity: 0, automation_price_per_1000: 0, automation_overage_thousands: 0 }
): SimulationResult {
  const bundledFeatures: Record<string, AddOnFeature[]> = {};
  const bundledFeatureIds = new Set<string>();

  Object.entries(bundleConfig).forEach(([planId, featureIds]) => {
    bundledFeatures[planId] = addOnFeatures.filter((f) => featureIds.includes(f.id));
    featureIds.forEach((id) => bundledFeatureIds.add(id));
  });

  const remainingAddOns = addOnFeatures.filter((f) => !bundledFeatureIds.has(f.id));

  const adjustedPlans = pricingPlans.map((plan) => ({
    ...plan,
    price: adjustedPrices[plan.id] !== undefined ? adjustedPrices[plan.id] : plan.price,
    customers: adjustedCustomers[plan.id] !== undefined ? adjustedCustomers[plan.id] : plan.customers,
  }));

  const surgicalRevenue =
    surgicalTierRows.reduce((sum, row) => sum + (row.base_price + row.addon_price) * row.customers, 0) +
    surgicalExtras.additional_provider_price * surgicalExtras.additional_provider_quantity +
    surgicalExtras.automation_price_per_1000 * surgicalExtras.automation_overage_thousands;

  const revenueAddOns = remainingAddOns.filter((f) => !COST_ONLY_ADDON_NAMES.includes(f.name));
  const monthlyRevenue =
    adjustedPlans.reduce((sum, plan) => sum + plan.price * plan.customers, 0) +
    revenueAddOns.reduce((sum, feature) => sum + feature.price * feature.customers, 0) +
    techSupportRevenue.reduce((sum, row) => sum + techSupportRowRevenue(row), 0) +
    planAddonRows.reduce((sum, row) => sum + row.price * row.quantity, 0) +
    surgicalRevenue;

  const bundledFeatureCosts = Object.values(bundledFeatures)
    .flat()
    .reduce((sum, feature) => {
      const plan = adjustedPlans.find((p) => bundleConfig[p.id]?.includes(feature.id));
      const planCustomers = plan?.customers || 0;
      return sum + feature.operating_cost_per_customer * planCustomers;
    }, 0);

  const remainingAddOnCosts = remainingAddOns.reduce(
    (sum, feature) => sum + feature.operating_cost_per_customer * feature.customers,
    0
  );

  const baseOperatingCosts = operatingCosts.reduce((sum, cost) => {
    if (cost.is_fixed) {
      return sum + cost.amount;
    } else {
      return sum + cost.unit_price * cost.units;
    }
  }, 0);

  const monthlyOperatingExpenses = baseOperatingCosts + bundledFeatureCosts + remainingAddOnCosts;

  const monthlyMarketingExpenses = marketingCosts.reduce((sum, cost) => {
    const planPrice = getPlanPriceByName(cost.price_plan, adjustedPlans);
    return sum + planPrice * cost.customers * (cost.rate / 100);
  }, 0);

  const totalMonthlyExpenses = monthlyOperatingExpenses + monthlyMarketingExpenses;
  const monthlyProfit = monthlyRevenue - totalMonthlyExpenses;

  const annualRevenue = monthlyRevenue * 12;
  const annualOperatingExpenses = monthlyOperatingExpenses * 12;
  const annualMarketingExpenses = monthlyMarketingExpenses * 12;
  const annualProfit = annualRevenue - annualOperatingExpenses - annualMarketingExpenses - capitalExpenditure;

  const breakEvenMonths = monthlyProfit > 0 ? capitalExpenditure / monthlyProfit : 0;

  const calculations: Calculations = {
    monthlyRevenue,
    monthlyOperatingExpenses,
    monthlyMarketingExpenses,
    totalMonthlyExpenses,
    monthlyProfit,
    annualRevenue,
    annualOperatingExpenses,
    annualMarketingExpenses,
    annualProfit,
    breakEvenMonths,
  };

  return {
    name: 'Simulation',
    calculations,
    bundledFeatures,
    remainingAddOns,
  };
}
