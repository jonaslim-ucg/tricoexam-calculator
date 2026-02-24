import type { PricingPlan, AddOnFeature, OperatingCost, MarketingCost, Calculations } from '../types/forecast';

/** Resolve plan price by name (e.g. "Basic" matches "Basic Plan") */
export function getPlanPriceByName(planName: string, pricingPlans: PricingPlan[]): number {
  const normalized = planName.toLowerCase().trim();
  const plan = pricingPlans.find(
    (p) =>
      p.name.toLowerCase() === normalized ||
      p.name.toLowerCase().includes(normalized) ||
      normalized.includes(p.name.toLowerCase())
  );
  return plan?.price ?? 0;
}

function techSupportRowRevenue(row: { tier_price: number; customers: number; seat_addon_price: number; extra_seats: number }): number {
  return row.tier_price * row.customers + row.seat_addon_price * row.extra_seats;
}

export function calculateMetrics(
  capitalExpenditure: number,
  pricingPlans: PricingPlan[],
  addOnFeatures: AddOnFeature[],
  operatingCosts: OperatingCost[],
  marketingCosts: MarketingCost[],
  techSupportRevenue: { tier_price: number; customers: number; seat_addon_price: number; extra_seats: number }[] = [],
  planAddonRows: { price: number; quantity: number }[] = [],
  surgicalTierRows: { base_price: number; addon_price: number; customers: number }[] = [],
  surgicalExtras: { additional_provider_price: number; additional_provider_quantity: number; automation_price_per_1000: number; automation_overage_thousands: number } = { additional_provider_price: 0, additional_provider_quantity: 0, automation_price_per_1000: 0, automation_overage_thousands: 0 },
  onboardingRows: { price: number; customers: number }[] = []
): Calculations {
  const surgicalRevenue =
    surgicalTierRows.reduce((sum, row) => sum + (row.base_price + row.addon_price) * row.customers, 0) +
    surgicalExtras.additional_provider_price * surgicalExtras.additional_provider_quantity +
    surgicalExtras.automation_price_per_1000 * surgicalExtras.automation_overage_thousands;

  const onboardingRevenue = onboardingRows.reduce((sum, row) => sum + row.price * row.customers, 0);

  /** Cost-only add-ons: no revenue, only cost/customer + customers (Extra Storage, Additional AI Image Packs) */
  const costOnlyAddonNames = ['Extra Storage (5GB pack)', 'Image Scans (5k pack)'];
  const revenueAddOns = addOnFeatures.filter(f => f.is_revenue && !costOnlyAddonNames.includes(f.name));

  const monthlyRevenue =
    pricingPlans.reduce((sum, plan) => sum + plan.price * plan.customers, 0) +
    revenueAddOns.reduce((sum, feature) => sum + feature.price * feature.customers, 0) +
    techSupportRevenue.reduce((sum, row) => sum + techSupportRowRevenue(row), 0) +
    planAddonRows.reduce((sum, row) => sum + row.price * row.quantity, 0) +
    surgicalRevenue +
    onboardingRevenue;

  const addOnOperatingCosts = addOnFeatures.reduce(
    (sum, feature) => sum + (feature.operating_cost_per_customer * feature.customers),
    0
  );

  const monthlyOperatingExpenses =
    operatingCosts.reduce((sum, cost) => {
      if (cost.is_fixed) {
        return sum + cost.amount;
      } else {
        return sum + (cost.unit_price * cost.units);
      }
    }, 0) + addOnOperatingCosts;

  const monthlyMarketingExpenses = marketingCosts.reduce((sum, cost) => {
    const planPrice = getPlanPriceByName(cost.price_plan, pricingPlans);
    return sum + (planPrice * cost.customers * (cost.rate / 100));
  }, 0);

  const totalMonthlyExpenses = monthlyOperatingExpenses + monthlyMarketingExpenses;
  const monthlyProfit = monthlyRevenue - totalMonthlyExpenses;

  const annualRevenue = monthlyRevenue * 12;
  const annualOperatingExpenses = monthlyOperatingExpenses * 12;
  const annualMarketingExpenses = monthlyMarketingExpenses * 12;
  const annualProfit = annualRevenue - annualOperatingExpenses - annualMarketingExpenses - capitalExpenditure;

  const breakEvenMonths = monthlyProfit > 0
    ? capitalExpenditure / monthlyProfit
    : 0;

  return {
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
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}
