import { Briefcase, DollarSign, Trash2 } from 'lucide-react';
import type { OnboardingConfig, OnboardingUpgrade, PlanKey } from '../types/plans';

const PLAN_LABELS: Record<PlanKey, string> = {
  basic: 'Basic',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

const PLAN_KEYS: PlanKey[] = ['basic', 'professional', 'enterprise'];

function marginPct(revenue: number, profit: number): string {
  if (revenue <= 0) return '0.0%';
  return `${((profit / revenue) * 100).toFixed(1)}%`;
}

interface OnboardingOptionsCardProps {
  config: OnboardingConfig;
  onChange: (config: OnboardingConfig) => void;
}

export default function OnboardingOptionsCard({ config, onChange }: OnboardingOptionsCardProps) {
  const sessionUpgrade = config.upgrades[0];
  const bundleUpgrade = config.upgrades[1];

  const sessionDeliveryPerUnit = config.contractorPayPerSession;
  const bundleDeliveryPerUnit = config.contractorPayPerBundle;

  const sessionRevenue = sessionUpgrade
    ? PLAN_KEYS.reduce((s, p) => s + sessionUpgrade.pricePerPlan[p] * sessionUpgrade.customersPerPlan[p], 0)
    : 0;
  const sessionDeliveryCost = sessionUpgrade
    ? PLAN_KEYS.reduce((s, p) => s + sessionDeliveryPerUnit * sessionUpgrade.customersPerPlan[p], 0)
    : 0;
  const sessionProfit = sessionRevenue - sessionDeliveryCost;

  const bundleRevenue = bundleUpgrade
    ? PLAN_KEYS.reduce((s, p) => s + bundleUpgrade.pricePerPlan[p] * bundleUpgrade.customersPerPlan[p], 0)
    : 0;
  const bundleDeliveryCost = bundleUpgrade
    ? PLAN_KEYS.reduce((s, p) => s + bundleDeliveryPerUnit * bundleUpgrade.customersPerPlan[p], 0)
    : 0;
  const bundleProfit = bundleRevenue - bundleDeliveryCost;

  const totalRevenue = sessionRevenue + bundleRevenue;
  const totalDeliveryCost = sessionDeliveryCost + bundleDeliveryCost;
  const totalGrossProfit = sessionProfit + bundleProfit;
  const overallMarginPct = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

  function updateUpgrade(index: number, updates: Partial<OnboardingUpgrade>) {
    const next = config.upgrades.map((u, i) => (i === index ? { ...u, ...updates } : u));
    onChange({ ...config, upgrades: next });
  }

  return (
    <div className="space-y-6">
      {/* Onboarding Services Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Onboarding Services Summary</h2>
              <p className="text-sm text-slate-500">One-time revenue and costs</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Total Gross Profit</div>
            <div className="text-2xl font-bold text-sky-600 tabular-nums">${totalGrossProfit.toLocaleString()}</div>
            <div className="text-sm text-slate-500">{overallMarginPct.toFixed(1)}% margin</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">One-Time Revenue</div>
            <div className="text-lg font-bold text-slate-900 tabular-nums mt-1">${totalRevenue.toLocaleString()}</div>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Delivery Costs</div>
            <div className="text-lg font-bold text-slate-900 tabular-nums mt-1">${totalDeliveryCost.toLocaleString()}</div>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Gross Profit</div>
            <div className="text-lg font-bold text-green-600 tabular-nums mt-1">${totalGrossProfit.toLocaleString()}</div>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Margin</div>
            <div className="text-lg font-bold text-slate-900 tabular-nums mt-1">{overallMarginPct.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Onboarding Services — Single Sessions & Bundles */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Onboarding Services</h2>
              <p className="text-sm text-slate-500">One-time service revenue and delivery costs</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Total Gross Profit</div>
            <div className="text-2xl font-bold text-sky-600 tabular-nums">${totalGrossProfit.toLocaleString()}</div>
            <div className="text-sm text-slate-500">{overallMarginPct.toFixed(1)}% margin</div>
          </div>
        </div>

        {/* Single Sessions (1x 60-min) */}
        {sessionUpgrade && (
          <div className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <h3 className="text-sm font-semibold text-slate-800">Single Sessions (1× 60-min)</h3>
              <span className="text-sm text-slate-600">
                Revenue: <strong>${sessionRevenue.toLocaleString()}</strong> | Profit: <strong>${sessionProfit.toLocaleString()}</strong> ({marginPct(sessionRevenue, sessionProfit)})
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-left">
                    <th className="py-2 pr-4 font-medium">Plan</th>
                    <th className="py-2 px-2 font-medium text-right">Price</th>
                    <th className="py-2 px-2 font-medium text-right">Delivery Cost</th>
                    <th className="py-2 px-2 font-medium text-right">Units Sold</th>
                    <th className="py-2 px-2 font-medium text-right">Revenue</th>
                    <th className="py-2 px-2 font-medium text-right">Profit</th>
                    <th className="py-2 px-2 font-medium text-right">Profit %</th>
                    <th className="w-10" aria-label="Delete" />
                  </tr>
                </thead>
                <tbody>
                  {PLAN_KEYS.map((plan) => {
                    const price = sessionUpgrade.pricePerPlan[plan];
                    const units = sessionUpgrade.customersPerPlan[plan];
                    const revenue = price * units;
                    const deliveryTotal = sessionDeliveryPerUnit * units;
                    const profit = revenue - deliveryTotal;
                    return (
                      <tr key={plan} className="border-b border-slate-100">
                        <td className="py-2.5 pr-4 font-medium text-slate-800">{PLAN_LABELS[plan]} Plan</td>
                        <td className="py-2.5 px-2 text-right">
                          <input
                            type="number"
                            min={0}
                            value={price}
                            onChange={(e) =>
                              updateUpgrade(0, {
                                pricePerPlan: { ...sessionUpgrade.pricePerPlan, [plan]: Number(e.target.value) || 0 },
                              })
                            }
                            className="w-20 px-2 py-1 border border-slate-300 rounded text-right text-sm"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-right text-slate-600">{sessionDeliveryPerUnit}</td>
                        <td className="py-2.5 px-2 text-right">
                          <input
                            type="number"
                            min={0}
                            value={units}
                            onChange={(e) =>
                              updateUpgrade(0, {
                                customersPerPlan: { ...sessionUpgrade.customersPerPlan, [plan]: Number(e.target.value) || 0 },
                              })
                            }
                            className="w-16 px-2 py-1 border border-slate-300 rounded text-right text-sm"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-right font-medium text-slate-900">${revenue.toLocaleString()}</td>
                        <td className="py-2.5 px-2 text-right font-medium text-green-600">${profit.toLocaleString()}</td>
                        <td className="py-2.5 px-2 text-right text-slate-600">{marginPct(revenue, profit)}</td>
                        <td className="py-2.5 px-1">
                          <button
                            type="button"
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                            aria-label={`Delete ${PLAN_LABELS[plan]} session row`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bundles (3x 60-min) */}
        {bundleUpgrade && (
          <div className="mb-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <h3 className="text-sm font-semibold text-slate-800">Bundles (3× 60-min)</h3>
              <span className="text-sm text-slate-600">
                Revenue: <strong>${bundleRevenue.toLocaleString()}</strong> | Profit: <strong>${bundleProfit.toLocaleString()}</strong> ({marginPct(bundleRevenue, bundleProfit)})
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-left">
                    <th className="py-2 pr-4 font-medium">Plan</th>
                    <th className="py-2 px-2 font-medium text-right">Price</th>
                    <th className="py-2 px-2 font-medium text-right">Delivery Cost</th>
                    <th className="py-2 px-2 font-medium text-right">Units Sold</th>
                    <th className="py-2 px-2 font-medium text-right">Revenue</th>
                    <th className="py-2 px-2 font-medium text-right">Profit</th>
                    <th className="py-2 px-2 font-medium text-right">Profit %</th>
                    <th className="w-10" aria-label="Delete" />
                  </tr>
                </thead>
                <tbody>
                  {PLAN_KEYS.map((plan) => {
                    const price = bundleUpgrade.pricePerPlan[plan];
                    const units = bundleUpgrade.customersPerPlan[plan];
                    const revenue = price * units;
                    const deliveryTotal = bundleDeliveryPerUnit * units;
                    const profit = revenue - deliveryTotal;
                    return (
                      <tr key={plan} className="border-b border-slate-100">
                        <td className="py-2.5 pr-4 font-medium text-slate-800">{PLAN_LABELS[plan]} Plan</td>
                        <td className="py-2.5 px-2 text-right">
                          <input
                            type="number"
                            min={0}
                            value={price}
                            onChange={(e) =>
                              updateUpgrade(1, {
                                pricePerPlan: { ...bundleUpgrade.pricePerPlan, [plan]: Number(e.target.value) || 0 },
                              })
                            }
                            className="w-20 px-2 py-1 border border-slate-300 rounded text-right text-sm"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-right text-slate-600">{bundleDeliveryPerUnit}</td>
                        <td className="py-2.5 px-2 text-right">
                          <input
                            type="number"
                            min={0}
                            value={units}
                            onChange={(e) =>
                              updateUpgrade(1, {
                                customersPerPlan: { ...bundleUpgrade.customersPerPlan, [plan]: Number(e.target.value) || 0 },
                              })
                            }
                            className="w-16 px-2 py-1 border border-slate-300 rounded text-right text-sm"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-right font-medium text-slate-900">${revenue.toLocaleString()}</td>
                        <td className="py-2.5 px-2 text-right font-medium text-green-600">${profit.toLocaleString()}</td>
                        <td className="py-2.5 px-2 text-right text-slate-600">{marginPct(revenue, profit)}</td>
                        <td className="py-2.5 px-1">
                          <button
                            type="button"
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                            aria-label={`Delete ${PLAN_LABELS[plan]} bundle row`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Contractor pay — edit delivery cost per unit for Session and Bundle */}
        <div className="border-t border-slate-200 pt-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Contractor pay (delivery cost per unit)</h3>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Session (1× 60-min):</span>
              <span className="text-slate-400">$</span>
              <input
                type="number"
                min={0}
                value={config.contractorPayPerSession}
                onChange={(e) => onChange({ ...config, contractorPayPerSession: Number(e.target.value) || 0 })}
                className="w-20 px-2 py-1.5 border border-slate-300 rounded text-sm"
              />
              <span className="text-xs text-slate-500">/session (covers up to 2.5 hrs)</span>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Bundle (3× 60-min):</span>
              <span className="text-slate-400">$</span>
              <input
                type="number"
                min={0}
                value={config.contractorPayPerBundle}
                onChange={(e) => onChange({ ...config, contractorPayPerBundle: Number(e.target.value) || 0 })}
                className="w-20 px-2 py-1.5 border border-slate-300 rounded text-sm"
              />
              <span className="text-xs text-slate-500">/bundle (3 sessions)</span>
            </label>
          </div>
          <p className="text-xs text-slate-500 mt-2">Included (All Plans): Basic Onboarding (self-serve). {config.includedDescription}. {config.includedCostNote}</p>
          <details className="mt-3">
            <summary className="text-sm text-slate-600 cursor-pointer">Guardrails</summary>
            <p className="text-sm text-slate-600 whitespace-pre-line mt-2 pl-2 border-l-2 border-slate-200">{config.guardrailsDescription}</p>
          </details>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-sm font-medium"
          >
            + Add Single Session
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 text-sm font-medium"
          >
            + Add Bundle
          </button>
        </div>
      </div>
    </div>
  );
}
