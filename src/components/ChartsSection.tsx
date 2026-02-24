import { BarChart3 } from 'lucide-react';
import type { Calculations, PricingPlan, AddOnFeature } from '../types/forecast';

interface ChartsSectionProps {
  calculations: Calculations;
  pricingPlans: PricingPlan[];
  addOnFeatures: AddOnFeature[];
}

export default function ChartsSection({ calculations, pricingPlans, addOnFeatures }: ChartsSectionProps) {
  const maxValue = Math.max(
    calculations.monthlyRevenue,
    calculations.totalMonthlyExpenses
  );

  const revenuePercentage = (calculations.monthlyRevenue / maxValue) * 100;
  const expensePercentage = (calculations.totalMonthlyExpenses / maxValue) * 100;
  const profitPercentage = (calculations.monthlyProfit / maxValue) * 100;

  const totalPlanRevenue = pricingPlans.reduce((sum, plan) => sum + (plan.price * plan.customers), 0);
  const totalAddOnRevenue = addOnFeatures.reduce((sum, addon) => sum + (addon.price * addon.customers), 0);
  const totalRevenue = totalPlanRevenue + totalAddOnRevenue;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Visual Analytics</h2>
          <p className="text-sm text-slate-600">Revenue and expense breakdown</p>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Monthly Cash Flow</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-700">Revenue</span>
                <span className="text-sm font-semibold text-slate-900">
                  ${calculations.monthlyRevenue.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-8 bg-slate-100 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500 flex items-center justify-end px-3"
                  style={{ width: `${revenuePercentage}%` }}
                >
                  <span className="text-xs font-semibold text-white">
                    {revenuePercentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-700">Total Expenses</span>
                <span className="text-sm font-semibold text-slate-900">
                  ${calculations.totalMonthlyExpenses.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-8 bg-slate-100 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-500 flex items-center justify-end px-3"
                  style={{ width: `${expensePercentage}%` }}
                >
                  <span className="text-xs font-semibold text-white">
                    {expensePercentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-700">Net Profit</span>
                <span className="text-sm font-semibold text-slate-900">
                  ${calculations.monthlyProfit.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-8 bg-slate-100 rounded-lg overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 flex items-center justify-end px-3 ${
                    calculations.monthlyProfit >= 0 ? 'bg-blue-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.abs(profitPercentage)}%` }}
                >
                  <span className="text-xs font-semibold text-white">
                    {Math.abs(profitPercentage).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Revenue Distribution</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-600 mb-1">Plan Revenue</div>
              <div className="text-lg font-bold text-slate-900">${totalPlanRevenue.toLocaleString()}</div>
              <div className="text-xs text-slate-500">
                {totalRevenue > 0 ? ((totalPlanRevenue / totalRevenue) * 100).toFixed(1) : 0}% of total
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-600 mb-1">Add-on Revenue</div>
              <div className="text-lg font-bold text-slate-900">${totalAddOnRevenue.toLocaleString()}</div>
              <div className="text-xs text-slate-500">
                {totalRevenue > 0 ? ((totalAddOnRevenue / totalRevenue) * 100).toFixed(1) : 0}% of total
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-700 uppercase mb-2">Pricing Plans</div>
            {pricingPlans.map((plan) => {
              const planRevenue = plan.price * plan.customers;
              const planPercentage = totalRevenue > 0 ? (planRevenue / totalRevenue) * 100 : 0;

              return (
                <div key={plan.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-700">{plan.name}</span>
                    <span className="text-sm font-semibold text-slate-900">
                      ${planRevenue.toLocaleString()} ({plan.customers} customers)
                    </span>
                  </div>
                  <div className="w-full h-6 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-slate-700 to-slate-900 transition-all duration-500 flex items-center justify-end px-2"
                      style={{ width: `${planPercentage}%` }}
                    >
                      {planPercentage > 5 && (
                        <span className="text-xs font-semibold text-white">
                          {planPercentage.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="text-xs font-semibold text-slate-700 uppercase mb-2 mt-4">Add-on Features</div>
            {addOnFeatures.map((addon) => {
              const addonRevenue = addon.price * addon.customers;
              const addonPercentage = totalRevenue > 0 ? (addonRevenue / totalRevenue) * 100 : 0;

              return (
                <div key={addon.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-700">{addon.name}</span>
                    <span className="text-sm font-semibold text-slate-900">
                      ${addonRevenue.toLocaleString()} ({addon.customers} customers)
                    </span>
                  </div>
                  <div className="w-full h-6 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500 flex items-center justify-end px-2"
                      style={{ width: `${addonPercentage}%` }}
                    >
                      {addonPercentage > 5 && (
                        <span className="text-xs font-semibold text-white">
                          {addonPercentage.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Expense Breakdown</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-700">Operating Expenses</span>
                <span className="text-sm font-semibold text-slate-900">
                  ${calculations.monthlyOperatingExpenses.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-6 bg-slate-100 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-500 flex items-center justify-end px-2"
                  style={{
                    width: `${(calculations.monthlyOperatingExpenses / calculations.totalMonthlyExpenses) * 100}%`,
                  }}
                >
                  <span className="text-xs font-semibold text-white">
                    {((calculations.monthlyOperatingExpenses / calculations.totalMonthlyExpenses) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-700">Marketing Expenses</span>
                <span className="text-sm font-semibold text-slate-900">
                  ${calculations.monthlyMarketingExpenses.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-6 bg-slate-100 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-500 flex items-center justify-end px-2"
                  style={{
                    width: `${(calculations.monthlyMarketingExpenses / calculations.totalMonthlyExpenses) * 100}%`,
                  }}
                >
                  <span className="text-xs font-semibold text-white">
                    {((calculations.monthlyMarketingExpenses / calculations.totalMonthlyExpenses) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
