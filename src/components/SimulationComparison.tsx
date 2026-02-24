import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import type { Calculations, SimulationResult, PricingPlan } from '../types/forecast';

interface SimulationComparisonProps {
  currentCalculations: Calculations;
  simulationResult: SimulationResult;
  pricingPlans: PricingPlan[];
  adjustedPrices: Record<string, number>;
}

export default function SimulationComparison({
  currentCalculations,
  simulationResult,
  pricingPlans,
  adjustedPrices,
}: SimulationComparisonProps) {
  const simCalc = simulationResult.calculations;

  function calculateChange(current: number, simulated: number): {
    amount: number;
    percentage: number;
    isPositive: boolean;
  } {
    const amount = simulated - current;
    const percentage = current !== 0 ? (amount / Math.abs(current)) * 100 : 0;
    return {
      amount,
      percentage,
      isPositive: amount > 0,
    };
  }

  const metrics = [
    {
      label: 'Monthly Revenue',
      current: currentCalculations.monthlyRevenue,
      simulated: simCalc.monthlyRevenue,
      isGoodWhenHigher: true,
    },
    {
      label: 'Monthly Operating Expenses',
      current: currentCalculations.monthlyOperatingExpenses,
      simulated: simCalc.monthlyOperatingExpenses,
      isGoodWhenHigher: false,
    },
    {
      label: 'Monthly Profit',
      current: currentCalculations.monthlyProfit,
      simulated: simCalc.monthlyProfit,
      isGoodWhenHigher: true,
    },
    {
      label: 'Annual Profit',
      current: currentCalculations.annualProfit,
      simulated: simCalc.annualProfit,
      isGoodWhenHigher: true,
    },
    {
      label: 'Break-even Months',
      current: currentCalculations.breakEvenMonths,
      simulated: simCalc.breakEvenMonths,
      isGoodWhenHigher: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Simulation Results</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {pricingPlans.map((plan) => {
            const bundledFeatures = simulationResult.bundledFeatures[plan.id] || [];
            const originalPrice = plan.price;
            const newPrice = adjustedPrices[plan.id];
            const priceChange = calculateChange(originalPrice, newPrice);

            return (
              <div key={plan.id} className="border border-slate-200 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-3">{plan.name}</h3>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-bold text-slate-900">
                      {formatCurrency(newPrice)}
                    </span>
                    {priceChange.amount !== 0 && (
                      <span
                        className={`text-xs font-semibold ${
                          priceChange.isPositive ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {priceChange.isPositive ? '+' : ''}
                        {priceChange.percentage.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  {priceChange.amount !== 0 && (
                    <div className="text-xs text-slate-500">
                      Was {formatCurrency(originalPrice)}
                    </div>
                  )}
                </div>

                {bundledFeatures.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-700 mb-2">
                      Now Includes:
                    </div>
                    <div className="space-y-1">
                      {bundledFeatures.map((feature) => (
                        <div
                          key={feature.id}
                          className="text-xs text-slate-600 flex items-center gap-1"
                        >
                          <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                          {feature.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          {metrics.map((metric) => {
            const change = calculateChange(metric.current, metric.simulated);
            const isGood =
              metric.isGoodWhenHigher === change.isPositive || change.amount === 0;

            return (
              <div
                key={metric.label}
                className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-700 mb-2">
                      {metric.label}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">Current</div>
                        <div className="text-lg font-semibold text-slate-900">
                          {metric.label.includes('Months')
                            ? `${metric.current.toFixed(1)} mo`
                            : formatCurrency(metric.current)}
                        </div>
                      </div>

                      <ArrowRight className="w-5 h-5 text-slate-400" />

                      <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">Simulated</div>
                        <div className="text-lg font-semibold text-slate-900">
                          {metric.label.includes('Months')
                            ? `${metric.simulated.toFixed(1)} mo`
                            : formatCurrency(metric.simulated)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      change.amount === 0
                        ? 'bg-slate-50'
                        : isGood
                        ? 'bg-green-50'
                        : 'bg-red-50'
                    }`}
                  >
                    {change.amount !== 0 && (
                      <>
                        {change.isPositive ? (
                          <TrendingUp
                            className={`w-5 h-5 ${isGood ? 'text-green-600' : 'text-red-600'}`}
                          />
                        ) : (
                          <TrendingDown
                            className={`w-5 h-5 ${isGood ? 'text-green-600' : 'text-red-600'}`}
                          />
                        )}
                      </>
                    )}
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          change.amount === 0
                            ? 'text-slate-500'
                            : isGood
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {change.amount === 0
                          ? 'No Change'
                          : `${change.isPositive ? '+' : ''}${
                              metric.label.includes('Months')
                                ? change.amount.toFixed(1)
                                : formatCurrency(change.amount)
                            }`}
                      </div>
                      {change.amount !== 0 && (
                        <div
                          className={`text-xs ${
                            isGood ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {change.isPositive ? '+' : ''}
                          {change.percentage.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {simulationResult.remainingAddOns.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Remaining Add-ons ({simulationResult.remainingAddOns.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {simulationResult.remainingAddOns.map((feature) => (
                <div
                  key={feature.id}
                  className="text-sm text-slate-600 px-3 py-2 bg-slate-50 rounded border border-slate-200"
                >
                  {feature.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
