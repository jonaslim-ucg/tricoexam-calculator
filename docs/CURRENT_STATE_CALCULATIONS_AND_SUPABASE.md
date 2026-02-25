# Current State: Calculations & Supabase (Snapshot)

This document captures the current state of calculations, Supabase schema, and data flow. Use it as a reference when adding migrations and wiring persisted data.

---

## Proceeding to Supabase (run migrations)

1. **Apply migrations** in your Supabase project (Dashboard → SQL Editor, or CLI):
   - Run in order by filename (oldest first). The **new** tables to add are:
     - `supabase/migrations/20260126100000_create_plan_addon_rows.sql`
     - `supabase/migrations/20260126100100_create_surgical_tables.sql`
     - `supabase/migrations/20260126100200_create_onboarding_rows.sql`
   - If you use the Supabase CLI: `supabase db push` (or run each new migration file manually).

2. **App behavior**
   - **Before** these migrations: the app loads core data; queries for the new tables fail gracefully and plan add-ons, surgical, and onboarding use built-in defaults (no persist).
   - **After** migrations: the app loads and saves plan add-on rows, surgical tier rows, surgical extras, and onboarding rows. New scenarios get default rows inserted into these tables.

3. **Env**  
   Ensure `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for your project.

---

## 1. Supabase migrations (existing)

| Migration file | Purpose |
|----------------|---------|
| `20260109173023_create_forecast_tables.sql` | Core tables: `forecast_scenarios`, `pricing_plans`, `add_on_features`, `operating_costs`, `marketing_costs` + RLS policies |
| `20260109180930_add_addon_operating_costs.sql` | Adds `operating_cost_per_customer` to `add_on_features` |
| `20260109181606_create_bundle_simulations.sql` | `bundle_simulations` table: `scenario_id`, `name`, `description`, `bundle_config` (jsonb), `adjusted_plan_prices` (jsonb), timestamps |
| `20260109184808_add_marketing_cost_types.sql` | Adds `cost_type` (text) and `fixed_amount` (numeric) to `marketing_costs` |
| `20260109185300_add_adjusted_plan_customers.sql` | Adds `adjusted_plan_customers` (jsonb) to `bundle_simulations` |
| `20260109200000_create_tech_support_revenue.sql` | `tech_support_revenue` table: `scenario_id`, `plan_id`, `tier`, `tier_price`, `customers`, `seat_addon_price`, `extra_seats` |

**Tables that exist in DB (and are loaded by the app):**

- `forecast_scenarios`
- `pricing_plans`
- `add_on_features` (with `operating_cost_per_customer`)
- `operating_costs`
- `marketing_costs` (with `cost_type`, `fixed_amount` — **not yet used in calculations**)
- `tech_support_revenue`
- `bundle_simulations` (with `bundle_config`, `adjusted_plan_prices`, `adjusted_plan_customers`)

---

## 2. Data loading: `useForecastData`

**File:** `src/hooks/useForecastData.ts`

**Loads from Supabase (by `scenario_id`):**

- `forecast_scenarios` → `scenario`
- `pricing_plans` → `pricingPlans`
- `add_on_features` → `addOnFeatures`
- `operating_costs` → `operatingCosts`
- `marketing_costs` → `marketingCosts`
- `tech_support_revenue` → `techSupportRevenue`

**Also loads when tables exist (optional; fails gracefully if missing):**

- `plan_addon_rows` → `planAddonRows`
- `surgical_tier_rows` → `surgicalTierRows`
- `surgical_extras` → `surgicalExtras`
- `onboarding_rows` → `onboardingRows`

---

## 3. Main dashboard calculations: `calculateMetrics`

**File:** `src/utils/calculations.ts`

**Signature:**

```ts
calculateMetrics(
  capitalExpenditure,
  pricingPlans,
  addOnFeatures,
  operatingCosts,
  marketingCosts,
  techSupportRevenue = [],
  planAddonRows = [],
  surgicalTierRows = [],
  surgicalExtras = {},
  onboardingRows = []
) → Calculations
```

**Revenue sources (monthly):**

| Source | Formula |
|--------|---------|
| Pricing plans | `sum(plan.price * plan.customers)` |
| Revenue add-ons | Add-ons with `is_revenue` and not in cost-only list; `sum(price * customers)` |
| Tech support | Per row: `tier_price * customers + seat_addon_price * extra_seats` |
| Plan add-ons | `sum(price * quantity)` |
| Surgical | `sum((base_price + addon_price) * customers)` + extras (additional provider, automation overage) |
| Onboarding | `sum(price * customers)` (one-time revenue treated as monthly for this calc) |

**Cost-only add-ons (revenue excluded, cost included):**  
`Extra Storage (5GB pack)`, `Image Scans (5k pack)` — cost = `operating_cost_per_customer * customers`.

**Expenses:**

- Operating: fixed `amount` or `unit_price * units` + add-on operating costs.
- Marketing: `sum(planPrice * customers * (rate / 100))` — **commission only**; `cost_type` / `fixed_amount` not used.

**Output:** `Calculations` (monthly/annual revenue, expenses, profit, break-even months).

---

## 4. Bundle simulation calculations: `calculateSimulation`

**File:** `src/utils/simulationCalculations.ts`

**Signature:**

```ts
calculateSimulation(
  capitalExpenditure,
  pricingPlans,
  addOnFeatures,
  operatingCosts,
  marketingCosts,
  bundleConfig,        // { planId: featureIds[] }
  adjustedPrices,      // { planId: number }
  adjustedCustomers,   // { planId: number }
  techSupportRevenue = [],
  planAddonRows = [],
  surgicalTierRows = [],
  surgicalExtras = {}
) → SimulationResult
```

**Note:** `onboardingRows` is **not** a parameter; onboarding revenue is not included in the simulation.

**Behaviour:**

- Builds `adjustedPlans` from `pricingPlans` using `adjustedPrices` and `adjustedCustomers`.
- Bundled features: those in `bundleConfig`; revenue is included in plan (price already in plan); cost attributed to bundled feature `operating_cost_per_customer * planCustomers`.
- Remaining add-ons: revenue and cost as standalone.
- Same tech support, operating cost, and marketing formulas as main calc (marketing still commission-only).
- **In `BundleSimulator.tsx`**, the simulation is called with:
  - `planAddonRows: []`
  - `surgicalTierRows: []`
  - `surgicalExtras: { ... zeros }`
  So plan add-ons, surgical, and onboarding are **not** included in the bundle simulation today.

---

## 5. Where each input comes from (Dashboard vs DB)

| Input | Dashboard | Supabase table | useForecastData |
|-------|-----------|----------------|-----------------|
| scenario | ✅ from hook | `forecast_scenarios` | ✅ |
| pricingPlans | ✅ from hook | `pricing_plans` | ✅ |
| addOnFeatures | ✅ from hook | `add_on_features` | ✅ |
| operatingCosts | ✅ from hook | `operating_costs` | ✅ |
| marketingCosts | ✅ from hook | `marketing_costs` | ✅ |
| techSupportRevenue | ✅ from hook | `tech_support_revenue` | ✅ |
| planAddonRows | ✅ local state | ❌ none | ❌ |
| surgicalTierRows | ✅ local state | ❌ none | ❌ |
| surgicalExtras | ✅ local state | ❌ none | ❌ |
| onboardingRows | ✅ local state | ❌ none | ❌ |

---

## 6. TypeScript types (forecast)

**Persisted (match or extend DB):**  
`ForecastScenario`, `PricingPlan`, `AddOnFeature`, `OperatingCost`, `MarketingCost`, `TechSupportRevenue`

**Local-only (no DB yet):**  
`PlanAddonRow`, `SurgicalTierRow`, `SurgicalExtras`, `OnboardingRow`

**MarketingCost:**  
Type has `rate`, `price_plan`, `customers` only. DB has `cost_type` and `fixed_amount`; calculations do not use them yet.

---

## 7. Gaps summary

1. **Not persisted (lost on refresh):**  
   Plan add-ons, surgical tiers, surgical extras, onboarding rows.

2. **Bundle simulation narrower than dashboard:**  
   Simulation does not include plan add-ons, surgical revenue, or onboarding; and it’s called with empty/zero values for those in `BundleSimulator.tsx`.

3. **Marketing cost type:**  
   Migration adds `cost_type` and `fixed_amount`; app types and both calculation modules still use only commission formula.

4. **Onboarding in simulation:**  
   `calculateSimulation` has no `onboardingRows` parameter, so onboarding revenue cannot be included in bundle simulations until the API and call sites are updated.

---

## 8. Bundle simulation save/load

- **Save:** `BundleSimulator` writes to `bundle_simulations`: `scenario_id`, `name`, `description`, `bundle_config`, `adjusted_plan_prices`, `adjusted_plan_customers`.
- **Load:** Not shown in the current `useForecastData` flow; simulations can be loaded separately from `bundle_simulations` when needed.

---

Use this snapshot when adding new migrations, extending `useForecastData`, and aligning `calculateSimulation` with the main dashboard (and Supabase) before you set up Supabase.
