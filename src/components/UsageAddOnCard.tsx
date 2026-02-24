import { useState } from 'react';
import { HardDrive, Image, ChevronDown, ChevronRight } from 'lucide-react';
import type { PlanKey, StorageAddOnConfig, ImageScansAddOnConfig, IncludedStoragePerPlan, IncludedImagesPerPlan } from '../types/plans';

const PLAN_LABELS: Record<PlanKey, string> = {
  basic: 'Basic',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

/** Compute max packs and total reachable for Basic and Pro; Enterprise is unlimited. */
function deriveStorageGuardrails(
  included: IncludedStoragePerPlan,
  packSizeGb: number
): { plan: PlanKey; maxPacks: number; totalReachableGb: number; unlimited: boolean }[] {
  if (packSizeGb <= 0) {
    return [
      { plan: 'basic', maxPacks: 0, totalReachableGb: included.basic, unlimited: false },
      { plan: 'professional', maxPacks: 0, totalReachableGb: included.professional, unlimited: false },
      { plan: 'enterprise', maxPacks: 0, totalReachableGb: included.enterprise, unlimited: true },
    ];
  }
  const basicCap = included.professional;
  const basicMaxPacks = Math.max(0, Math.floor((basicCap - included.basic) / packSizeGb));
  const basicTotal = Math.min(basicCap, included.basic + basicMaxPacks * packSizeGb);

  const proCap = included.enterprise;
  const proMaxPacks = Math.max(0, Math.floor((proCap - included.professional) / packSizeGb));
  const proTotal = Math.min(proCap, included.professional + proMaxPacks * packSizeGb);

  return [
    { plan: 'basic', maxPacks: basicMaxPacks, totalReachableGb: basicTotal, unlimited: false },
    { plan: 'professional', maxPacks: proMaxPacks, totalReachableGb: proTotal, unlimited: false },
    { plan: 'enterprise', maxPacks: 0, totalReachableGb: included.enterprise, unlimited: true },
  ];
}

function deriveImagesGuardrails(
  included: IncludedImagesPerPlan,
  packSizeImages: number
): { plan: PlanKey; maxPacks: number; totalReachable: number; unlimited: boolean }[] {
  if (packSizeImages <= 0) {
    return [
      { plan: 'basic', maxPacks: 0, totalReachable: included.basic, unlimited: false },
      { plan: 'professional', maxPacks: 0, totalReachable: included.professional, unlimited: false },
      { plan: 'enterprise', maxPacks: 0, totalReachable: included.enterprise, unlimited: true },
    ];
  }
  const basicCap = included.professional;
  const basicMaxPacks = Math.max(0, Math.floor((basicCap - included.basic) / packSizeImages));
  const basicTotal = Math.min(basicCap, included.basic + basicMaxPacks * packSizeImages);

  const proCap = included.enterprise;
  const proMaxPacks = Math.max(0, Math.floor((proCap - included.professional) / packSizeImages));
  const proTotal = Math.min(proCap, included.professional + proMaxPacks * packSizeImages);

  return [
    { plan: 'basic', maxPacks: basicMaxPacks, totalReachable: basicTotal, unlimited: false },
    { plan: 'professional', maxPacks: proMaxPacks, totalReachable: proTotal, unlimited: false },
    { plan: 'enterprise', maxPacks: 0, totalReachable: included.enterprise, unlimited: true },
  ];
}

interface StorageAddOnCardProps {
  config: StorageAddOnConfig;
  onChange: (config: StorageAddOnConfig) => void;
  includedStoragePerPlan: IncludedStoragePerPlan;
}

export function StorageAddOnCard({ config, onChange, includedStoragePerPlan }: StorageAddOnCardProps) {
  const [expanded, setExpanded] = useState(false);
  const guardrails = deriveStorageGuardrails(includedStoragePerPlan, config.packSizeGb);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div
        className="flex flex-wrap items-center gap-4 p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <button type="button" className="p-0.5 text-slate-400" aria-label={expanded ? 'Collapse' : 'Expand'}>
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
          <HardDrive className="w-4 h-4 text-slate-600" />
        </div>
        <span className="font-semibold text-slate-900">Additional Storage</span>
        <span className="text-slate-500 text-sm">Pack</span>
        <input type="number" min={1} value={config.packSizeGb} onChange={(e) => { e.stopPropagation(); onChange({ ...config, packSizeGb: Number(e.target.value) || 0 }); }} onClick={(e) => e.stopPropagation()} className="w-16 px-2 py-1 border border-slate-300 rounded text-sm" />
        <span className="text-slate-500 text-sm">GB</span>
        <span className="text-slate-500">$</span>
        <input type="number" min={0} value={config.pricePerPack} onChange={(e) => { e.stopPropagation(); onChange({ ...config, pricePerPack: Number(e.target.value) || 0 }); }} onClick={(e) => e.stopPropagation()} className="w-20 px-2 py-1 border border-slate-300 rounded text-sm" />
        <span className="text-slate-500 text-sm">/pack/mo</span>
        <label className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <span className="text-slate-500 text-sm">Customers</span>
          <input type="number" min={0} value={config.customers} onChange={(e) => onChange({ ...config, customers: Number(e.target.value) || 0 })} className="w-16 px-2 py-1 border border-slate-300 rounded text-sm" />
        </label>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-3 mb-2">Plan guardrails (read-only)</h4>
          <ul className="space-y-1 text-sm">
            {guardrails.map((g) => (
              <li key={g.plan} className="flex items-center gap-2">
                <span className="font-medium text-slate-700 w-24">{PLAN_LABELS[g.plan]}:</span>
                {g.unlimited ? <span className="text-slate-600">Unlimited packs</span> : <span className="text-slate-600">max {g.maxPacks} pack{g.maxPacks !== 1 ? 's' : ''} → total {g.totalReachableGb}GB</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface ImageScansAddOnCardProps {
  config: ImageScansAddOnConfig;
  onChange: (config: ImageScansAddOnConfig) => void;
  includedImagesPerPlan: IncludedImagesPerPlan;
}

export function ImageScansAddOnCard({ config, onChange, includedImagesPerPlan }: ImageScansAddOnCardProps) {
  const [expanded, setExpanded] = useState(false);
  const guardrails = deriveImagesGuardrails(includedImagesPerPlan, config.packSizeImages);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div
        className="flex flex-wrap items-center gap-4 p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <button type="button" className="p-0.5 text-slate-400" aria-label={expanded ? 'Collapse' : 'Expand'}>
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
          <Image className="w-4 h-4 text-slate-600" />
        </div>
        <span className="font-semibold text-slate-900">Additional Image Analytic Scans</span>
        <span className="text-slate-500 text-sm">Pack</span>
        <input type="number" min={0} step={1000} value={config.packSizeImages} onChange={(e) => { e.stopPropagation(); onChange({ ...config, packSizeImages: Number(e.target.value) || 0 }); }} onClick={(e) => e.stopPropagation()} className="w-20 px-2 py-1 border border-slate-300 rounded text-sm" />
        <span className="text-slate-500 text-sm">images</span>
        <span className="text-slate-500">$</span>
        <input type="number" min={0} value={config.pricePerPack} onChange={(e) => { e.stopPropagation(); onChange({ ...config, pricePerPack: Number(e.target.value) || 0 }); }} onClick={(e) => e.stopPropagation()} className="w-20 px-2 py-1 border border-slate-300 rounded text-sm" />
        <span className="text-slate-500 text-sm">/pack/mo</span>
        <label className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <span className="text-slate-500 text-sm">Customers</span>
          <input type="number" min={0} value={config.customers} onChange={(e) => onChange({ ...config, customers: Number(e.target.value) || 0 })} className="w-16 px-2 py-1 border border-slate-300 rounded text-sm" />
        </label>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-3 mb-2">Plan guardrails (read-only)</h4>
          <ul className="space-y-1 text-sm">
            {guardrails.map((g) => (
              <li key={g.plan} className="flex items-center gap-2">
                <span className="font-medium text-slate-700 w-24">{PLAN_LABELS[g.plan]}:</span>
                {g.unlimited ? <span className="text-slate-600">Unlimited packs</span> : <span className="text-slate-600">max {g.maxPacks} pack{g.maxPacks !== 1 ? 's' : ''} → total {g.totalReachable.toLocaleString()} scans</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
