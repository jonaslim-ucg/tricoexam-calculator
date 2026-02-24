import { Package } from 'lucide-react';
import type { PricingPlan, AddOnFeature } from '../types/forecast';

interface BundleConfigSectionProps {
  pricingPlans: PricingPlan[];
  addOnFeatures: AddOnFeature[];
  bundleConfig: Record<string, string[]>;
  adjustedPrices: Record<string, number>;
  adjustedCustomers: Record<string, number>;
  onBundleConfigChange: (config: Record<string, string[]>) => void;
  onPriceChange: (prices: Record<string, number>) => void;
  onCustomersChange: (customers: Record<string, number>) => void;
}

export default function BundleConfigSection({
  pricingPlans,
  addOnFeatures,
  bundleConfig,
  adjustedPrices,
  adjustedCustomers,
  onBundleConfigChange,
  onPriceChange,
  onCustomersChange,
}: BundleConfigSectionProps) {
  function toggleFeatureInPlan(planId: string, featureId: string) {
    const currentFeatures = bundleConfig[planId] || [];
    const newConfig = { ...bundleConfig };

    if (currentFeatures.includes(featureId)) {
      newConfig[planId] = currentFeatures.filter((id) => id !== featureId);
    } else {
      newConfig[planId] = [...currentFeatures, featureId];
    }

    onBundleConfigChange(newConfig);
  }

  function updatePlanPrice(planId: string, price: number) {
    onPriceChange({
      ...adjustedPrices,
      [planId]: price,
    });
  }

  function updatePlanCustomers(planId: string, customers: number) {
    onCustomersChange({
      ...adjustedCustomers,
      [planId]: customers,
    });
  }

  function isFeatureBundled(featureId: string): boolean {
    return Object.values(bundleConfig).some((features) => features.includes(featureId));
  }

  function getFeatureByPlan(planId: string): AddOnFeature[] {
    const featureIds = bundleConfig[planId] || [];
    return addOnFeatures.filter((f) => featureIds.includes(f.id));
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Bundle Configuration</h2>
          <p className="text-sm text-slate-600">Select which features to include in each plan</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {pricingPlans.map((plan) => {
          const bundledFeatures = getFeatureByPlan(plan.id);
          const bundledRevenue = bundledFeatures.reduce((sum, f) => sum + f.price, 0);
          const bundledCost = bundledFeatures.reduce((sum, f) => sum + f.operating_cost_per_customer, 0);

          return (
            <div key={plan.id} className="border border-slate-200 rounded-lg p-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{plan.name}</h3>
                <div className="mb-3">
                  <label className="text-xs text-slate-600 mb-1 block">Adjusted Price</label>
                  <input
                    type="number"
                    value={adjustedPrices[plan.id] || plan.price}
                    onChange={(e) => updatePlanPrice(plan.id, parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    Original: ${plan.price}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-xs text-slate-600 mb-1 block">Customer Count</label>
                  <input
                    type="number"
                    value={adjustedCustomers[plan.id] || plan.customers}
                    onChange={(e) => updatePlanCustomers(plan.id, parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    Original: {plan.customers} customers
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-xs font-semibold text-slate-700 uppercase">Bundled Features</div>
                {bundledFeatures.length === 0 ? (
                  <div className="text-sm text-slate-400 italic py-2">No features bundled</div>
                ) : (
                  bundledFeatures.map((feature) => (
                    <div
                      key={feature.id}
                      className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded text-sm"
                    >
                      <span className="text-slate-700">{feature.name}</span>
                      <button
                        onClick={() => toggleFeatureInPlan(plan.id, feature.id)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>

              {bundledFeatures.length > 0 && (
                <div className="pt-3 border-t border-slate-200 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Added Value:</span>
                    <span className="font-semibold text-green-600">+${bundledRevenue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Added Cost/Customer:</span>
                    <span className="font-semibold text-orange-600">+${bundledCost}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Available Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {addOnFeatures.map((feature) => {
            const bundled = isFeatureBundled(feature.id);
            return (
              <div
                key={feature.id}
                className={`p-3 border rounded-lg ${
                  bundled
                    ? 'bg-slate-50 border-slate-300 opacity-50'
                    : 'bg-white border-slate-200 hover:border-slate-400'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-slate-900">{feature.name}</div>
                    <div className="text-xs text-slate-600 mt-1">
                      Revenue: ${feature.price} | Cost: ${feature.operating_cost_per_customer}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  {pricingPlans.map((plan) => {
                    const isInPlan = bundleConfig[plan.id]?.includes(feature.id);
                    return (
                      <button
                        key={plan.id}
                        onClick={() => toggleFeatureInPlan(plan.id, feature.id)}
                        className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                          isInPlan
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {plan.name.replace(' Plan', '')}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
