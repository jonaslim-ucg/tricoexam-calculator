export interface ForecastScenario {
  id: string;
  name: string;
  capital_expenditure: number;
  created_at: string;
  updated_at: string;
}

export interface PricingPlan {
  id: string;
  scenario_id: string;
  name: string;
  price: number;
  customers: number;
  display_order: number;
  created_at: string;
}

export interface AddOnFeature {
  id: string;
  scenario_id: string;
  name: string;
  price: number;
  customers: number;
  is_revenue: boolean;
  operating_cost_per_customer: number;
  created_at: string;
}

export interface OperatingCost {
  id: string;
  scenario_id: string;
  name: string;
  amount: number;
  is_fixed: boolean;
  unit_price: number;
  units: number;
  created_at: string;
}

export interface MarketingCost {
  id: string;
  scenario_id: string;
  name: string;
  rate: number;
  price_plan: string;
  customers: number;
  /** When present from DB: 'commission' | 'fixed'. Commission uses rate/price_plan/customers; fixed uses fixed_amount. */
  cost_type?: 'commission' | 'fixed';
  fixed_amount?: number;
  created_at: string;
}

export interface TechSupportRevenue {
  id: string;
  scenario_id: string;
  plan_id: string;
  tier: 'Priority' | 'Urgent';
  tier_price: number;
  customers: number;
  seat_addon_price: number;
  extra_seats: number;
  created_at: string;
}

/** Local/sample tech support row (no DB required); used for display and revenue calc */
export interface TechSupportRow {
  plan_id: string;
  plan_name: string;
  tier: 'Priority' | 'Urgent';
  tier_price: number;
  customers: number;
  seat_addon_price: number;
  extra_seats: number;
}

/** Per-plan add-ons: additional staff ($35) and additional provider ($75); editable */
export interface PlanAddonRow {
  plan_id: string;
  plan_name: string;
  addon_type: 'additional_staff' | 'additional_provider';
  price: number;
  quantity: number;
}

/** Volume tier key; 100+ has editable (custom) add-on price */
export type SurgicalTierKey = '0-10' | '11-25' | '26-50' | '51-100' | '100+';

/** Surgical Services Pack: per-plan base + one row per volume tier with customer count; add-on is fixed except 100+ (custom) */
export interface SurgicalTierRow {
  plan_id: string;
  plan_name: string;
  base_price: number;
  tier_key: SurgicalTierKey;
  addon_price: number; // 0, 150, 300, 600 for first four; editable for 100+
  customers: number;
}

export interface SurgicalExtras {
  additional_provider_price: number;
  additional_provider_quantity: number;
  automation_price_per_1000: number;
  automation_overage_thousands: number;
}

/** Onboarding Options: Upgrade 1 (session) and Upgrade 2 (bundle); rows can be plan-based or custom (named). */
export interface OnboardingRow {
  id?: string; // Set when loaded from DB or after insert; used for update/delete
  plan_id: string;
  plan_name: string;
  upgrade_type: 'session' | 'bundle';
  price: number;
  customers: number;
  /** Per-row delivery cost; when set, overrides the section default. */
  delivery_cost?: number;
}

export interface Calculations {
  monthlyRevenue: number;
  monthlyOperatingExpenses: number;
  monthlyMarketingExpenses: number;
  totalMonthlyExpenses: number;
  monthlyProfit: number;
  annualRevenue: number;
  annualOperatingExpenses: number;
  annualMarketingExpenses: number;
  annualProfit: number;
  breakEvenMonths: number;
}

export interface BundleSimulation {
  id: string;
  scenario_id: string;
  name: string;
  description: string;
  bundle_config: Record<string, string[]>;
  adjusted_plan_prices: Record<string, number>;
  adjusted_plan_customers: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface SimulationResult {
  name: string;
  calculations: Calculations;
  bundledFeatures: Record<string, AddOnFeature[]>;
  remainingAddOns: AddOnFeature[];
}
