import { useState, useRef, useEffect } from 'react';
import {
  Headphones,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  X,
  CircleDot,
} from 'lucide-react';
import type {
  TechSupportConfig,
  TechSupportTier,
  SupportChannel,
  PlanKey,
  IncludedUsersPerPlan,
} from '../types/plans';
import { SUPPORT_CHANNELS } from '../types/plans';

const PLAN_LABELS: Record<PlanKey, string> = {
  basic: 'Basic',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

interface TechSupportSectionProps {
  config: TechSupportConfig;
  onChange: (config: TechSupportConfig) => void;
  /** Included users per plan (providers + staff). Shows "Covers X users" when set. */
  includedUsersPerPlan?: IncludedUsersPerPlan;
}

export default function TechSupportSection({ config, onChange, includedUsersPerPlan }: TechSupportSectionProps) {
  const initialConfigRef = useRef<string>(JSON.stringify(config));
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setHasUnsavedChanges(JSON.stringify(config) !== initialConfigRef.current);
  }, [config]);

  function updateConfig(updates: Partial<TechSupportConfig>) {
    onChange({ ...config, ...updates });
  }

  function updateTier(id: string, updates: Partial<TechSupportTier>) {
    updateConfig({
      tiers: config.tiers.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    });
  }

  function setIncludedTier(id: string) {
    updateConfig({
      tiers: config.tiers.map((t) => ({ ...t, isIncluded: t.id === id })),
    });
  }

  function addChannel(tierId: string, channel: SupportChannel) {
    const tier = config.tiers.find((t) => t.id === tierId);
    if (!tier || tier.channels.includes(channel)) return;
    updateTier(tierId, { channels: [...tier.channels, channel] });
  }

  function removeChannel(tierId: string, channel: SupportChannel) {
    const tier = config.tiers.find((t) => t.id === tierId);
    if (!tier) return;
    updateTier(tierId, { channels: tier.channels.filter((c) => c !== channel) });
  }

  function addTier() {
    const maxOrder = Math.max(0, ...config.tiers.map((t) => t.displayOrder));
    const newTier: TechSupportTier = {
      id: crypto.randomUUID(),
      displayOrder: maxOrder + 1,
      name: 'New Tier',
      responseTime: '24 business hours',
      channels: ['Email'],
      pricePerPlan: { basic: 0, professional: 0, enterprise: 0 },
      seatPricePerPlan: { basic: 0, professional: 0, enterprise: 0 },
      isIncluded: config.tiers.length === 0,
    };
    updateConfig({ tiers: [...config.tiers, newTier].sort((a, b) => a.displayOrder - b.displayOrder) });
  }

  function removeTier(id: string) {
    const removed = config.tiers.find((t) => t.id === id);
    const next = config.tiers.filter((t) => t.id !== id);
    if (removed?.isIncluded && next.length > 0) {
      next[0] = { ...next[0], isIncluded: true };
    }
    updateConfig({ tiers: next });
  }

  function moveTier(id: string, direction: 'up' | 'down') {
    const sorted = [...config.tiers].sort((a, b) => a.displayOrder - b.displayOrder);
    const idx = sorted.findIndex((t) => t.id === id);
    if (idx < 0) return;
    const swap = direction === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= sorted.length) return;
    const newTiers = config.tiers.map((t) => {
      if (t.id === sorted[idx].id) return { ...t, displayOrder: sorted[swap].displayOrder };
      if (t.id === sorted[swap].id) return { ...t, displayOrder: sorted[idx].displayOrder };
      return t;
    });
    updateConfig({ tiers: newTiers });
  }

  const sortedTiers = [...config.tiers].sort((a, b) => a.displayOrder - b.displayOrder);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div
        className="p-4 flex flex-wrap items-center gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <button type="button" className="p-0.5 text-slate-400" aria-label={expanded ? 'Collapse' : 'Expand'}>
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
          <Headphones className="w-5 h-5 text-slate-600" />
        </div>
        <span className="font-semibold text-slate-900">Tech Support Add-on</span>
        <span className="text-slate-500 text-sm">Customers</span>
        {(['basic', 'professional', 'enterprise'] as PlanKey[]).map((plan) => (
          <label key={plan} className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <span className="text-slate-500 text-sm">{PLAN_LABELS[plan]}</span>
            <input
              type="number"
              min={0}
              value={config.customersPerPlan[plan]}
              onChange={(e) => updateConfig({ customersPerPlan: { ...config.customersPerPlan, [plan]: Number(e.target.value) || 0 } })}
              className="w-14 px-2 py-1 rounded border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>
        ))}
        {hasUnsavedChanges && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-600 text-xs font-medium ml-auto">
            <CircleDot className="w-3.5 h-3.5" />
            Unsaved changes
          </span>
        )}
      </div>

      {expanded && (
      <div className="p-4 pt-0 space-y-6 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
        {/* Tiers */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800">Tiers</h3>
            <button
              type="button"
              onClick={addTier}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm hover:bg-slate-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add tier
            </button>
          </div>

          <div className="space-y-3">
            {sortedTiers.map((tier, index) => (
              <TierCard
                key={tier.id}
                tier={tier}
                isFirst={index === 0}
                isLast={index === sortedTiers.length - 1}
                seatPricingEnabled={config.seatPricingEnabled}
                includedUsersPerPlan={includedUsersPerPlan}
                onUpdate={(u) => updateTier(tier.id, u)}
                onSetIncluded={() => setIncludedTier(tier.id)}
                onAddChannel={(ch) => addChannel(tier.id, ch)}
                onRemoveChannel={(ch) => removeChannel(tier.id, ch)}
                onMoveUp={() => moveTier(tier.id, 'up')}
                onMoveDown={() => moveTier(tier.id, 'down')}
                onDelete={() => removeTier(tier.id)}
              />
            ))}
          </div>
        </div>

        {/* Seat pricing toggle — per-tier seat prices shown in each tier card when enabled */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Per-seat pricing</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Charge per extra user beyond plan included users (users = providers + staff). Each tier can have its own seat price per plan.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-slate-600">Enable</span>
              <input
                type="checkbox"
                checked={config.seatPricingEnabled}
                onChange={(e) => updateConfig({ seatPricingEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
              />
            </label>
          </div>
        </div>

        {/* Plan availability */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Plan availability</h3>
          <div className="flex flex-wrap gap-6">
            {(['basic', 'professional', 'enterprise'] as PlanKey[]).map((plan) => (
              <label key={plan} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.availableOnPlans[plan]}
                  onChange={(e) =>
                    updateConfig({
                      availableOnPlans: { ...config.availableOnPlans, [plan]: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                />
                <span className="text-sm text-slate-700">{PLAN_LABELS[plan]}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

interface TierCardProps {
  tier: TechSupportTier;
  isFirst: boolean;
  isLast: boolean;
  seatPricingEnabled: boolean;
  includedUsersPerPlan?: IncludedUsersPerPlan;
  onUpdate: (u: Partial<TechSupportTier>) => void;
  onSetIncluded: () => void;
  onAddChannel: (ch: SupportChannel) => void;
  onRemoveChannel: (ch: SupportChannel) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

function TierCard({
  tier,
  isFirst,
  isLast,
  seatPricingEnabled,
  includedUsersPerPlan,
  onUpdate,
  onSetIncluded,
  onAddChannel,
  onRemoveChannel,
  onMoveUp,
  onMoveDown,
  onDelete,
}: TierCardProps) {
  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false);
  const availableChannels = SUPPORT_CHANNELS.filter((c) => !tier.channels.includes(c));

  return (
    <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex flex-col gap-0.5 shrink-0">
          <button type="button" onClick={onMoveUp} disabled={isFirst} className="p-1 rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Move up">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button type="button" onClick={onMoveDown} disabled={isLast} className="p-1 rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Move down">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <input type="text" value={tier.name} onChange={(e) => onUpdate({ name: e.target.value })} placeholder="Tier name" className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-40" />
            <input type="text" value={tier.responseTime} onChange={(e) => onUpdate({ responseTime: e.target.value })} placeholder="e.g. 4 business hours" className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44" />
            <label className="flex items-center gap-2 cursor-pointer ml-auto">
              <input type="radio" name="included-tier" checked={tier.isIncluded} onChange={onSetIncluded} className="w-3.5 h-3.5 border-slate-300 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0" />
              <span className="text-xs text-slate-600">Included (default)</span>
            </label>
            <button type="button" onClick={onDelete} className="p-1.5 rounded text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors ml-auto" aria-label="Delete tier">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {tier.channels.map((ch) => (
              <span key={ch} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 text-xs">
                {ch}
                <button type="button" onClick={() => onRemoveChannel(ch)} className="p-0.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800" aria-label={`Remove ${ch}`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {availableChannels.length > 0 && (
              <div className="relative">
                <button type="button" onClick={() => setChannelDropdownOpen((o) => !o)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-dashed border-slate-300 text-slate-500 text-xs hover:border-slate-400 hover:text-slate-700 transition-colors">
                  <Plus className="w-3 h-3" />
                  Add channel
                </button>
                {channelDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" aria-hidden onClick={() => setChannelDropdownOpen(false)} />
                    <ul className="absolute left-0 top-full mt-1 z-20 py-1 rounded-lg bg-white border border-slate-200 shadow-lg min-w-[120px]">
                      {availableChannels.map((ch) => (
                        <li key={ch}>
                          <button type="button" onClick={() => { onAddChannel(ch); setChannelDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                            {ch}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <span className="text-xs text-slate-500">Tier price {includedUsersPerPlan ? '(covers plan users)' : ''}:</span>
            {(['basic', 'professional', 'enterprise'] as PlanKey[]).map((plan) => (
              <label key={plan} className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 w-20">{PLAN_LABELS[plan]}{includedUsersPerPlan && <span className="block text-slate-600">({includedUsersPerPlan[plan]} users)</span>}</span>
                <span className="text-slate-500">$</span>
                <input type="number" min={0} step={1} value={tier.pricePerPlan[plan]} onChange={(e) => onUpdate({ pricePerPlan: { ...tier.pricePerPlan, [plan]: Number(e.target.value) || 0 } })} disabled={tier.isIncluded} className="w-16 px-2 py-1 rounded bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed" />
              </label>
            ))}
          </div>
          {seatPricingEnabled && !tier.isIncluded && (
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-200 mt-2">
              <span className="text-xs text-slate-500">Support seat add-on (/user/mo):</span>
              {(['basic', 'professional', 'enterprise'] as PlanKey[]).map((plan) => (
                <label key={plan} className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 w-20">{PLAN_LABELS[plan]}</span>
                  <span className="text-slate-500">$</span>
                  <input type="number" min={0} step={1} value={tier.seatPricePerPlan[plan]} onChange={(e) => onUpdate({ seatPricePerPlan: { ...tier.seatPricePerPlan, [plan]: Number(e.target.value) || 0 } })} className="w-14 px-2 py-1 rounded bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
