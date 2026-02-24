import { useState } from 'react';
import { UserPlus, DollarSign, ChevronDown, ChevronRight } from 'lucide-react';
import type { OnboardingConfig, OnboardingUpgrade, PlanKey } from '../types/plans';

const PLAN_LABELS: Record<PlanKey, string> = {
  basic: 'Basic',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

function marginRange(price: number, costMin: number, costMax: number): string {
  if (price <= 0) return '—';
  const minMargin = ((price - costMax) / price) * 100;
  const maxMargin = ((price - costMin) / price) * 100;
  return `${Math.round(minMargin)}–${Math.round(maxMargin)}%`;
}

interface OnboardingOptionsCardProps {
  config: OnboardingConfig;
  onChange: (config: OnboardingConfig) => void;
}

export default function OnboardingOptionsCard({ config, onChange }: OnboardingOptionsCardProps) {
  function updateUpgrade(index: number, updates: Partial<OnboardingUpgrade>) {
    const next = config.upgrades.map((u, i) => (i === index ? { ...u, ...updates } : u));
    onChange({ ...config, upgrades: next });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1 mb-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
          <UserPlus className="w-4 h-4 text-emerald-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Onboarding Options + True Cost Summary</h2>
      </div>

      {config.upgrades.map((upgrade, index) => (
        <OnboardingUpgradeRowCard
          key={index}
          upgrade={upgrade}
          index={index}
          onUpdate={(u) => updateUpgrade(index, u)}
        />
      ))}

      <OnboardingContractorRowCard config={config} onChange={onChange} />
    </div>
  );
}

function OnboardingUpgradeRowCard({
  upgrade,
  index,
  onUpdate,
}: {
  upgrade: OnboardingUpgrade;
  index: number;
  onUpdate: (u: Partial<OnboardingUpgrade>) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div
        className="flex flex-wrap items-center gap-4 p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <button type="button" className="p-0.5 text-slate-400" aria-label={expanded ? 'Collapse' : 'Expand'}>
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        <span className="font-semibold text-slate-900">Upgrade {index + 1}: {upgrade.name}</span>
        {(['basic', 'professional', 'enterprise'] as PlanKey[]).map((plan) => (
          <label key={plan} className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <span className="text-slate-500 text-xs">{PLAN_LABELS[plan]}</span>
            <span className="text-slate-400">$</span>
            <input type="number" min={0} value={upgrade.pricePerPlan[plan]} onChange={(e) => onUpdate({ pricePerPlan: { ...upgrade.pricePerPlan, [plan]: Number(e.target.value) || 0 } })} className="w-16 px-2 py-1 border border-slate-300 rounded text-sm" />
            <input type="number" min={0} value={upgrade.customersPerPlan[plan]} onChange={(e) => onUpdate({ customersPerPlan: { ...upgrade.customersPerPlan, [plan]: Number(e.target.value) || 0 } })} className="w-12 px-2 py-1 border border-slate-300 rounded text-sm" placeholder="cust" title="Customers" />
          </label>
        ))}
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100 space-y-2" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm text-slate-600 pt-3">{upgrade.description}</p>
          <p className="text-xs text-slate-500">True delivery: {upgrade.trueDeliveryTime} · True cost: ${upgrade.trueCostMin}–${upgrade.trueCostMax}</p>
          <p className="text-xs text-slate-600">Margin: {(['basic', 'professional', 'enterprise'] as PlanKey[]).map((plan) => `${PLAN_LABELS[plan]} ${marginRange(upgrade.pricePerPlan[plan], upgrade.trueCostMin, upgrade.trueCostMax)}`).join(' · ')}</p>
        </div>
      )}
    </div>
  );
}

function OnboardingContractorRowCard({ config, onChange }: OnboardingOptionsCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div
        className="flex flex-wrap items-center gap-4 p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <button type="button" className="p-0.5 text-slate-400" aria-label={expanded ? 'Collapse' : 'Expand'}>
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        <DollarSign className="w-4 h-4 text-amber-600" />
        <span className="font-semibold text-slate-900">Contractor pay &amp; guardrails</span>
        <span className="text-slate-500 text-sm">Customers (U1):</span>
        {(['basic', 'professional', 'enterprise'] as PlanKey[]).map((plan) => (
          <span key={plan} className="text-slate-600 text-sm">
            {PLAN_LABELS[plan]} {config.upgrades[0]?.customersPerPlan[plan] ?? 0}
          </span>
        ))}
        <span className="text-slate-500 text-sm">(U2):</span>
        {(['basic', 'professional', 'enterprise'] as PlanKey[]).map((plan) => (
          <span key={plan} className="text-slate-600 text-sm">
            {PLAN_LABELS[plan]} {config.upgrades[1]?.customersPerPlan[plan] ?? 0}
          </span>
        ))}
        <label className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <span className="text-slate-500 text-sm">Session $</span>
          <input type="number" min={0} value={config.contractorPayPerSession} onChange={(e) => onChange({ ...config, contractorPayPerSession: Number(e.target.value) || 0 })} className="w-16 px-2 py-1 border border-slate-300 rounded text-sm" />
        </label>
        <label className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <span className="text-slate-500 text-sm">Bundle $</span>
          <input type="number" min={0} value={config.contractorPayPerBundle} onChange={(e) => onChange({ ...config, contractorPayPerBundle: Number(e.target.value) || 0 })} className="w-16 px-2 py-1 border border-slate-300 rounded text-sm" />
        </label>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100 space-y-3" onClick={(e) => e.stopPropagation()}>
          <div className="pt-3">
            <h3 className="text-sm font-semibold text-slate-800 mb-1">Included (All Plans): Basic Onboarding</h3>
            <p className="text-sm text-slate-600">{config.includedDescription}</p>
            <p className="text-xs text-slate-500 mt-0.5">{config.includedCostNote}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">Guardrails</h3>
            <p className="text-sm text-slate-600 whitespace-pre-line">{config.guardrailsDescription}</p>
          </div>
        </div>
      )}
    </div>
  );
}
