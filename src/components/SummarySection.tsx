import { BarChart3, Calendar, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/calculations';
import type { Calculations } from '../types/forecast';

interface SummarySectionProps {
  calculations: Calculations;
}

export default function SummarySection({ calculations }: SummarySectionProps) {
  const metrics = [
    {
      label: 'Monthly Revenue',
      value: formatCurrency(calculations.monthlyRevenue),
      icon: DollarSign,
      color: 'green',
    },
    {
      label: 'Monthly Expenses',
      value: formatCurrency(calculations.totalMonthlyExpenses),
      icon: AlertCircle,
      color: 'red',
    },
    {
      label: 'Monthly Profit',
      value: formatCurrency(calculations.monthlyProfit),
      icon: TrendingUp,
      color: calculations.monthlyProfit >= 0 ? 'green' : 'red',
    },
    {
      label: 'Break-even Period',
      value: `${formatNumber(calculations.breakEvenMonths, 1)} months`,
      icon: Calendar,
      color: 'blue',
    },
  ];

  const annualMetrics = [
    { label: 'Annual Revenue', value: formatCurrency(calculations.annualRevenue) },
    { label: 'Annual Operating Expenses', value: formatCurrency(calculations.annualOperatingExpenses) },
    { label: 'Annual Marketing Expenses', value: formatCurrency(calculations.annualMarketingExpenses) },
    { label: 'Net Annual Cash Flow', value: formatCurrency(calculations.annualProfit) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const colorClasses = {
            green: 'bg-green-100 text-green-600',
            red: 'bg-red-100 text-red-600',
            blue: 'bg-blue-100 text-blue-600',
          }[metric.color];

          return (
            <div
              key={metric.label}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-sm text-slate-600">{metric.label}</div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{metric.value}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Annual Projections</h2>
            <p className="text-sm text-slate-600">12-month forecast summary</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {annualMetrics.map((metric) => (
            <div key={metric.label} className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-sm text-slate-600 mb-2">{metric.label}</div>
              <div className="text-xl font-semibold text-slate-900">{metric.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-slate-900 text-white rounded-lg">
          <div className="text-center">
            <div className="text-sm opacity-90 mb-1">Break-even Time after Marketing Costs</div>
            <div className="text-3xl font-bold">
              {formatNumber(calculations.breakEvenMonths, 2)} Months
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
