import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Settings,
  Shield,
  Loader2,
  Download,
  Upload,
  Check,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import TechSupportSection from './TechSupportSection';
import OnboardingOptionsCard from './OnboardingOptionsCard';
import SurgicalServicesCard from './SurgicalServicesCard';
import { StorageAddOnCard, ImageScansAddOnCard } from './UsageAddOnCard';
import type {
  PlanModel,
  PlanDefaults,
  PlanGuardrails,
  TechSupportConfig,
  StorageAddOnConfig,
  ImageScansAddOnConfig,
  OnboardingConfig,
  SurgicalServicesConfig,
} from '../types/plans';
import type { ForecastScenario } from '../types/forecast';

const DEFAULT_PLANS: PlanModel[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 99,
    customers: 20,
    additionalUsers: 0,
    tagline: 'Solo provider starter',
    displayOrder: 1,
    defaults: { providers: 1, staff: 1, storageGb: 5, images: 5000 },
    guardrails: {
      maxProviders: 1,
      maxStaff: 2,
      maxUsers: 3,
      note: 'Additional providers not allowed. Max 3 total users to protect Pro as growth step.',
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 389,
    customers: 20,
    additionalUsers: 0,
    tagline: 'Growing practice',
    displayOrder: 2,
    defaults: { providers: 1, staff: 4, storageGb: 10, images: 10000 },
    guardrails: {
      maxProviders: 2,
      maxStaff: 9,
      maxUsers: 12,
      note: 'If they add a 2nd provider, require at least 2 staff.',
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 899,
    customers: 10,
    additionalUsers: 0,
    tagline: 'Multi-provider / high volume',
    displayOrder: 3,
    defaults: { providers: 2, staff: 8, storageGb: 20, images: 25000 },
    guardrails: {
      maxProviders: null,
      maxStaff: null,
      maxUsers: null,
      minProviders: 2,
      note: 'Keep Enterprise as 2+ providers; no cap for true scale.',
    },
  },
];

/** Suggested Tech Support pricing: tier price covers plan included users (providers + staff); seat add-on for extra users */
function getDefaultTechSupportConfig(): TechSupportConfig {
  return {
    tiers: [
      {
        id: crypto.randomUUID(),
        displayOrder: 0,
        name: 'Standard',
        responseTime: '48 business hours',
        channels: ['Email'],
        pricePerPlan: { basic: 0, professional: 0, enterprise: 0 },
        seatPricePerPlan: { basic: 0, professional: 0, enterprise: 0 },
        isIncluded: true,
      },
      {
        id: crypto.randomUUID(),
        displayOrder: 1,
        name: 'Priority',
        responseTime: '24 business hours',
        channels: ['Email', 'Chat'],
        pricePerPlan: { basic: 39, professional: 79, enterprise: 149 },
        seatPricePerPlan: { basic: 10, professional: 10, enterprise: 8 },
        isIncluded: false,
      },
      {
        id: crypto.randomUUID(),
        displayOrder: 2,
        name: 'Urgent',
        responseTime: '4 business hours',
        channels: ['Email', 'Chat', 'Phone', 'Zoom'],
        pricePerPlan: { basic: 99, professional: 199, enterprise: 349 },
        seatPricePerPlan: { basic: 25, professional: 25, enterprise: 20 },
        isIncluded: false,
      },
    ],
    customersPerPlan: { basic: 10, professional: 15, enterprise: 5 },
    seatPricingEnabled: true,
    availableOnPlans: { basic: true, professional: true, enterprise: true },
  };
}

/** Included users per plan = providers + staff from plan defaults (Basic 2, Pro 5, Enterprise 10) */
function getIncludedUsersPerPlan(plans: PlanModel[]): { basic: number; professional: number; enterprise: number } {
  const sorted = [...plans].sort((a, b) => a.displayOrder - b.displayOrder);
  const byName = (name: string) => sorted.find((p) => p.name.toLowerCase().includes(name.toLowerCase()));
  const p = (plan: PlanModel | undefined) =>
    plan ? plan.defaults.providers + plan.defaults.staff : 0;
  return {
    basic: p(byName('Basic') ?? sorted[0]),
    professional: p(byName('Professional') ?? sorted[1]),
    enterprise: p(byName('Enterprise') ?? sorted[2]),
  };
}

/** Included storage (GB) per plan from plan defaults — for usage add-on guardrails. */
function getIncludedStoragePerPlan(plans: PlanModel[]): { basic: number; professional: number; enterprise: number } {
  const sorted = [...plans].sort((a, b) => a.displayOrder - b.displayOrder);
  const byName = (name: string) => sorted.find((p) => p.name.toLowerCase().includes(name.toLowerCase()));
  const s = (plan: PlanModel | undefined) => plan?.defaults.storageGb ?? 0;
  return {
    basic: s(byName('Basic') ?? sorted[0]),
    professional: s(byName('Professional') ?? sorted[1]),
    enterprise: s(byName('Enterprise') ?? sorted[2]),
  };
}

/** Included image scans per plan from plan defaults — for usage add-on guardrails. */
function getIncludedImagesPerPlan(plans: PlanModel[]): { basic: number; professional: number; enterprise: number } {
  const sorted = [...plans].sort((a, b) => a.displayOrder - b.displayOrder);
  const byName = (name: string) => sorted.find((p) => p.name.toLowerCase().includes(name.toLowerCase()));
  const i = (plan: PlanModel | undefined) => plan?.defaults.images ?? 0;
  return {
    basic: i(byName('Basic') ?? sorted[0]),
    professional: i(byName('Professional') ?? sorted[1]),
    enterprise: i(byName('Enterprise') ?? sorted[2]),
  };
}

/** Default onboarding options; revenue-related fields (pricing, contractor pay) are editable. */
function getDefaultOnboardingConfig(): OnboardingConfig {
  return {
    includedDescription: 'Setup checklist + quick-start videos + email guidance',
    includedCostNote: 'Cost to deliver: minimal (near $0 marginal; automated + light email)',
    upgrades: [
      {
        name: 'Provider Onboarding Session (1× 60-min Zoom)',
        description: 'Includes: scheduling + prep + live training + recap email',
        trueDeliveryTime: '~2.0–2.5 hrs total',
        trueCostMin: 100,
        trueCostMax: 125,
        pricePerPlan: { basic: 299, professional: 399, enterprise: 499 },
        customersPerPlan: { basic: 5, professional: 8, enterprise: 3 },
      },
      {
        name: 'Provider Onboarding Bundle (3× 60-min Zoom Sessions)',
        description: 'Includes: scheduling + prep + 3 live sessions + recap emails',
        trueDeliveryTime: '~6.0–7.5 hrs total',
        trueCostMin: 300,
        trueCostMax: 375,
        pricePerPlan: { basic: 799, professional: 1049, enterprise: 1299 },
        customersPerPlan: { basic: 2, professional: 4, enterprise: 2 },
      },
    ],
    contractorPayPerSession: 125,
    contractorPayPerBundle: 375,
    guardrailsDescription: `Scope: standard setup + training only (no migrations, custom builds, integrations)
Follow-up: included recap + limited email follow-up (e.g., 30 min / 7 days)
Scheduling/reschedules: 24-hr notice; limit scheduling attempts
Extra time = paid time blocks / hourly add-on`,
  };
}

/** Default Surgical Services Pack; revenue-related fields are editable. */
function getDefaultSurgicalServicesConfig(): SurgicalServicesConfig {
  return {
    description: 'Standard Surgery Quote + Surgical Workflow + Standard Post-Op Automated Emails',
    monthlyPricePerPlan: { basic: 129, professional: 219, enterprise: 349 },
    customersPerPlan: { basic: 8, professional: 12, enterprise: 6 },
    volumeTiers: [
      { minVolume: 0, maxVolume: 10, addOnPrice: 0 },
      { minVolume: 11, maxVolume: 25, addOnPrice: 150 },
      { minVolume: 26, maxVolume: 50, addOnPrice: 300 },
      { minVolume: 51, maxVolume: 100, addOnPrice: 600 },
      { minVolume: 100, maxVolume: null, addOnPrice: 0, label: 'custom' },
    ],
    includedSurgicalProvidersPerPlan: { basic: 1, professional: 1, enterprise: 2 },
    additionalProviderPricePerMonth: 75,
    emailIncludedPerMonth: 3000,
    emailOveragePricePer1000: 25,
    oneTimeOptions: {
      enableOnlyDescription: 'Turn on standard series (no review)',
      activationDescription: 'Provider review + approval + configuration',
      activationPrice: 0,
      customizationDescription: 'Edits + timing adjustments + QA (2 sessions, 2 edit rounds)',
      customizationPrice: 0,
    },
  };
}

interface PlanFeaturesManagerProps {
  onBack: () => void;
}

export default function PlanFeaturesManager({ onBack }: PlanFeaturesManagerProps) {
  const [plans, setPlans] = useState<PlanModel[]>(() =>
    DEFAULT_PLANS.map((p) => ({ ...p, id: crypto.randomUUID(), name: p.name, price: p.price, customers: p.customers, additionalUsers: p.additionalUsers }))
  );
  const [techSupport, setTechSupport] = useState<TechSupportConfig>(getDefaultTechSupportConfig);
  const [storageAddOn, setStorageAddOn] = useState<StorageAddOnConfig>({
    packSizeGb: 5,
    pricePerPack: 20,
    customers: 10,
  });
  const [imageScansAddOn, setImageScansAddOn] = useState<ImageScansAddOnConfig>({
    packSizeImages: 5000,
    pricePerPack: 59,
    customers: 10,
  });
  const [onboardingConfig, setOnboardingConfig] = useState<OnboardingConfig>(getDefaultOnboardingConfig);
  const [surgicalServicesConfig, setSurgicalServicesConfig] = useState<SurgicalServicesConfig>(getDefaultSurgicalServicesConfig);

  const [scenarios, setScenarios] = useState<ForecastScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [loadSaveStatus, setLoadSaveStatus] = useState<'idle' | 'loading' | 'saved' | 'error'>('idle');

  useEffect(() => {
    loadScenarios();
  }, []);

  async function loadScenarios() {
    const { data } = await supabase
      .from('forecast_scenarios')
      .select('*')
      .order('created_at', { ascending: false });
    if (data?.length) {
      setScenarios(data);
      if (!selectedScenarioId) setSelectedScenarioId(data[0].id);
    }
  }

  async function loadFromScenario() {
    if (!selectedScenarioId) return;
    setLoadSaveStatus('loading');
    try {
      const [plansRes, addOnsRes] = await Promise.all([
        supabase.from('pricing_plans').select('*').eq('scenario_id', selectedScenarioId).order('display_order'),
        supabase.from('add_on_features').select('*').eq('scenario_id', selectedScenarioId),
      ]);
      if (plansRes.data?.length) {
        setPlans(
          plansRes.data.map((p: { id: string; name: string; price: number; display_order?: number; customers?: number }, i: number) => {
            const template = DEFAULT_PLANS[i] ?? DEFAULT_PLANS[0];
            return {
              id: p.id,
              name: p.name.replace(/\s+Plan$/, '') || template.name,
              price: p.price,
              customers: p.customers ?? template.customers,
              additionalUsers: template.additionalUsers,
              tagline: template.tagline,
              displayOrder: p.display_order ?? i + 1,
              defaults: template.defaults,
              guardrails: template.guardrails,
            };
          })
        );
      }
      if (addOnsRes.data?.length) {
        // Optionally map add-ons to support tiers / support seat if names match; for now we only sync plans
      }
      setLoadSaveStatus('saved');
      setTimeout(() => setLoadSaveStatus('idle'), 2000);
    } catch (e) {
      console.error(e);
      setLoadSaveStatus('error');
      setTimeout(() => setLoadSaveStatus('idle'), 2000);
    }
  }

  async function saveToScenario() {
    if (!selectedScenarioId) return;
    setLoadSaveStatus('loading');
    try {
      const { data: existing } = await supabase
        .from('pricing_plans')
        .select('id, display_order')
        .eq('scenario_id', selectedScenarioId)
        .order('display_order');
      if (existing?.length) {
        for (let i = 0; i < Math.min(existing.length, plans.length); i++) {
          const plan = plans[i];
          const nameForDb = plan.name.replace(/\s+Plan$/i, '') + ' Plan';
          await supabase
            .from('pricing_plans')
            .update({ name: nameForDb, price: plan.price, customers: plan.customers })
            .eq('id', existing[i].id);
        }
      }
      setLoadSaveStatus('saved');
      setTimeout(() => setLoadSaveStatus('idle'), 2000);
    } catch (e) {
      console.error(e);
      setLoadSaveStatus('error');
      setTimeout(() => setLoadSaveStatus('idle'), 2000);
    }
  }

  function updatePlan(id: string, updates: Partial<PlanModel>) {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Plan & Features Manager</h1>
                <p className="text-sm text-slate-600">
                  Manage pricing plans, defaults, guardrails, and support add-ons
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={selectedScenarioId ?? ''}
                onChange={(e) => setSelectedScenarioId(e.target.value || null)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="">No scenario</option>
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                onClick={loadFromScenario}
                disabled={!selectedScenarioId || loadSaveStatus === 'loading'}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                {loadSaveStatus === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Load from scenario
              </button>
              <button
                onClick={saveToScenario}
                disabled={!selectedScenarioId || loadSaveStatus === 'loading'}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loadSaveStatus === 'saved' ? (
                  <Check className="w-4 h-4" />
                ) : loadSaveStatus === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Save to scenario
              </button>
            </div>
          </div>
          {loadSaveStatus === 'saved' && (
            <p className="mt-2 text-sm text-green-600">Saved successfully.</p>
          )}
          {loadSaveStatus === 'error' && (
            <p className="mt-2 text-sm text-red-600">Something went wrong. Check console.</p>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Pricing plans — row cards with collapse */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-600" />
            Pricing plans
          </h2>
          <div className="space-y-2">
            {plans.map((plan) => (
              <PlanRowCard key={plan.id} plan={plan} onUpdate={(u) => updatePlan(plan.id, u)} />
            ))}
          </div>
        </section>

        {/* Usage-based add-ons: Storage and Image Scans — row cards with collapse */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Usage-based add-ons</h2>
          <div className="space-y-2">
            <StorageAddOnCard
              config={storageAddOn}
              onChange={setStorageAddOn}
              includedStoragePerPlan={getIncludedStoragePerPlan(plans)}
            />
            <ImageScansAddOnCard
              config={imageScansAddOn}
              onChange={setImageScansAddOn}
              includedImagesPerPlan={getIncludedImagesPerPlan(plans)}
            />
          </div>
        </section>

        {/* Tech Support add-on — light card, row (customers per plan) + collapse. */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Tech Support add-on</h2>
          <TechSupportSection
            config={techSupport}
            onChange={setTechSupport}
            includedUsersPerPlan={getIncludedUsersPerPlan(plans)}
          />
        </section>

        {/* Onboarding options + true cost summary. Editable: recommended pricing and contractor pay. */}
        <section>
          <OnboardingOptionsCard config={onboardingConfig} onChange={setOnboardingConfig} />
        </section>

        {/* Surgical Services Pack add-on. Editable: monthly price per plan, volume tiers, additional provider, email overage, one-time options. */}
        <section>
          <SurgicalServicesCard config={surgicalServicesConfig} onChange={setSurgicalServicesConfig} />
        </section>
      </main>
    </div>
  );
}

function PlanRowCard({ plan, onUpdate }: { plan: PlanModel; onUpdate: (u: Partial<PlanModel>) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const { defaults, guardrails } = plan;

  function updateDefaults(updates: Partial<PlanDefaults>) {
    onUpdate({ defaults: { ...defaults, ...updates } });
  }
  function updateGuardrails(updates: Partial<PlanGuardrails>) {
    onUpdate({ guardrails: { ...guardrails, ...updates } });
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
        <span className="font-semibold text-slate-900 min-w-[100px]">{plan.name}</span>
        <span className="text-slate-600 text-sm">$</span>
        <input
          type="number"
          min={0}
          value={plan.price}
          onChange={(e) => { e.stopPropagation(); onUpdate({ price: Number(e.target.value) || 0 }); }}
          onClick={(e) => e.stopPropagation()}
          className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
        />
        <span className="text-slate-500 text-sm">/mo</span>
        <label className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <span className="text-slate-500 text-sm">Customers</span>
          <input
            type="number"
            min={0}
            value={plan.customers}
            onChange={(e) => onUpdate({ customers: Number(e.target.value) || 0 })}
            className="w-16 px-2 py-1 border border-slate-300 rounded text-sm"
          />
        </label>
        <label className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <span className="text-slate-500 text-sm">Add’l users</span>
          <input
            type="number"
            min={0}
            value={plan.additionalUsers}
            onChange={(e) => onUpdate({ additionalUsers: Number(e.target.value) || 0 })}
            className="w-14 px-2 py-1 border border-slate-300 rounded text-sm"
          />
        </label>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100 space-y-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 pt-3">
            <input
              type="text"
              value={plan.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="font-semibold text-slate-900 border border-slate-300 rounded px-2 py-1 w-40"
            />
            <input
              type="text"
              value={plan.tagline}
              onChange={(e) => onUpdate({ tagline: e.target.value })}
              placeholder="Tagline"
              className="text-sm text-slate-500 border border-slate-300 rounded px-2 py-1 flex-1 max-w-xs"
            />
            <button type="button" onClick={() => setEditing(!editing)} className="text-xs text-indigo-600 hover:underline">
              {editing ? 'Done' : 'Edit details'}
            </button>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Defaults</h4>
            {editing ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {(['providers', 'staff', 'storageGb', 'images'] as const).map((k) => (
                  <label key={k} className="flex items-center gap-2">
                    <span className="text-slate-600 w-20">{k === 'storageGb' ? 'Storage (GB)' : k === 'images' ? 'Images' : k}</span>
                    <input
                      type="number"
                      min={0}
                      value={defaults[k]}
                      onChange={(e) => updateDefaults({ [k]: Number(e.target.value) || 0 })}
                      className="w-20 px-2 py-1 border border-slate-300 rounded"
                    />
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-700">{defaults.providers} Provider(s), {defaults.staff} Staff · {defaults.storageGb} GB, {defaults.images.toLocaleString()} images</p>
            )}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Guardrails</h4>
            {editing ? (
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2"><span className="w-24">Max providers</span><input type="number" min={0} value={guardrails.maxProviders ?? ''} onChange={(e) => updateGuardrails({ maxProviders: e.target.value === '' ? null : Number(e.target.value) })} placeholder="No cap" className="w-20 px-2 py-1 border rounded" /></label>
                <label className="flex items-center gap-2"><span className="w-24">Max staff</span><input type="number" min={0} value={guardrails.maxStaff ?? ''} onChange={(e) => updateGuardrails({ maxStaff: e.target.value === '' ? null : Number(e.target.value) })} placeholder="No cap" className="w-20 px-2 py-1 border rounded" /></label>
                <label className="flex items-center gap-2"><span className="w-24">Max users</span><input type="number" min={0} value={guardrails.maxUsers ?? ''} onChange={(e) => updateGuardrails({ maxUsers: e.target.value === '' ? null : Number(e.target.value) })} placeholder="No cap" className="w-20 px-2 py-1 border rounded" /></label>
                <label className="flex items-center gap-2"><span className="w-24">Min providers</span><input type="number" min={0} value={guardrails.minProviders ?? ''} onChange={(e) => updateGuardrails({ minProviders: e.target.value === '' ? undefined : Number(e.target.value) })} className="w-20 px-2 py-1 border rounded" /></label>
                <input type="text" value={guardrails.note ?? ''} onChange={(e) => updateGuardrails({ note: e.target.value || undefined })} placeholder="Note" className="w-full px-2 py-1 border rounded text-sm" />
              </div>
            ) : (
              <p className="text-sm text-slate-700">Max providers: {guardrails.maxProviders ?? 'No cap'} · Max staff: {guardrails.maxStaff ?? 'No cap'} · Max users: {guardrails.maxUsers ?? 'No cap'}{guardrails.minProviders != null ? ` · Min providers: ${guardrails.minProviders}` : ''}. {guardrails.note}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
