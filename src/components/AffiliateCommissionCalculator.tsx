import { useState } from 'react';
import { Plus, Trash2, Calculator, TrendingDown, DollarSign, Percent, UserPlus } from 'lucide-react';
import type { PricingPlan, AddOnFeature } from '../types/forecast';
import { formatCurrency } from '../utils/calculations';

interface AffiliateEntry {
  id: string;
  affiliateType: string;
  affiliateRate: number;
}

interface CommissionScenario {
  id: string;
  name: string;
  affiliates: AffiliateEntry[];
  selectedPlans: Record<string, number>;
  selectedAddOns: Record<string, number>;
}

interface AffiliateCommissionCalculatorProps {
  pricingPlans: PricingPlan[];
  addOnFeatures: AddOnFeature[];
}

const AFFILIATE_TYPES = [
  { name: 'Field Agent', rate: 8.0 },
  { name: 'Regional Manager', rate: 4.0 },
  { name: 'Country Manager', rate: 4.0 },
  { name: 'Affiliate', rate: 10.0 },
];

export default function AffiliateCommissionCalculator({
  pricingPlans,
  addOnFeatures,
}: AffiliateCommissionCalculatorProps) {
  const [scenarios, setScenarios] = useState<CommissionScenario[]>([
    {
      id: crypto.randomUUID(),
      name: 'Scenario 1',
      affiliates: [
        {
          id: crypto.randomUUID(),
          affiliateType: 'Field Agent',
          affiliateRate: 8.0,
        }
      ],
      selectedPlans: {},
      selectedAddOns: {},
    },
  ]);

  function addScenario() {
    setScenarios([
      ...scenarios,
      {
        id: crypto.randomUUID(),
        name: `Scenario ${scenarios.length + 1}`,
        affiliates: [
          {
            id: crypto.randomUUID(),
            affiliateType: 'Field Agent',
            affiliateRate: 8.0,
          }
        ],
        selectedPlans: {},
        selectedAddOns: {},
      },
    ]);
  }

  function removeScenario(id: string) {
    setScenarios(scenarios.filter((s) => s.id !== id));
  }

  function addAffiliateToScenario(scenarioId: string) {
    setScenarios(
      scenarios.map((s) =>
        s.id === scenarioId
          ? {
              ...s,
              affiliates: [
                ...s.affiliates,
                {
                  id: crypto.randomUUID(),
                  affiliateType: 'Field Agent',
                  affiliateRate: 8.0,
                },
              ],
            }
          : s
      )
    );
  }

  function removeAffiliateFromScenario(scenarioId: string, affiliateId: string) {
    setScenarios(
      scenarios.map((s) =>
        s.id === scenarioId
          ? {
              ...s,
              affiliates: s.affiliates.filter((a) => a.id !== affiliateId),
            }
          : s
      )
    );
  }

  function updateAffiliateType(scenarioId: string, affiliateId: string, type: string) {
    const affiliateType = AFFILIATE_TYPES.find((a) => a.name === type);
    if (!affiliateType) return;

    setScenarios(
      scenarios.map((s) =>
        s.id === scenarioId
          ? {
              ...s,
              affiliates: s.affiliates.map((a) =>
                a.id === affiliateId
                  ? { ...a, affiliateType: type, affiliateRate: affiliateType.rate }
                  : a
              ),
            }
          : s
      )
    );
  }

  function updateScenarioName(scenarioId: string, name: string) {
    setScenarios(
      scenarios.map((s) =>
        s.id === scenarioId ? { ...s, name } : s
      )
    );
  }

  function updatePlanQuantity(scenarioId: string, planId: string, quantity: number) {
    setScenarios(
      scenarios.map((s) =>
        s.id === scenarioId
          ? {
              ...s,
              selectedPlans: {
                ...s.selectedPlans,
                [planId]: quantity > 0 ? quantity : 0,
              },
            }
          : s
      )
    );
  }

  function updateAddOnQuantity(scenarioId: string, addOnId: string, quantity: number) {
    setScenarios(
      scenarios.map((s) =>
        s.id === scenarioId
          ? {
              ...s,
              selectedAddOns: {
                ...s.selectedAddOns,
                [addOnId]: quantity > 0 ? quantity : 0,
              },
            }
          : s
      )
    );
  }

  function calculateScenarioCommission(scenario: CommissionScenario): number {
    let total = 0;

    scenario.affiliates.forEach((affiliate) => {
      Object.entries(scenario.selectedPlans).forEach(([planId, quantity]) => {
        const plan = pricingPlans.find((p) => p.id === planId);
        if (plan && quantity > 0) {
          total += plan.price * quantity * (affiliate.affiliateRate / 100);
        }
      });

      Object.entries(scenario.selectedAddOns).forEach(([addOnId, quantity]) => {
        const addOn = addOnFeatures.find((a) => a.id === addOnId);
        if (addOn && quantity > 0) {
          total += addOn.price * quantity * (affiliate.affiliateRate / 100);
        }
      });
    });

    return total;
  }

  function calculateScenarioRevenue(scenario: CommissionScenario): number {
    let total = 0;

    Object.entries(scenario.selectedPlans).forEach(([planId, quantity]) => {
      const plan = pricingPlans.find((p) => p.id === planId);
      if (plan && quantity > 0) {
        total += plan.price * quantity;
      }
    });

    Object.entries(scenario.selectedAddOns).forEach(([addOnId, quantity]) => {
      const addOn = addOnFeatures.find((a) => a.id === addOnId);
      if (addOn && quantity > 0) {
        total += addOn.price * quantity;
      }
    });

    return total;
  }

  const totalCommission = scenarios.reduce(
    (sum, scenario) => sum + calculateScenarioCommission(scenario),
    0
  );

  const totalGrossRevenue = scenarios.reduce(
    (sum, scenario) => sum + calculateScenarioRevenue(scenario),
    0
  );

  const netRevenue = totalGrossRevenue - totalCommission;
  const profitMargin = totalGrossRevenue > 0 ? ((netRevenue / totalGrossRevenue) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Affiliate Commission Calculator</h2>
              <p className="text-sm text-slate-600">
                Calculate commissions for different affiliate types and package combinations
              </p>
            </div>
          </div>

          <button
            onClick={addScenario}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Scenario
          </button>
        </div>

        <div className="space-y-6">
          {scenarios.map((scenario, index) => {
            const scenarioTotal = calculateScenarioCommission(scenario);

            return (
              <div
                key={scenario.id}
                className="border border-slate-200 rounded-lg p-5 bg-slate-50"
              >
                <div className="flex items-center justify-between mb-4">
                  <input
                    type="text"
                    value={scenario.name}
                    onChange={(e) => updateScenarioName(scenario.id, e.target.value)}
                    className="text-lg font-semibold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-900 focus:outline-none px-2 py-1"
                  />
                  {scenarios.length > 1 && (
                    <button
                      onClick={() => removeScenario(scenario.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-slate-700">
                      Affiliates Receiving Commissions
                    </label>
                    <button
                      onClick={() => addAffiliateToScenario(scenario.id)}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      <UserPlus className="w-3 h-3" />
                      Add Affiliate
                    </button>
                  </div>
                  <div className="space-y-2">
                    {scenario.affiliates.map((affiliate) => (
                      <div key={affiliate.id} className="flex items-center gap-2 bg-white p-3 rounded-lg border border-slate-200">
                        <select
                          value={affiliate.affiliateType}
                          onChange={(e) =>
                            updateAffiliateType(scenario.id, affiliate.id, e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                        >
                          {AFFILIATE_TYPES.map((type) => (
                            <option key={type.name} value={type.name}>
                              {type.name} ({type.rate}% commission)
                            </option>
                          ))}
                        </select>
                        {scenario.affiliates.length > 1 && (
                          <button
                            onClick={() => removeAffiliateFromScenario(scenario.id, affiliate.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    Total commission rate: {scenario.affiliates.reduce((sum, a) => sum + a.affiliateRate, 0).toFixed(1)}%
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">
                      Pricing Plans
                    </h4>
                    <div className="space-y-3">
                      {pricingPlans.map((plan) => {
                        const quantity = scenario.selectedPlans[plan.id] || 0;
                        const totalCommission = scenario.affiliates.reduce(
                          (sum, affiliate) =>
                            quantity > 0
                              ? sum + plan.price * quantity * (affiliate.affiliateRate / 100)
                              : sum,
                          0
                        );

                        return (
                          <div
                            key={plan.id}
                            className="bg-white border border-slate-200 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <div className="font-medium text-slate-900">
                                  {plan.name}
                                </div>
                                <div className="text-sm text-slate-600">
                                  {formatCurrency(plan.price)}/month
                                </div>
                              </div>
                              <input
                                type="number"
                                min="0"
                                value={quantity || ''}
                                onChange={(e) =>
                                  updatePlanQuantity(
                                    scenario.id,
                                    plan.id,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                                placeholder="Qty"
                              />
                            </div>
                            {quantity > 0 && (
                              <div>
                                <div className="text-sm text-green-600 font-semibold mb-1">
                                  Total Commission: {formatCurrency(totalCommission)}
                                </div>
                                {scenario.affiliates.length > 1 && (
                                  <div className="text-xs text-slate-600 space-y-0.5">
                                    {scenario.affiliates.map((affiliate) => (
                                      <div key={affiliate.id}>
                                        {affiliate.affiliateType}: {formatCurrency(plan.price * quantity * (affiliate.affiliateRate / 100))}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">
                      Add-on Features
                    </h4>
                    <div className="space-y-3">
                      {addOnFeatures.map((addOn) => {
                        const quantity = scenario.selectedAddOns[addOn.id] || 0;
                        const totalCommission = scenario.affiliates.reduce(
                          (sum, affiliate) =>
                            quantity > 0
                              ? sum + addOn.price * quantity * (affiliate.affiliateRate / 100)
                              : sum,
                          0
                        );

                        return (
                          <div
                            key={addOn.id}
                            className="bg-white border border-slate-200 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <div className="font-medium text-slate-900">
                                  {addOn.name}
                                </div>
                                <div className="text-sm text-slate-600">
                                  {formatCurrency(addOn.price)}/month
                                </div>
                              </div>
                              <input
                                type="number"
                                min="0"
                                value={quantity || ''}
                                onChange={(e) =>
                                  updateAddOnQuantity(
                                    scenario.id,
                                    addOn.id,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                                placeholder="Qty"
                              />
                            </div>
                            {quantity > 0 && (
                              <div>
                                <div className="text-sm text-green-600 font-semibold mb-1">
                                  Total Commission: {formatCurrency(totalCommission)}
                                </div>
                                {scenario.affiliates.length > 1 && (
                                  <div className="text-xs text-slate-600 space-y-0.5">
                                    {scenario.affiliates.map((affiliate) => (
                                      <div key={affiliate.id}>
                                        {affiliate.affiliateType}: {formatCurrency(addOn.price * quantity * (affiliate.affiliateRate / 100))}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-300">
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-green-50 rounded p-2">
                      <div className="text-xs text-green-700 mb-1">Revenue</div>
                      <div className="text-sm font-bold text-green-900">
                        {formatCurrency(calculateScenarioRevenue(scenario))}
                      </div>
                    </div>
                    <div className="bg-red-50 rounded p-2">
                      <div className="text-xs text-red-700 mb-1">Commission</div>
                      <div className="text-sm font-bold text-red-900">
                        {formatCurrency(scenarioTotal)}
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded p-2">
                      <div className="text-xs text-blue-700 mb-1">Net</div>
                      <div className="text-sm font-bold text-blue-900">
                        {formatCurrency(calculateScenarioRevenue(scenario) - scenarioTotal)}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-600">
                      Margin: {calculateScenarioRevenue(scenario) > 0 ? (((calculateScenarioRevenue(scenario) - scenarioTotal) / calculateScenarioRevenue(scenario)) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Financial Impact Analysis</h2>
            <p className="text-sm text-slate-600">
              How affiliate commissions affect your revenue and profitability
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-700" />
              <div className="text-xs font-semibold text-green-700 uppercase">Gross Revenue</div>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(totalGrossRevenue)}
            </div>
            <div className="text-xs text-green-700 mt-1">Total from all scenarios</div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-700" />
              <div className="text-xs font-semibold text-red-700 uppercase">Commission Cost</div>
            </div>
            <div className="text-2xl font-bold text-red-900">
              {formatCurrency(totalCommission)}
            </div>
            <div className="text-xs text-red-700 mt-1">
              {totalGrossRevenue > 0 ? ((totalCommission / totalGrossRevenue) * 100).toFixed(1) : 0}% of gross revenue
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-700" />
              <div className="text-xs font-semibold text-blue-700 uppercase">Net Revenue</div>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(netRevenue)}
            </div>
            <div className="text-xs text-blue-700 mt-1">After commission payout</div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-4 h-4 text-slate-700" />
              <div className="text-xs font-semibold text-slate-700 uppercase">Profit Margin</div>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {profitMargin.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-700 mt-1">Net revenue / Gross revenue</div>
          </div>
        </div>

        <div className="mt-6 bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Annual Projections</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-slate-600 mb-1">Annual Gross Revenue</div>
              <div className="text-lg font-bold text-slate-900">
                {formatCurrency(totalGrossRevenue * 12)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-600 mb-1">Annual Commission Cost</div>
              <div className="text-lg font-bold text-red-700">
                {formatCurrency(totalCommission * 12)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-600 mb-1">Annual Net Revenue</div>
              <div className="text-lg font-bold text-blue-700">
                {formatCurrency(netRevenue * 12)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-lg border border-slate-700 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Total Monthly Commission Payout
            </h3>
            <p className="text-sm text-slate-300">
              Combined total from all scenarios
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-white">
              {formatCurrency(totalCommission)}
            </div>
            <div className="text-sm text-slate-300 mt-1">per month</div>
          </div>
        </div>
      </div>
    </div>
  );
}
