import { useState } from 'react';
import { Stethoscope, DollarSign, ChevronDown, ChevronRight } from 'lucide-react';
import type { SurgicalServicesConfig, SurgicalVolumeTier, PlanKey } from '../types/plans';

const PLAN_LABELS: Record<PlanKey, string> = {
  basic: 'Basic',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

interface SurgicalServicesCardProps {
  config: SurgicalServicesConfig;
  onChange: (config: SurgicalServicesConfig) => void;
}

export default function SurgicalServicesCard({ config, onChange }: SurgicalServicesCardProps) {
  const [expanded, setExpanded] = useState(false);

  function updateVolumeTier(index: number, updates: Partial<SurgicalVolumeTier>) {
    const next = config.volumeTiers.map((t, i) => (i === index ? { ...t, ...updates } : t));
    onChange({ ...config, volumeTiers: next });
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div
        className="flex flex-wrap items-center gap-4 p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <button type="button" className="p-0.5 text-slate-400" aria-label={expanded ? 'Collapse' : 'Expand'}>
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        <div className="w-8 h-8 rounded bg-rose-100 flex items-center justify-center shrink-0">
          <Stethoscope className="w-4 h-4 text-rose-600" />
        </div>
        <span className="font-semibold text-slate-900">Surgical Services Pack (Add-On)</span>
        {(['basic', 'professional', 'enterprise'] as PlanKey[]).map((plan) => (
          <label key={plan} className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <span className="text-slate-500 text-xs">{PLAN_LABELS[plan]}</span>
            <span className="text-slate-400">$</span>
            <input
              type="number"
              min={0}
              value={config.monthlyPricePerPlan[plan]}
              onChange={(e) => onChange({ ...config, monthlyPricePerPlan: { ...config.monthlyPricePerPlan, [plan]: Number(e.target.value) || 0 } })}
              className="w-16 px-2 py-1 border border-slate-300 rounded text-sm"
            />
            <input
              type="number"
              min={0}
              value={config.customersPerPlan[plan]}
              onChange={(e) => onChange({ ...config, customersPerPlan: { ...config.customersPerPlan, [plan]: Number(e.target.value) || 0 } })}
              className="w-12 px-2 py-1 border border-slate-300 rounded text-sm"
              title="Customers"
            />
          </label>
        ))}
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100 space-y-4" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm text-slate-500 pt-3">{config.description}</p>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Volume tier (add-on/mo)</h4>
            <div className="space-y-2">
              {config.volumeTiers.map((tier, index) => (
                <div key={index} className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-slate-600 w-28">{tier.maxVolume != null ? `${tier.minVolume}–${tier.maxVolume}` : `${tier.minVolume}+`}{tier.label ? ` (${tier.label})` : ''}</span>
                  <span className="text-slate-500">+$</span>
                  <input type="number" min={0} value={tier.addOnPrice} onChange={(e) => updateVolumeTier(index, { addOnPrice: Number(e.target.value) || 0 })} className="w-20 px-2 py-1 border border-slate-300 rounded text-sm" />
                  <span className="text-xs text-slate-500">/mo</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-slate-600">Included providers: Basic {config.includedSurgicalProvidersPerPlan.basic}, Pro {config.includedSurgicalProvidersPerPlan.professional}, Enterprise {config.includedSurgicalProvidersPerPlan.enterprise}</span>
            <label className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Add’l provider +$</span>
              <input type="number" min={0} value={config.additionalProviderPricePerMonth} onChange={(e) => onChange({ ...config, additionalProviderPricePerMonth: Number(e.target.value) || 0 })} className="w-16 px-2 py-1 border border-slate-300 rounded text-sm" />
              <span className="text-xs text-slate-500">/mo</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-slate-600">Included: {config.emailIncludedPerMonth.toLocaleString()} emails/mo</span>
            <label className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Overage +$</span>
              <input type="number" min={0} value={config.emailOveragePricePer1000} onChange={(e) => onChange({ ...config, emailOveragePricePer1000: Number(e.target.value) || 0 })} className="w-16 px-2 py-1 border border-slate-300 rounded text-sm" />
              <span className="text-xs text-slate-500">/1k</span>
            </label>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1"><DollarSign className="w-3 h-3" /> One-time setup</h4>
            <p className="text-sm text-slate-600">{config.oneTimeOptions.enableOnlyDescription}</p>
            <p className="text-sm text-slate-600 mt-1">{config.oneTimeOptions.activationDescription} — $<input type="number" min={0} value={config.oneTimeOptions.activationPrice} onChange={(e) => onChange({ ...config, oneTimeOptions: { ...config.oneTimeOptions, activationPrice: Number(e.target.value) || 0 } })} className="w-16 px-2 py-0.5 border border-slate-300 rounded text-sm inline" /></p>
            <p className="text-sm text-slate-600 mt-1">{config.oneTimeOptions.customizationDescription} — $<input type="number" min={0} value={config.oneTimeOptions.customizationPrice} onChange={(e) => onChange({ ...config, oneTimeOptions: { ...config.oneTimeOptions, customizationPrice: Number(e.target.value) || 0 } })} className="w-16 px-2 py-0.5 border border-slate-300 rounded text-sm inline" /></p>
          </div>
        </div>
      )}
    </div>
  );
}
