import { DollarSign, Headphones, Plus, Trash2, Stethoscope } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { PricingPlan, AddOnFeature, TechSupportRow, PlanAddonRow, SurgicalTierRow, SurgicalTierKey, SurgicalExtras, OnboardingRow } from "../types/forecast";

interface RevenueSectionProps {
  scenarioId: string;
  pricingPlans: PricingPlan[];
  addOnFeatures: AddOnFeature[];
  techSupportRows: TechSupportRow[];
  onUpdateTechSupportRow: (planId: string, tier: 'Priority' | 'Urgent', field: keyof Pick<TechSupportRow, 'tier_price' | 'customers' | 'seat_addon_price' | 'extra_seats'>, value: number) => void;
  planAddonRows: PlanAddonRow[];
  onUpdatePlanAddonRow: (planId: string, addonType: 'additional_staff' | 'additional_provider', field: keyof Pick<PlanAddonRow, 'price' | 'quantity'>, value: number) => void;
  surgicalTierRows: SurgicalTierRow[];
  onUpdateSurgicalTierRow: (planId: string, tierKey: SurgicalTierKey, field: keyof Pick<SurgicalTierRow, 'base_price' | 'addon_price' | 'customers'>, value: number) => void;
  onUpdateSurgicalBasePrice: (planId: string, value: number) => void;
  surgicalExtras: SurgicalExtras;
  onUpdateSurgicalExtras: (field: keyof SurgicalExtras, value: number) => void;
  onboardingRows: OnboardingRow[];
  onUpdateOnboardingRow: (planId: string, upgradeType: 'session' | 'bundle', field: keyof Pick<OnboardingRow, 'price' | 'customers'>, value: number) => void;
  onUpdate: () => void;
}

function techSupportRowRevenue(row: TechSupportRow): number {
  return row.tier_price * row.customers + row.seat_addon_price * row.extra_seats;
}

/** Cost-only add-ons: Extra Storage & Additional AI Image Packs — no revenue price, only cost/customer + customers */
const COST_ONLY_ADDON_NAMES = ['Extra Storage (5GB pack)', 'Image Scans (5k pack)'];

export default function RevenueSection({
  scenarioId,
  pricingPlans,
  addOnFeatures,
  techSupportRows,
  onUpdateTechSupportRow,
  planAddonRows,
  onUpdatePlanAddonRow,
  surgicalTierRows,
  onUpdateSurgicalTierRow,
  onUpdateSurgicalBasePrice,
  surgicalExtras,
  onUpdateSurgicalExtras,
  onboardingRows,
  onUpdateOnboardingRow,
  onUpdate,
}: RevenueSectionProps) {
  async function updatePricingPlan(
    id: string,
    field: keyof PricingPlan,
    value: string | number,
  ) {
    await supabase
      .from("pricing_plans")
      .update({ [field]: value })
      .eq("id", id);
    onUpdate();
  }

  async function updateAddOnFeature(
    id: string,
    field: keyof AddOnFeature,
    value: string | number,
  ) {
    await supabase
      .from("add_on_features")
      .update({ [field]: value })
      .eq("id", id);
    onUpdate();
  }

  async function addNewFeature() {
    await supabase.from("add_on_features").insert({
      scenario_id: scenarioId,
      name: "New Feature",
      price: 0,
      customers: 10,
      is_revenue: true,
      operating_cost_per_customer: 0,
    });
    onUpdate();
  }

  async function deleteFeature(id: string) {
    await supabase.from("add_on_features").delete().eq("id", id);
    onUpdate();
  }

  const surgicalRevenue =
    surgicalTierRows.reduce((sum, row) => sum + (row.base_price + row.addon_price) * row.customers, 0) +
    surgicalExtras.additional_provider_price * surgicalExtras.additional_provider_quantity +
    surgicalExtras.automation_price_per_1000 * surgicalExtras.automation_overage_thousands;

  const totalRevenue =
    pricingPlans.reduce((sum, plan) => sum + plan.price * plan.customers, 0) +
    addOnFeatures
      .filter((f) => f.is_revenue && !COST_ONLY_ADDON_NAMES.includes(f.name))
      .reduce((sum, f) => sum + f.price * f.customers, 0) +
    techSupportRows.reduce((sum, row) => sum + techSupportRowRevenue(row), 0) +
    planAddonRows.reduce((sum, row) => sum + row.price * row.quantity, 0) +
    surgicalRevenue +
    onboardingRows.reduce((sum, r) => sum + r.price * r.customers, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Monthly Revenue
          </h2>
          <p className="text-sm text-slate-600">
            Pricing plans and add-on features
          </p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-sm text-slate-600">Total Monthly Revenue</div>
          <div className="text-2xl font-bold text-green-600">
            ${totalRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Pricing Plans
          </h3>
          <div className="space-y-2">
            {pricingPlans.map((plan) => {
              const planAddons = planAddonRows.filter((r) => r.plan_id === plan.id);
              const staff = planAddons.find((r) => r.addon_type === "additional_staff");
              const provider = planAddons.find((r) => r.addon_type === "additional_provider");
              return (
                <div
                  key={plan.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <input
                      type="text"
                      value={plan.name}
                      onChange={(e) =>
                        updatePricingPlan(plan.id, "name", e.target.value)
                      }
                      className="flex-1 border-0 border-b border-transparent bg-transparent px-0 py-1 text-base font-semibold text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-0"
                    />
                    <div className="ml-2 rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800">
                      {plan.customers} customers
                    </div>
                  </div>
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[80px]">
                      <label className="text-xs text-slate-600">Price</label>
                      <input
                        type="number"
                        value={plan.price}
                        onChange={(e) =>
                          updatePricingPlan(
                            plan.id,
                            "price",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                    <div className="flex-1 min-w-[80px]">
                      <label className="text-xs text-slate-600">Customers</label>
                      <input
                        type="number"
                        value={plan.customers}
                        onChange={(e) =>
                          updatePricingPlan(
                            plan.id,
                            "customers",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                    <div className="text-right ml-auto">
                      <div className="text-xs text-slate-600">Revenue</div>
                      <div className="text-lg font-semibold text-green-600">
                        ${(plan.price * plan.customers).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {(staff || provider) && (
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                      {staff && (
                        <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center text-sm">
                          <span className="text-slate-600">Additional staff:</span>
                          <div>
                            <label className="text-xs text-slate-500 block">Price ($)</label>
                            <input
                              type="number"
                              value={staff.price}
                              onChange={(e) => onUpdatePlanAddonRow(plan.id, "additional_staff", "price", parseFloat(e.target.value) || 0)}
                              className="w-full rounded border border-slate-300 px-2 py-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 block">Quantity</label>
                            <input
                              type="number"
                              value={staff.quantity}
                              onChange={(e) => onUpdatePlanAddonRow(plan.id, "additional_staff", "quantity", parseInt(e.target.value) || 0)}
                              className="w-full rounded border border-slate-300 px-2 py-1"
                            />
                          </div>
                          <div className="text-right text-green-600 font-medium">${(staff.price * staff.quantity).toLocaleString()}</div>
                        </div>
                      )}
                      {provider && (
                        <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center text-sm">
                          <span className="text-slate-600">Additional provider:</span>
                          <div>
                            <label className="text-xs text-slate-500 block">Price ($)</label>
                            <input
                              type="number"
                              value={provider.price}
                              onChange={(e) => onUpdatePlanAddonRow(plan.id, "additional_provider", "price", parseFloat(e.target.value) || 0)}
                              className="w-full rounded border border-slate-300 px-2 py-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 block">Quantity</label>
                            <input
                              type="number"
                              value={provider.quantity}
                              onChange={(e) => onUpdatePlanAddonRow(plan.id, "additional_provider", "quantity", parseInt(e.target.value) || 0)}
                              className="w-full rounded border border-slate-300 px-2 py-1"
                            />
                          </div>
                          <div className="text-right text-green-600 font-medium">${(provider.price * provider.quantity).toLocaleString()}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {techSupportRows.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Headphones className="w-4 h-4 text-slate-600" />
              Tech Support (tier price + support seats)
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Standard (Email, 48h) included for all. Upgrade price covers included users; support seat add-on for extra users.
            </p>
            <div className="space-y-4">
              {(() => {
                const byPlan = new Map<string, TechSupportRow[]>();
                for (const row of techSupportRows) {
                  if (!byPlan.has(row.plan_id)) byPlan.set(row.plan_id, []);
                  byPlan.get(row.plan_id)!.push(row);
                }
                return Array.from(byPlan.entries()).map(([planId, rows]) => {
                  const planName = rows[0]?.plan_name ?? planId;
                  const priority = rows.find((r) => r.tier === "Priority");
                  const urgent = rows.find((r) => r.tier === "Urgent");
                  return (
                    <div key={planId} className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                      <div className="text-sm font-semibold text-slate-800 mb-2">{planName}:</div>
                      <div className="space-y-2">
                        {priority && (
                          <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] gap-2 items-center text-sm">
                            <span className="text-slate-600">Priority:</span>
                            <div>
                              <label className="text-xs text-slate-500 block">Cost</label>
                              <input
                                type="number"
                                value={priority.tier_price}
                                onChange={(e) => onUpdateTechSupportRow(planId, "Priority", "tier_price", parseFloat(e.target.value) || 0)}
                                className="w-full rounded border border-slate-300 px-2 py-1"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-500 block">Customers</label>
                              <input
                                type="number"
                                value={priority.customers}
                                onChange={(e) => onUpdateTechSupportRow(planId, "Priority", "customers", parseInt(e.target.value) || 0)}
                                className="w-full rounded border border-slate-300 px-2 py-1"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-500 block">Support Seat Cost</label>
                              <input
                                type="number"
                                value={priority.seat_addon_price}
                                onChange={(e) => onUpdateTechSupportRow(planId, "Priority", "seat_addon_price", parseFloat(e.target.value) || 0)}
                                className="w-full rounded border border-slate-300 px-2 py-1"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-500 block">Support Seat availed</label>
                              <input
                                type="number"
                                value={priority.extra_seats}
                                onChange={(e) => onUpdateTechSupportRow(planId, "Priority", "extra_seats", parseInt(e.target.value) || 0)}
                                className="w-full rounded border border-slate-300 px-2 py-1"
                              />
                            </div>
                            <div className="text-right text-green-600 font-medium">${techSupportRowRevenue(priority).toLocaleString()}</div>
                          </div>
                        )}
                        {urgent && (
                          <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] gap-2 items-center text-sm">
                            <span className="text-slate-600">Urgent:</span>
                            <div>
                              <label className="text-xs text-slate-500 block">Cost</label>
                              <input
                                type="number"
                                value={urgent.tier_price}
                                onChange={(e) => onUpdateTechSupportRow(planId, "Urgent", "tier_price", parseFloat(e.target.value) || 0)}
                                className="w-full rounded border border-slate-300 px-2 py-1"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-500 block">Customers</label>
                              <input
                                type="number"
                                value={urgent.customers}
                                onChange={(e) => onUpdateTechSupportRow(planId, "Urgent", "customers", parseInt(e.target.value) || 0)}
                                className="w-full rounded border border-slate-300 px-2 py-1"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-500 block">Support Seat Cost</label>
                              <input
                                type="number"
                                value={urgent.seat_addon_price}
                                onChange={(e) => onUpdateTechSupportRow(planId, "Urgent", "seat_addon_price", parseFloat(e.target.value) || 0)}
                                className="w-full rounded border border-slate-300 px-2 py-1"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-500 block">Support Seat availed</label>
                              <input
                                type="number"
                                value={urgent.extra_seats}
                                onChange={(e) => onUpdateTechSupportRow(planId, "Urgent", "extra_seats", parseInt(e.target.value) || 0)}
                                className="w-full rounded border border-slate-300 px-2 py-1"
                              />
                            </div>
                            <div className="text-right text-green-600 font-medium">${techSupportRowRevenue(urgent).toLocaleString()}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {surgicalTierRows.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-slate-600" />
              Surgical Services Pack (Add-On)
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Standard Surgery Quote + Surgical Workflow + Standard Post-Op Automated Emails. Below base: volume tiers with customer counts; 100+ is custom add-on price.
            </p>
            <div className="space-y-4">
              {(() => {
                const byPlan = new Map<string, SurgicalTierRow[]>();
                for (const row of surgicalTierRows) {
                  if (!byPlan.has(row.plan_id)) byPlan.set(row.plan_id, []);
                  byPlan.get(row.plan_id)!.push(row);
                }
                const tierOrder: SurgicalTierKey[] = ['0-10', '11-25', '26-50', '51-100', '100+'];
                return Array.from(byPlan.entries()).map(([planId, rows]) => {
                  const planName = rows[0]?.plan_name ?? planId;
                  const basePrice = rows[0]?.base_price ?? 0;
                  const sorted = tierOrder.map((key) => rows.find((r) => r.tier_key === key)).filter(Boolean) as SurgicalTierRow[];
                  return (
                    <div key={planId} className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-slate-800">{planName}:</span>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-500">Base $/mo</label>
                          <input
                            type="number"
                            value={basePrice}
                            onChange={(e) => onUpdateSurgicalBasePrice(planId, parseFloat(e.target.value) || 0)}
                            className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {sorted.map((row) => (
                          <div key={row.tier_key} className="grid grid-cols-[6rem_1fr_1fr_auto] gap-2 items-center text-sm">
                            <span className="text-slate-600">
                              {row.tier_key === '100+' ? '100+ (custom):' : `${row.tier_key} (+$${row.addon_price}):`}
                            </span>
                            {row.tier_key === '100+' ? (
                              <div>
                                <label className="text-xs text-slate-500 block">Add-on $</label>
                                <input
                                  type="number"
                                  value={row.addon_price}
                                  onChange={(e) => onUpdateSurgicalTierRow(planId, '100+', 'addon_price', parseFloat(e.target.value) || 0)}
                                  className="w-full rounded border border-slate-300 px-2 py-1"
                                />
                              </div>
                            ) : (
                              <div className="text-slate-500 text-xs pt-4">+${row.addon_price}</div>
                            )}
                            <div>
                              <label className="text-xs text-slate-500 block">Customers</label>
                              <input
                                type="number"
                                value={row.customers}
                                onChange={(e) => onUpdateSurgicalTierRow(planId, row.tier_key, 'customers', parseInt(e.target.value) || 0)}
                                className="w-full rounded border border-slate-300 px-2 py-1"
                              />
                            </div>
                            <div className="text-right text-green-600 font-medium pt-4">
                              ${((row.base_price + row.addon_price) * row.customers).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 space-y-2">
                <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center text-sm">
                  <span className="text-slate-600">Additional surgical provider:</span>
                  <div>
                    <label className="text-xs text-slate-500 block">Price ($/provider/mo)</label>
                    <input
                      type="number"
                      value={surgicalExtras.additional_provider_price}
                      onChange={(e) => onUpdateSurgicalExtras("additional_provider_price", parseFloat(e.target.value) || 0)}
                      className="w-full rounded border border-slate-300 px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block">Quantity</label>
                    <input
                      type="number"
                      value={surgicalExtras.additional_provider_quantity}
                      onChange={(e) => onUpdateSurgicalExtras("additional_provider_quantity", parseInt(e.target.value) || 0)}
                      className="w-full rounded border border-slate-300 px-2 py-1"
                    />
                  </div>
                  <div className="text-right text-green-600 font-medium">
                    ${(surgicalExtras.additional_provider_price * surgicalExtras.additional_provider_quantity).toLocaleString()}
                  </div>
                </div>
                <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center text-sm">
                  <span className="text-slate-600">Automation (emails over 3,000):</span>
                  <div>
                    <label className="text-xs text-slate-500 block">Price per 1,000 ($)</label>
                    <input
                      type="number"
                      value={surgicalExtras.automation_price_per_1000}
                      onChange={(e) => onUpdateSurgicalExtras("automation_price_per_1000", parseFloat(e.target.value) || 0)}
                      className="w-full rounded border border-slate-300 px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block">Overage (thousands)</label>
                    <input
                      type="number"
                      value={surgicalExtras.automation_overage_thousands}
                      onChange={(e) => onUpdateSurgicalExtras("automation_overage_thousands", parseFloat(e.target.value) || 0)}
                      className="w-full rounded border border-slate-300 px-2 py-1"
                    />
                  </div>
                  <div className="text-right text-green-600 font-medium">
                    ${(surgicalExtras.automation_price_per_1000 * surgicalExtras.automation_overage_thousands).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {onboardingRows.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              Onboarding Options + True Cost Summary
            </h3>
            <p className="text-xs text-slate-500 mb-2">
              Included (all plans): Basic Onboarding (self-serve). Paid upgrades: Upgrade 1 (1× 60-min session) and Upgrade 2 (3× 60-min bundle). Contractor pay is in Operating Costs.
            </p>
            <div className="space-y-3">
              {(() => {
                const byPlan = new Map<string, OnboardingRow[]>();
                for (const row of onboardingRows) {
                  if (!byPlan.has(row.plan_id)) byPlan.set(row.plan_id, []);
                  byPlan.get(row.plan_id)!.push(row);
                }
                return Array.from(byPlan.entries()).map(([planId, rows]) => {
                  const planName = rows[0]?.plan_name ?? planId;
                  const session = rows.find((r) => r.upgrade_type === 'session');
                  const bundle = rows.find((r) => r.upgrade_type === 'bundle');
                  return (
                    <div key={planId} className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                      <div className="font-medium text-slate-800 mb-2">{planName}</div>
                      <div className="space-y-2">
                        {session && (
                          <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center text-sm">
                            <span className="text-slate-600">Upgrade 1: Provider Onboarding Session (1× 60-min)</span>
                            <div>
                              <label className="text-xs text-slate-500 block">Price ($)</label>
                              <input
                                type="number"
                                value={session.price}
                                onChange={(e) => onUpdateOnboardingRow(planId, 'session', 'price', parseFloat(e.target.value) || 0)}
                                className="w-full rounded border border-slate-300 px-2 py-1"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-500 block">Customers</label>
                              <input
                                type="number"
                                value={session.customers}
                                onChange={(e) => onUpdateOnboardingRow(planId, 'session', 'customers', parseInt(e.target.value) || 0)}
                                className="w-full rounded border border-slate-300 px-2 py-1"
                              />
                            </div>
                            <div className="text-right text-green-600 font-medium pt-4">
                              ${(session.price * session.customers).toLocaleString()}
                            </div>
                          </div>
                        )}
                        {bundle && (
                          <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center text-sm">
                            <span className="text-slate-600">Upgrade 2: Provider Onboarding Bundle (3× 60-min)</span>
                            <div>
                              <label className="text-xs text-slate-500 block">Price ($)</label>
                              <input
                                type="number"
                                value={bundle.price}
                                onChange={(e) => onUpdateOnboardingRow(planId, 'bundle', 'price', parseFloat(e.target.value) || 0)}
                                className="w-full rounded border border-slate-300 px-2 py-1"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-500 block">Customers</label>
                              <input
                                type="number"
                                value={bundle.customers}
                                onChange={(e) => onUpdateOnboardingRow(planId, 'bundle', 'customers', parseInt(e.target.value) || 0)}
                                className="w-full rounded border border-slate-300 px-2 py-1"
                              />
                            </div>
                            <div className="text-right text-green-600 font-medium pt-4">
                              ${(bundle.price * bundle.customers).toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {(() => {
          const extraStorage = addOnFeatures.find((f) => f.name === 'Extra Storage (5GB pack)');
          const aiImagePacks = addOnFeatures.find((f) => f.name === 'Image Scans (5k pack)');
          const costOnlyAddons = [extraStorage, aiImagePacks].filter(Boolean);
          return costOnlyAddons.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Extra Storage & Additional AI Image Packs
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Cost only (no revenue price). Cost/customer × customers flows to Operating Costs.
              </p>
              <div className="space-y-2">
                {extraStorage && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center text-sm">
                      <span className="text-slate-700 font-medium">Extra Storage (5GB pack)</span>
                      <div>
                        <label className="text-xs text-slate-500 block">Cost/Customer ($)</label>
                        <input
                          type="number"
                          value={extraStorage.operating_cost_per_customer}
                          onChange={(e) =>
                            updateAddOnFeature(extraStorage.id, 'operating_cost_per_customer', parseFloat(e.target.value) || 0)
                          }
                          className="w-full rounded border border-slate-300 px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block">Customers</label>
                        <input
                          type="number"
                          value={extraStorage.customers}
                          onChange={(e) =>
                            updateAddOnFeature(extraStorage.id, 'customers', parseInt(e.target.value) || 0)
                          }
                          className="w-full rounded border border-slate-300 px-2 py-1"
                        />
                      </div>
                      <div className="text-right text-slate-700 pt-4">
                        <span className="text-xs text-slate-500 block">Cost</span>
                        ${(extraStorage.operating_cost_per_customer * extraStorage.customers).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
                {aiImagePacks && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center text-sm">
                      <span className="text-slate-700 font-medium">Additional AI Image Packs (5k pack)</span>
                      <div>
                        <label className="text-xs text-slate-500 block">Cost/Customer ($)</label>
                        <input
                          type="number"
                          value={aiImagePacks.operating_cost_per_customer}
                          onChange={(e) =>
                            updateAddOnFeature(aiImagePacks.id, 'operating_cost_per_customer', parseFloat(e.target.value) || 0)
                          }
                          className="w-full rounded border border-slate-300 px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block">Customers</label>
                        <input
                          type="number"
                          value={aiImagePacks.customers}
                          onChange={(e) =>
                            updateAddOnFeature(aiImagePacks.id, 'customers', parseInt(e.target.value) || 0)
                          }
                          className="w-full rounded border border-slate-300 px-2 py-1"
                        />
                      </div>
                      <div className="text-right text-slate-700 pt-4">
                        <span className="text-xs text-slate-500 block">Cost</span>
                        ${(aiImagePacks.operating_cost_per_customer * aiImagePacks.customers).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null;
        })()}

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Add-on Features
            </h3>
            <button
              onClick={addNewFeature}
              className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white transition-colors hover:bg-slate-800"
            >
              <Plus className="w-4 h-4" />
              Add Feature
            </button>
          </div>
          <div className="space-y-2">
            {addOnFeatures
              .filter((f) => f.is_revenue && !COST_ONLY_ADDON_NAMES.includes(f.name))
              .map((feature) => (
                <div
                  key={feature.id}
                  className="flex flex-col rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <input
                      type="text"
                      value={feature.name}
                      onChange={(e) =>
                        updateAddOnFeature(feature.id, "name", e.target.value)
                      }
                      className="flex-1 border-0 border-b border-transparent bg-transparent px-0 py-1 text-base font-semibold text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-0"
                    />
                    <div className="ml-2 flex items-center gap-2">
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800">
                        {feature.customers} customers
                      </span>
                      <button
                        onClick={() => deleteFeature(feature.id)}
                        className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="min-w-[80px] flex-1">
                      <label className="text-xs text-slate-600">Customers</label>
                      <input
                        type="number"
                        value={feature.customers}
                        onChange={(e) =>
                          updateAddOnFeature(
                            feature.id,
                            "customers",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                    <div className="min-w-[80px] flex-1">
                      <label className="text-xs text-slate-600">
                        Cost/Customer
                      </label>
                      <input
                        type="number"
                        value={feature.operating_cost_per_customer}
                        onChange={(e) =>
                          updateAddOnFeature(
                            feature.id,
                            "operating_cost_per_customer",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-xs text-slate-600">Revenue</div>
                      <div className="text-lg font-semibold text-green-600">
                        $
                        {(feature.price * feature.customers).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
