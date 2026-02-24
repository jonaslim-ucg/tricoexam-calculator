import { TrendingUp, Plus, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { MarketingCost, PricingPlan } from "../types/forecast";

interface MarketingCostsSectionProps {
  scenarioId: string;
  marketingCosts: MarketingCost[];
  pricingPlans: PricingPlan[];
  onUpdate: () => void;
}

export default function MarketingCostsSection({
  scenarioId,
  marketingCosts,
  pricingPlans,
  onUpdate,
}: MarketingCostsSectionProps) {
  async function updateMarketingCost(
    id: string,
    field: keyof MarketingCost,
    value: string | number,
  ) {
    await supabase
      .from("marketing_costs")
      .update({ [field]: value })
      .eq("id", id);
    onUpdate();
  }

  async function addNewMarketingCost() {
    await supabase.from("marketing_costs").insert({
      scenario_id: scenarioId,
      name: "New Marketing Cost",
      rate: 0,
      price_plan: "Basic",
      customers: 20,
    });
    onUpdate();
  }

  async function deleteMarketingCost(id: string) {
    await supabase.from("marketing_costs").delete().eq("id", id);
    onUpdate();
  }

  function getPlanPriceByName(planName: string): number {
    const normalized = planName.toLowerCase().trim();
    const plan = pricingPlans.find(
      (p) =>
        p.name.toLowerCase() === normalized ||
        p.name.toLowerCase().includes(normalized) ||
        normalized.includes(p.name.toLowerCase())
    );
    return plan?.price ?? 0;
  }

  function calculateCostValue(cost: MarketingCost): number {
    const planPrice = getPlanPriceByName(cost.price_plan);
    return planPrice * cost.customers * (cost.rate / 100);
  }

  const totalMarketingCosts = marketingCosts.reduce(
    (sum, cost) => sum + calculateCostValue(cost),
    0,
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Marketing Costs
          </h2>
          <p className="text-sm text-slate-600">
            Commission-based marketing expenses
          </p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-sm text-slate-600">Total Monthly Marketing</div>
          <div className="text-2xl font-bold text-blue-600">
            ${totalMarketingCosts.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Marketing Items
        </h3>
        <button
          onClick={addNewMarketingCost}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      <div className="space-y-2">
        {marketingCosts.map((cost) => (
          <div
            key={cost.id}
            className="grid grid-cols-5 gap-4 items-center p-3 bg-slate-50 rounded-lg"
          >
            <input
              type="text"
              value={cost.name}
              onChange={(e) =>
                updateMarketingCost(cost.id, "name", e.target.value)
              }
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <div>
              <label className="text-xs text-slate-600 mb-1 block">
                Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={cost.rate}
                onChange={(e) =>
                  updateMarketingCost(
                    cost.id,
                    "rate",
                    parseFloat(e.target.value) || 0,
                  )
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 mb-1 block">
                Price Plan
              </label>
              <select
                value={cost.price_plan}
                onChange={(e) =>
                  updateMarketingCost(cost.id, "price_plan", e.target.value)
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {pricingPlans.map((plan) => (
                  <option key={plan.id} value={plan.name.replace(" Plan", "")}>
                    {plan.name.replace(" Plan", "")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-600 mb-1 block">
                Customers
              </label>
              <input
                type="number"
                value={cost.customers}
                onChange={(e) =>
                  updateMarketingCost(
                    cost.id,
                    "customers",
                    parseInt(e.target.value) || 0,
                  )
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-right flex-1">
                <div className="text-xs text-slate-600">Value</div>
                <div className="text-lg font-semibold text-slate-900">
                  ${calculateCostValue(cost).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => deleteMarketingCost(cost.id)}
                className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
