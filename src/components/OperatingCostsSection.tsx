import { Receipt, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { OperatingCost, AddOnFeature } from '../types/forecast';

/** Cost-only add-ons are shown in Revenue section (Extra Storage & AI Image Packs); hide from this list to avoid duplicate editing */
const COST_ONLY_ADDON_NAMES = ['Extra Storage (5GB pack)', 'Image Scans (5k pack)'];

interface OperatingCostsSectionProps {
  scenarioId: string;
  operatingCosts: OperatingCost[];
  addOnFeatures: AddOnFeature[];
  onUpdate: () => void;
}

export default function OperatingCostsSection({
  scenarioId,
  operatingCosts,
  addOnFeatures,
  onUpdate,
}: OperatingCostsSectionProps) {
  async function updateCost(id: string, field: keyof OperatingCost, value: string | number | boolean) {
    await supabase
      .from('operating_costs')
      .update({ [field]: value })
      .eq('id', id);
    onUpdate();
  }

  async function addNewCost() {
    await supabase.from('operating_costs').insert({
      scenario_id: scenarioId,
      name: 'New Cost Item',
      amount: 0,
      is_fixed: true,
      unit_price: 0,
      units: 0,
    });
    onUpdate();
  }

  async function deleteCost(id: string) {
    await supabase.from('operating_costs').delete().eq('id', id);
    onUpdate();
  }

  async function updateAddOnFeature(
    id: string,
    field: keyof AddOnFeature,
    value: string | number
  ) {
    await supabase
      .from('add_on_features')
      .update({ [field]: value })
      .eq('id', id);
    onUpdate();
  }

  const baseCosts = operatingCosts.reduce((sum, cost) => {
    if (cost.is_fixed) {
      return sum + cost.amount;
    } else {
      return sum + (cost.unit_price * cost.units);
    }
  }, 0);

  const addOnCosts = addOnFeatures.reduce(
    (sum, feature) => sum + (feature.operating_cost_per_customer * feature.customers),
    0
  );

  const totalCosts = baseCosts + addOnCosts;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
          <Receipt className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Operating Costs</h2>
          <p className="text-sm text-slate-600">Monthly operating expenses</p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-sm text-slate-600">Total Monthly Expenses</div>
          <div className="text-2xl font-bold text-orange-600">
            ${totalCosts.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Cost Items</h3>
        <button
          onClick={addNewCost}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Cost
        </button>
      </div>

      <div className="space-y-4">
        {operatingCosts.map((cost) => (
          <div
            key={cost.id}
            className="p-3 bg-slate-50 rounded-lg"
          >
            <div className="flex items-center gap-4 mb-2">
              <input
                type="text"
                value={cost.name}
                onChange={(e) => updateCost(cost.id, 'name', e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={cost.is_fixed}
                  onChange={(e) => updateCost(cost.id, 'is_fixed', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300"
                />
                Fixed Cost
              </label>
            </div>

            {cost.is_fixed ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Amount</label>
                  <input
                    type="number"
                    value={cost.amount}
                    onChange={(e) => updateCost(cost.id, 'amount', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-right">
                    <div className="text-xs text-slate-600">Total</div>
                    <div className="text-lg font-semibold text-slate-900">
                      ${cost.amount.toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteCost(cost.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Unit Price</label>
                  <input
                    type="number"
                    value={cost.unit_price}
                    onChange={(e) => updateCost(cost.id, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Units</label>
                  <input
                    type="number"
                    value={cost.units}
                    onChange={(e) => updateCost(cost.id, 'units', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div className="flex items-end justify-between col-span-2">
                  <div className="text-right">
                    <div className="text-xs text-slate-600">Total</div>
                    <div className="text-lg font-semibold text-slate-900">
                      ${(cost.unit_price * cost.units).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteCost(cost.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {addOnFeatures.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Add-on Feature Costs</h3>
          <div className="space-y-2">
            {addOnFeatures
              .filter((f) => !COST_ONLY_ADDON_NAMES.includes(f.name))
              .map((feature) => (
              <div
                key={feature.id}
                className="grid grid-cols-4 gap-4 items-center p-3 bg-slate-50 rounded-lg"
              >
                <div className="text-sm font-medium text-slate-700">{feature.name}</div>
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Cost/Customer</label>
                  <input
                    type="number"
                    value={feature.operating_cost_per_customer}
                    onChange={(e) =>
                      updateAddOnFeature(
                        feature.id,
                        'operating_cost_per_customer',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Customers</label>
                  <input
                    type="number"
                    value={feature.customers}
                    onChange={(e) =>
                      updateAddOnFeature(
                        feature.id,
                        'customers',
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                  />
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-600">Total Cost</div>
                  <div className="text-lg font-semibold text-slate-900">
                    ${(feature.operating_cost_per_customer * feature.customers).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-2 mt-2 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">Subtotal Add-on Costs:</span>
                <span className="text-lg font-bold text-orange-600">${addOnCosts.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
