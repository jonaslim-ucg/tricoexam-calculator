import { BarChart3, Calendar, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/calculations';
import type { Calculations, OnboardingRow } from '../types/forecast';

const SESSION_DELIVERY_DEFAULT = 125;
const BUNDLE_DELIVERY_DEFAULT = 375;

function OnboardingServicesSummaryCard({ onboardingRows }: { onboardingRows: OnboardingRow[] }) {
  const sessionRows = onboardingRows.filter((r) => r.upgrade_type === 'session');
  const bundleRows = onboardingRows.filter((r) => r.upgrade_type === 'bundle');
  const totalRevenue =
    sessionRows.reduce((s, r) => s + r.price * r.customers, 0) +
    bundleRows.reduce((s, r) => s + r.price * r.customers, 0);
  const totalDeliveryCost =
    sessionRows.reduce((s, r) => s + SESSION_DELIVERY_DEFAULT * r.customers, 0) +
    bundleRows.reduce((s, r) => s + BUNDLE_DELIVERY_DEFAULT * r.customers, 0);
  const totalGrossProfit = totalRevenue - totalDeliveryCost;
  const marginPct = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-sky-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Onboarding Services Summary</h2>
          <p className="text-sm text-slate-500">One-time revenue and costs</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg bg-sky-50 px-4 py-3">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">One-Time Revenue</div>
          <div className="text-lg font-bold text-slate-900 tabular-nums mt-1">${totalRevenue.toLocaleString()}</div>
        </div>
        <div className="rounded-lg bg-sky-50 px-4 py-3">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Delivery Costs</div>
          <div className="text-lg font-bold text-slate-900 tabular-nums mt-1">${totalDeliveryCost.toLocaleString()}</div>
        </div>
        <div className="rounded-lg bg-sky-50 px-4 py-3">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Gross Profit</div>
          <div className="text-lg font-bold text-green-600 tabular-nums mt-1">${totalGrossProfit.toLocaleString()}</div>
        </div>
        <div className="rounded-lg bg-sky-50 px-4 py-3">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Margin</div>
          <div className="text-lg font-bold text-slate-900 tabular-nums mt-1">{marginPct.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}

interface SummarySectionProps {
  calculations: Calculations;
  onboardingRows?: OnboardingRow[];
}

export default function SummarySection({ calculations, onboardingRows = [] }: SummarySectionProps) {
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

      {onboardingRows.length > 0 && (
        <OnboardingServicesSummaryCard onboardingRows={onboardingRows} />
      )}

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
