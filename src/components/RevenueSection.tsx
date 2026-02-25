import {
  DollarSign,
  Headphones,
  Plus,
  Trash2,
  Stethoscope,
  GraduationCap,
  HardDrive,
  Info,
} from "lucide-react";
import { useId, useState, useRef, useLayoutEffect } from "react";
import { supabase } from "../lib/supabase";
import type {
  PricingPlan,
  AddOnFeature,
  TechSupportRow,
  PlanAddonRow,
  SurgicalTierRow,
  SurgicalTierKey,
  SurgicalExtras,
  OnboardingRow,
} from "../types/forecast";

// ─── Shared small components ────────────────────────────────────

const TOOLTIP_WIDTH = 288; // 18rem

function InfoTooltip({ content }: { content: string }) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceRight = typeof window !== "undefined" ? window.innerWidth - rect.right : 0;
    setAlignRight(spaceRight < TOOLTIP_WIDTH);
  }, [open]);

  return (
    <span
      className="relative inline-flex align-middle"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        ref={triggerRef}
        role="button"
        tabIndex={0}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex text-slate-400 hover:text-slate-600 cursor-help rounded focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-1"
        aria-label="More info"
      >
        <Info className="w-3.5 h-3.5 shrink-0" />
      </span>
      {open && (
        <div
          className={`absolute top-full mt-1 z-[100] w-[18rem] max-w-[calc(100vw-2rem)] max-h-[min(16rem,60vh)] overflow-y-auto rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600 shadow-lg whitespace-pre-line normal-case ${alignRight ? "right-0 left-auto" : "left-0"}`}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </span>
  );
}

function NumberField({
  label,
  value,
  onChange,
  prefix,
  tooltip,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  tooltip?: string;
}) {
  const id = useId();
  return (
    <div className="min-w-[5rem] flex-1">
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wide"
      >
        {label}
        {tooltip != null && <InfoTooltip content={tooltip} />}
      </label>
      <div className="relative mt-1">
        {prefix && (
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`w-full rounded-md border border-slate-200 bg-white py-1.5 pr-2 text-sm text-slate-800
            transition-colors
            focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100
            ${prefix ? "pl-6" : "pl-2.5"}`}
        />
      </div>
    </div>
  );
}

function RevenueTag({ amount }: { amount: number }) {
  return (
    <div className="min-w-[5rem] text-right self-end pb-0.5">
      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
        Revenue
      </div>
      <div className="text-base font-bold text-green-600 tabular-nums">
        ${amount.toLocaleString()}
      </div>
    </div>
  );
}

function CustomerBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-green-50 border border-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700 tabular-nums">
      {count} customers
    </span>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
      {children}
    </div>
  );
}

function SectionHeading({
  icon,
  title,
  description,
  tooltip,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  tooltip?: string;
}) {
  return (
    <div className="mb-4">
      <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
        {icon && (
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-100">
            {icon}
          </span>
        )}
        {title}
        {tooltip != null && (
          <span className="inline-flex align-middle">
            <InfoTooltip content={tooltip} />
          </span>
        )}
      </h3>
      {description && (
        <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-2xl">
          {description}
        </p>
      )}
    </div>
  );
}

function TierBadge({ tier }: { tier: "Priority" | "Urgent" }) {
  const styles =
    tier === "Priority"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-red-50 text-red-700 border-red-200";
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${styles}`}
    >
      {tier}
    </span>
  );
}

/** Group an array by a key function */
function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}

// ─── Sub-section components ─────────────────────────────────────

function PlanAddonRowComponent({
  label,
  price,
  quantity,
  onPriceChange,
  onQuantityChange,
  tooltipPrice,
  tooltipQty,
}: {
  label: string;
  price: number;
  quantity: number;
  onPriceChange: (v: number) => void;
  onQuantityChange: (v: number) => void;
  tooltipPrice?: string;
  tooltipQty?: string;
}) {
  return (
    <div className="flex items-end gap-3">
      <span className="text-xs font-medium text-slate-500 pb-2 min-w-[7rem]">
        {label}
      </span>
      <NumberField
        label="Price"
        value={price}
        onChange={onPriceChange}
        prefix="$"
        tooltip={tooltipPrice}
      />
      <NumberField
        label="Qty"
        value={quantity}
        onChange={onQuantityChange}
        tooltip={tooltipQty}
      />
      <RevenueTag amount={price * quantity} />
    </div>
  );
}

function TechSupportTierRow({
  tier,
  row,
  planId,
  onUpdate,
  tooltips,
}: {
  tier: "Priority" | "Urgent";
  row: TechSupportRow;
  planId: string;
  onUpdate: RevenueSectionProps["onUpdateTechSupportRow"];
  tooltips?: {
    tierPrice?: string;
    customers?: string;
    seatAddon?: string;
    seatsAvailed?: string;
  };
}) {
  const revenue =
    row.tier_price * row.customers + row.seat_addon_price * row.extra_seats;
  const t = tooltips;

  return (
    <div className="flex items-end gap-3 flex-wrap">
      <div className="pb-2">
        <TierBadge tier={tier} />
      </div>
      <NumberField
        label="Tier price"
        value={row.tier_price}
        prefix="$"
        onChange={(v) => onUpdate(planId, tier, "tier_price", v)}
        tooltip={t?.tierPrice}
      />
      <NumberField
        label="Customers"
        value={row.customers}
        onChange={(v) => onUpdate(planId, tier, "customers", v)}
        tooltip={t?.customers}
      />

      <div className="flex items-end gap-3 pl-3 border-l-2 border-slate-200">
        <NumberField
          label="Seat add-on ($/user/mo)"
          value={row.seat_addon_price}
          prefix="$"
          onChange={(v) => onUpdate(planId, tier, "seat_addon_price", v)}
          tooltip={t?.seatAddon}
        />
        <NumberField
          label="Seats availed"
          value={row.extra_seats}
          onChange={(v) => onUpdate(planId, tier, "extra_seats", v)}
          tooltip={t?.seatsAvailed}
        />
      </div>

      <RevenueTag amount={revenue} />
    </div>
  );
}

function PricingPlanCard({
  plan,
  staffAddon,
  providerAddon,
  onUpdatePlan,
  onUpdateAddon,
  tooltips,
}: {
  plan: PricingPlan;
  staffAddon?: PlanAddonRow;
  providerAddon?: PlanAddonRow;
  onUpdatePlan: (
    id: string,
    field: keyof PricingPlan,
    value: string | number,
  ) => void;
  onUpdateAddon: RevenueSectionProps["onUpdatePlanAddonRow"];
  tooltips?: {
    price?: string;
    customers?: string;
    staffAddonPrice?: string;
    staffAddonQty?: string;
    providerAddonPrice?: string;
    providerAddonQty?: string;
  };
}) {
  const t = tooltips;
  return (
    <SectionCard>
      <div className="flex items-center justify-between gap-2">
        <input
          type="text"
          value={plan.name}
          onChange={(e) => onUpdatePlan(plan.id, "name", e.target.value)}
          className="flex-1 border-0 border-b border-transparent bg-transparent px-0 py-0.5
            text-sm font-bold text-slate-800 focus:border-green-400 focus:outline-none"
        />
        <CustomerBadge count={plan.customers} />
      </div>

      <div className="flex items-end gap-3">
        <NumberField
          label="Price"
          value={plan.price}
          prefix="$"
          onChange={(v) => onUpdatePlan(plan.id, "price", v)}
          tooltip={t?.price}
        />
        <NumberField
          label="Customers"
          value={plan.customers}
          onChange={(v) => onUpdatePlan(plan.id, "customers", v)}
          tooltip={t?.customers}
        />
        <RevenueTag amount={plan.price * plan.customers} />
      </div>

      {(staffAddon || providerAddon) && (
        <div className="border-t border-dashed border-slate-200 pt-3 space-y-2">
          {staffAddon && (
            <PlanAddonRowComponent
              label="+ Staff"
              price={staffAddon.price}
              quantity={staffAddon.quantity}
              onPriceChange={(v) =>
                onUpdateAddon(plan.id, "additional_staff", "price", v)
              }
              onQuantityChange={(v) =>
                onUpdateAddon(plan.id, "additional_staff", "quantity", v)
              }
              tooltipPrice={t?.staffAddonPrice}
              tooltipQty={t?.staffAddonQty}
            />
          )}
          {providerAddon && (
            <PlanAddonRowComponent
              label="+ Provider"
              price={providerAddon.price}
              quantity={providerAddon.quantity}
              onPriceChange={(v) =>
                onUpdateAddon(plan.id, "additional_provider", "price", v)
              }
              onQuantityChange={(v) =>
                onUpdateAddon(plan.id, "additional_provider", "quantity", v)
              }
              tooltipPrice={t?.providerAddonPrice}
              tooltipQty={t?.providerAddonQty}
            />
          )}
        </div>
      )}
    </SectionCard>
  );
}

function SurgicalPlanCard({
  planId,
  planName,
  basePrice,
  rows,
  onUpdateBase,
  onUpdateTier,
  tooltips,
}: {
  planId: string;
  planName: string;
  basePrice: number;
  rows: SurgicalTierRow[];
  onUpdateBase: (planId: string, value: number) => void;
  onUpdateTier: RevenueSectionProps["onUpdateSurgicalTierRow"];
  tooltips?: {
    basePrice?: string;
    addonPrice?: string;
    customers?: string;
  };
}) {
  const tierOrder: SurgicalTierKey[] = [
    "0-10",
    "11-25",
    "26-50",
    "51-100",
    "100+",
  ];
  const sorted = tierOrder
    .map((key) => rows.find((r) => r.tier_key === key))
    .filter(Boolean) as SurgicalTierRow[];
  const t = tooltips;

  return (
    <SectionCard>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-bold text-slate-800">{planName}</span>
        <NumberField
          label="Base $/mo"
          value={basePrice}
          prefix="$"
          onChange={(v) => onUpdateBase(planId, v)}
          tooltip={t?.basePrice}
        />
      </div>
      <div className="space-y-2 mt-1">
        {sorted.map((row) => (
          <div key={row.tier_key} className="flex items-end gap-3">
            <span className="text-xs font-medium text-slate-500 pb-2 min-w-[5.5rem] tabular-nums">
              {row.tier_key === "100+"
                ? "100+ (custom)"
                : `${row.tier_key} volume`}
            </span>
            {row.tier_key === "100+" ? (
              <NumberField
                label="Add-on price"
                value={row.addon_price}
                prefix="$"
                onChange={(v) => onUpdateTier(planId, "100+", "addon_price", v)}
                tooltip={t?.addonPrice}
              />
            ) : (
              <div className="flex-1 min-w-[5rem] pb-2">
                <span className="text-xs text-slate-400">
                  +${row.addon_price}/mo
                </span>
              </div>
            )}
            <NumberField
              label="Customers"
              value={row.customers}
              onChange={(v) =>
                onUpdateTier(planId, row.tier_key, "customers", v)
              }
              tooltip={t?.customers}
            />
            <RevenueTag
              amount={(row.base_price + row.addon_price) * row.customers}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function OnboardingPlanCard({
  planId,
  planName,
  session,
  bundle,
  onUpdate,
  tooltips,
}: {
  planId: string;
  planName: string;
  session?: OnboardingRow;
  bundle?: OnboardingRow;
  onUpdate: RevenueSectionProps["onUpdateOnboardingRow"];
  tooltips?: {
    sessionPrice?: string;
    sessionCustomers?: string;
    bundlePrice?: string;
    bundleCustomers?: string;
  };
}) {
  const t = tooltips;
  return (
    <SectionCard>
      <div className="text-sm font-bold text-slate-800">{planName}</div>
      {session && (
        <div className="flex items-end gap-3">
          <span className="text-xs font-medium text-slate-500 pb-2 min-w-[10rem]">
            1× 60-min session
          </span>
          <NumberField
            label="Price"
            value={session.price}
            prefix="$"
            onChange={(v) => onUpdate(planId, "session", "price", v)}
            tooltip={t?.sessionPrice}
          />
          <NumberField
            label="Customers"
            value={session.customers}
            onChange={(v) => onUpdate(planId, "session", "customers", v)}
            tooltip={t?.sessionCustomers}
          />
          <RevenueTag amount={session.price * session.customers} />
        </div>
      )}
      {bundle && (
        <div className="flex items-end gap-3">
          <span className="text-xs font-medium text-slate-500 pb-2 min-w-[10rem]">
            3× 60-min bundle
          </span>
          <NumberField
            label="Price"
            value={bundle.price}
            prefix="$"
            onChange={(v) => onUpdate(planId, "bundle", "price", v)}
            tooltip={t?.bundlePrice}
          />
          <NumberField
            label="Customers"
            value={bundle.customers}
            onChange={(v) => onUpdate(planId, "bundle", "customers", v)}
            tooltip={t?.bundleCustomers}
          />
          <RevenueTag amount={bundle.price * bundle.customers} />
        </div>
      )}
    </SectionCard>
  );
}

/** Storage & AI add-ons: revenue only here. Operating cost is edited in the Operating Costs card. */
function StorageAndAiAddonCard({
  label,
  feature,
  onUpdate,
  tooltipLabel,
  tooltipPrice,
  tooltipCustomers,
}: {
  label: string;
  feature: AddOnFeature;
  onUpdate: (
    id: string,
    field: keyof AddOnFeature,
    value: string | number,
  ) => void;
  tooltipLabel?: string;
  tooltipPrice?: string;
  tooltipCustomers?: string;
}) {
  return (
    <SectionCard>
      <div className="flex items-end gap-3">
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 pb-2 min-w-[10rem]">
          {label}
          {tooltipLabel != null && <InfoTooltip content={tooltipLabel} />}
        </span>
        <NumberField
          label="Price"
          value={feature.price}
          prefix="$"
          onChange={(v) => onUpdate(feature.id, "price", v)}
          tooltip={tooltipPrice}
        />
        <NumberField
          label="Customers"
          value={feature.customers}
          onChange={(v) => onUpdate(feature.id, "customers", v)}
          tooltip={tooltipCustomers}
        />
        <RevenueTag amount={feature.price * feature.customers} />
      </div>
    </SectionCard>
  );
}

// ─── Cost-only add-on names ─────────────────────────────────────

const COST_ONLY_ADDON_NAMES = [
  "Extra Storage (5GB pack)",
  "Image Scans (5k pack)",
];

// ─── Tooltip copy (Monthly Revenue card) ─────────────────────────

const TOOLTIPS = {
  header:
    "All figures update in real time as you adjust prices, customer counts, and add-ons across every section below.",

  pricingPlans: {
    section:
      "Each plan's revenue = Price × Customers.\n\nStaff and Provider add-ons below each plan contribute additional revenue at their own price × quantity.",
    price: "Monthly subscription price charged to each customer on this plan.",
    customers: "Total active customers currently subscribed to this plan.",
    staffAddonPrice:
      "Monthly price per additional staff seat beyond the plan's included users.",
    staffAddonQty:
      "How many extra staff seats have been purchased across all customers on this plan.",
    providerAddonPrice:
      "Monthly price per additional provider seat beyond the plan's included providers.",
    providerAddonQty:
      "How many extra provider seats have been purchased across all customers on this plan.",
  },

  techSupport: {
    section:
      "All plans include Standard support (Email, 48h response).\n\nPaid upgrades:\n• Priority — adds Chat, 24h response\n• Urgent — adds Phone/Zoom, 4h response\n\nTier price covers the plan's included users. The seat add-on charges per extra user added beyond that.\n\nSuggested pricing:\n\n  Basic — Priority $39, Urgent $99\n  Seat add-on: $10 / $25 per user\n\n  Professional — Priority $79, Urgent $199\n  Seat add-on: $10 / $25 per user\n\n  Enterprise — Priority $149, Urgent $349\n  Seat add-on: $8 / $20 per user (volume discount)",
    tierPrice:
      "Monthly upgrade price for this support tier. Covers all users included in the base plan (e.g. 2 for Basic, 5 for Pro, 10 for Enterprise).",
    customers:
      "Number of customers who have purchased this support tier upgrade.",
    seatAddon:
      "Per-user monthly price for support seats beyond the plan's included users. Charged only when customers add extra staff or providers.",
    seatsAvailed:
      "Total extra support seats purchased across all customers on this tier — i.e., users beyond the plan's included count who need this support level.",
  },

  surgical: {
    section:
      "The Surgical Services Pack bundles Surgery Quoting, Surgical Workflow, and Post-Op Automated Emails.\n\nMonthly base by plan:\n  Basic $129 · Pro $219 · Enterprise $349\n\nVolume tiers (surgeries/mo):\n  0–10: +$0\n  11–25: +$150\n  26–50: +$300\n  51–100: +$600\n  100+: custom\n\nIncluded providers: Basic 1, Pro 1, Enterprise 2.\nExtra providers: +$75/provider/mo.\n\nAutomation: 3,000 emails/mo included, then +$25 per 1,000 overage.",
    basePrice:
      "Monthly base price for the Surgical Pack on this plan, before any volume tier add-on.\n\nSuggested: Basic $129, Pro $219, Enterprise $349.",
    addonPrice:
      "Custom add-on price for practices performing 100+ surgeries/month. Negotiate based on volume.",
    customers: "Number of customers in this surgery volume tier.",
    additionalProvider:
      "Each additional surgical provider beyond the plan's included count costs +$75/provider/month.\n\nIncluded: Basic 1, Pro 1, Enterprise 2.",
    automationPer1k:
      "Overage rate for post-op automated emails beyond the 3,000/month included allowance. Suggested: $25 per 1,000 emails.",
    overageThousands:
      "How many thousands of emails over the 3,000/month included limit. E.g., enter 2 for 2,000 overage emails.",
  },

  onboarding: {
    section:
      "All plans include Basic Onboarding (self-serve: setup checklist, quick-start videos, email guidance — near $0 cost).\n\nPaid upgrades are delivered by contractors at $50/hr:\n\nSession (1× 60-min Zoom)\n  Delivery: ~2–2.5 hrs · Cost: $100–$125\n  Suggested: Basic $299 · Pro $399 · Enterprise $499\n  Margin: 58–80%\n\nBundle (3× 60-min Zoom)\n  Delivery: ~6–7.5 hrs · Cost: $300–$375\n  Suggested: Basic $799 · Pro $1,049 · Enterprise $1,299\n  Margin: 53–77%\n\nContractor pay: $125/session, $375/bundle.\nScope is standard setup + training only (no migrations or custom builds).",
    sessionPrice:
      "One-time price for a single 60-min provider onboarding session.\n\nSuggested: Basic $299 · Pro $399 · Enterprise $499.\nTrue cost to deliver: $100–$125 (contractor at $50/hr × ~2–2.5 hrs).",
    sessionCustomers:
      "Number of customers who have purchased the single-session onboarding upgrade.",
    bundlePrice:
      "One-time price for the 3-session onboarding bundle (3× 60-min Zoom).\n\nSuggested: Basic $799 · Pro $1,049 · Enterprise $1,299.\nTrue cost to deliver: $300–$375 (contractor at $50/hr × ~6–7.5 hrs).",
    bundleCustomers:
      "Number of customers who have purchased the 3-session onboarding bundle.",
  },

  storageAi: {
    section:
      "Revenue = Price × Customers (included in Total Monthly above). Set Cost/Customer and customers in the Operating Costs card; that cost flows into Total Monthly Expenses there.\n\nGuardrails: Basic max 1 storage pack (→10GB); Pro max 2 (→20GB); Enterprise unlimited. AI: Basic max 1 pack (→10k); Pro max 3 (→25k); Enterprise unlimited. Suggested: ~$20/5GB storage, ~$59/5k image pack.",
    extraStorage:
      "Extra Storage: 5GB packs. Suggested ~$20/pack. Set operating cost (e.g. cloud storage) in the Operating Costs card.",
    aiImagePacks:
      "AI Image Scan packs: 5,000-scan increments. Suggested ~$59/pack. Set operating cost (e.g. API fees) in the Operating Costs card.",
    price:
      "Price you charge per pack (or per customer) per month. Suggested: ~$20 for 5GB storage, ~$59 for 5k image pack.",
    costPerCustomer:
      "Your per-customer cost to deliver this add-on (e.g., cloud storage or API fees). This amount flows to Operating Costs.",
    customers: "Number of customers who have purchased this add-on pack.",
  },

  addonFeatures: {
    section:
      "Custom add-on features you define. Revenue = Price × Customers.\n\nUse this for product-specific or one-off features not covered by the sections above.",
    costPerCustomer:
      "Your operating cost to deliver this feature per customer (e.g., third-party API fees, infrastructure). Flows to Operating Costs.",
    customers: "Number of customers using this add-on feature.",
  },
};

// ─── Props ──────────────────────────────────────────────────────

interface RevenueSectionProps {
  scenarioId: string;
  pricingPlans: PricingPlan[];
  addOnFeatures: AddOnFeature[];
  techSupportRows: TechSupportRow[];
  onUpdateTechSupportRow: (
    planId: string,
    tier: "Priority" | "Urgent",
    field: keyof Pick<
      TechSupportRow,
      "tier_price" | "customers" | "seat_addon_price" | "extra_seats"
    >,
    value: number,
  ) => void;
  planAddonRows: PlanAddonRow[];
  onUpdatePlanAddonRow: (
    planId: string,
    addonType: "additional_staff" | "additional_provider",
    field: keyof Pick<PlanAddonRow, "price" | "quantity">,
    value: number,
  ) => void;
  surgicalTierRows: SurgicalTierRow[];
  onUpdateSurgicalTierRow: (
    planId: string,
    tierKey: SurgicalTierKey,
    field: keyof Pick<
      SurgicalTierRow,
      "base_price" | "addon_price" | "customers"
    >,
    value: number,
  ) => void;
  onUpdateSurgicalBasePrice: (planId: string, value: number) => void;
  surgicalExtras: SurgicalExtras;
  onUpdateSurgicalExtras: (field: keyof SurgicalExtras, value: number) => void;
  onboardingRows: OnboardingRow[];
  onUpdateOnboardingRow: (
    planId: string,
    upgradeType: "session" | "bundle",
    field: keyof Pick<OnboardingRow, "price" | "customers">,
    value: number,
  ) => void;
  onUpdate: () => void;
}

// ─── Main component ─────────────────────────────────────────────

export default function RevenueSection({
  scenarioId,
  pricingPlans,
  addOnFeatures,
  techSupportRows,
  onUpdateTechSupportRow,
  planAddonRows,
  onUpdatePlanAddonRow,
  surgicalTierRows,
  onUpdateSurgicalTierRow,
  onUpdateSurgicalBasePrice,
  surgicalExtras,
  onUpdateSurgicalExtras,
  onboardingRows,
  onUpdateOnboardingRow,
  onUpdate,
}: RevenueSectionProps) {
  async function updatePricingPlan(
    id: string,
    field: keyof PricingPlan,
    value: string | number,
  ) {
    await supabase
      .from("pricing_plans")
      .update({ [field]: value })
      .eq("id", id);
    onUpdate();
  }

  async function updateAddOnFeature(
    id: string,
    field: keyof AddOnFeature,
    value: string | number,
  ) {
    await supabase
      .from("add_on_features")
      .update({ [field]: value })
      .eq("id", id);
    onUpdate();
  }

  async function addNewFeature() {
    await supabase.from("add_on_features").insert({
      scenario_id: scenarioId,
      name: "New Feature",
      price: 0,
      customers: 10,
      is_revenue: true,
      operating_cost_per_customer: 0,
    });
    onUpdate();
  }

  async function deleteFeature(id: string) {
    await supabase.from("add_on_features").delete().eq("id", id);
    onUpdate();
  }

  const revenueAddons = addOnFeatures.filter(
    (f) => f.is_revenue && !COST_ONLY_ADDON_NAMES.includes(f.name),
  );
  const extraStorage = addOnFeatures.find(
    (f) => f.name === "Extra Storage (5GB pack)",
  );
  const aiImagePacks = addOnFeatures.find(
    (f) => f.name === "Image Scans (5k pack)",
  );
  const costOnlyAddons = [extraStorage, aiImagePacks].filter(
    Boolean,
  ) as AddOnFeature[];

  const techSupportByPlan = groupBy(techSupportRows, (r) => r.plan_id);
  const surgicalByPlan = groupBy(surgicalTierRows, (r) => r.plan_id);
  const onboardingByPlan = groupBy(onboardingRows, (r) => r.plan_id);

  const surgicalRevenue =
    surgicalTierRows.reduce(
      (s, r) => s + (r.base_price + r.addon_price) * r.customers,
      0,
    ) +
    surgicalExtras.additional_provider_price *
      surgicalExtras.additional_provider_quantity +
    surgicalExtras.automation_price_per_1000 *
      surgicalExtras.automation_overage_thousands;

  const storageAndAiRevenue =
    (extraStorage?.price ?? 0) * (extraStorage?.customers ?? 0) +
    (aiImagePacks?.price ?? 0) * (aiImagePacks?.customers ?? 0);

  const totalRevenue =
    pricingPlans.reduce((s, p) => s + p.price * p.customers, 0) +
    revenueAddons.reduce((s, f) => s + f.price * f.customers, 0) +
    techSupportRows.reduce(
      (s, r) =>
        s + r.tier_price * r.customers + r.seat_addon_price * r.extra_seats,
      0,
    ) +
    planAddonRows.reduce((s, r) => s + r.price * r.quantity, 0) +
    surgicalRevenue +
    onboardingRows.reduce((s, r) => s + r.price * r.customers, 0) +
    storageAndAiRevenue;

  return (
    <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-6 space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 bg-green-500 rounded-xl flex items-center justify-center shadow-sm">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <div className="flex items-center gap-1.5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Monthly Revenue
            </h2>
            <p className="text-sm text-slate-400">
              Pricing plans and add-on features
            </p>
          </div>
          <InfoTooltip content={TOOLTIPS.header} />
        </div>
        <div className="ml-auto flex items-start gap-1.5 text-right">
          <div className="bg-white rounded-lg border border-slate-200 px-4 py-2 shadow-sm">
            <div className="flex items-center justify-end gap-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Monthly
              </span>
              <InfoTooltip content="Sum of all revenue from the sections below. Updates in real time as you change plan prices, customers, and add-ons." />
            </div>
            <div className="text-2xl font-extrabold text-green-600 tabular-nums tracking-tight">
              ${totalRevenue.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Pricing Plans ── */}
      <section>
        <SectionHeading
          title="Pricing Plans"
          tooltip={TOOLTIPS.pricingPlans.section}
        />
        <div className="space-y-3">
          {pricingPlans.map((plan) => {
            const addons = planAddonRows.filter((r) => r.plan_id === plan.id);
            return (
              <PricingPlanCard
                key={plan.id}
                plan={plan}
                staffAddon={addons.find(
                  (r) => r.addon_type === "additional_staff",
                )}
                providerAddon={addons.find(
                  (r) => r.addon_type === "additional_provider",
                )}
                onUpdatePlan={updatePricingPlan}
                onUpdateAddon={onUpdatePlanAddonRow}
                tooltips={TOOLTIPS.pricingPlans}
              />
            );
          })}
        </div>
      </section>

      {/* ── Tech Support ── */}
      {techSupportRows.length > 0 && (
        <section>
          <SectionHeading
            icon={<Headphones className="w-3.5 h-3.5 text-slate-500" />}
            title="Tech Support"
            description="Standard (Email, 48h) included for all. Upgrade price covers included users; seat add-on for extras."
            tooltip={TOOLTIPS.techSupport.section}
          />
          <div className="space-y-3">
            {Array.from(techSupportByPlan.entries()).map(([planId, rows]) => {
              const priority = rows.find((r) => r.tier === "Priority");
              const urgent = rows.find((r) => r.tier === "Urgent");
              return (
                <SectionCard key={planId}>
                  <div className="text-sm font-bold text-slate-800">
                    {rows[0]?.plan_name ?? planId}
                  </div>
                  {priority && (
                    <TechSupportTierRow
                      tier="Priority"
                      row={priority}
                      planId={planId}
                      onUpdate={onUpdateTechSupportRow}
                      tooltips={TOOLTIPS.techSupport}
                    />
                  )}
                  {urgent && (
                    <TechSupportTierRow
                      tier="Urgent"
                      row={urgent}
                      planId={planId}
                      onUpdate={onUpdateTechSupportRow}
                      tooltips={TOOLTIPS.techSupport}
                    />
                  )}
                </SectionCard>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Surgical Services ── */}
      {surgicalTierRows.length > 0 && (
        <section>
          <SectionHeading
            icon={<Stethoscope className="w-3.5 h-3.5 text-slate-500" />}
            title="Surgical Services Pack"
            description="Standard Surgery Quote + Workflow + Post-Op Emails. Volume tiers below; 100+ is custom."
            tooltip={TOOLTIPS.surgical.section}
          />
          <div className="space-y-3">
            {Array.from(surgicalByPlan.entries()).map(([planId, rows]) => (
              <SurgicalPlanCard
                key={planId}
                planId={planId}
                planName={rows[0]?.plan_name ?? planId}
                basePrice={rows[0]?.base_price ?? 0}
                rows={rows}
                onUpdateBase={onUpdateSurgicalBasePrice}
                onUpdateTier={onUpdateSurgicalTierRow}
                tooltips={TOOLTIPS.surgical}
              />
            ))}

            <SectionCard>
              <PlanAddonRowComponent
                label="Additional surgical provider"
                price={surgicalExtras.additional_provider_price}
                quantity={surgicalExtras.additional_provider_quantity}
                onPriceChange={(v) =>
                  onUpdateSurgicalExtras("additional_provider_price", v)
                }
                onQuantityChange={(v) =>
                  onUpdateSurgicalExtras("additional_provider_quantity", v)
                }
                tooltipPrice={TOOLTIPS.surgical.additionalProvider}
                tooltipQty={TOOLTIPS.surgical.additionalProvider}
              />
              <div className="flex items-end gap-3">
                <span className="text-xs font-medium text-slate-500 pb-2 min-w-[7rem]">
                  Automation overage
                </span>
                <NumberField
                  label="$/1,000 emails"
                  value={surgicalExtras.automation_price_per_1000}
                  prefix="$"
                  onChange={(v) =>
                    onUpdateSurgicalExtras("automation_price_per_1000", v)
                  }
                  tooltip={TOOLTIPS.surgical.automationPer1k}
                />
                <NumberField
                  label="Overage (thousands)"
                  value={surgicalExtras.automation_overage_thousands}
                  onChange={(v) =>
                    onUpdateSurgicalExtras("automation_overage_thousands", v)
                  }
                  tooltip={TOOLTIPS.surgical.overageThousands}
                />
                <RevenueTag
                  amount={
                    surgicalExtras.automation_price_per_1000 *
                    surgicalExtras.automation_overage_thousands
                  }
                />
              </div>
            </SectionCard>
          </div>
        </section>
      )}

      {/* ── Onboarding ── */}
      {onboardingRows.length > 0 && (
        <section>
          <SectionHeading
            icon={<GraduationCap className="w-3.5 h-3.5 text-slate-500" />}
            title="Onboarding Upgrades"
            description="Basic Onboarding (self-serve) included. Paid upgrades below. Contractor pay is in Operating Costs."
            tooltip={TOOLTIPS.onboarding.section}
          />
          <div className="space-y-3">
            {Array.from(onboardingByPlan.entries()).map(([planId, rows]) => (
              <OnboardingPlanCard
                key={planId}
                planId={planId}
                planName={rows[0]?.plan_name ?? planId}
                session={rows.find((r) => r.upgrade_type === "session")}
                bundle={rows.find((r) => r.upgrade_type === "bundle")}
                onUpdate={onUpdateOnboardingRow}
                tooltips={TOOLTIPS.onboarding}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Storage & AI Image Packs (revenue + operating cost) ── */}
      {costOnlyAddons.length > 0 && (
        <section>
          <SectionHeading
            icon={<HardDrive className="w-3.5 h-3.5 text-slate-500" />}
            title="Storage & AI Image Packs"
            description="Revenue (Price × Customers). Set operating cost per customer in the Operating Costs card."
            tooltip={TOOLTIPS.storageAi.section}
          />
          <div className="space-y-3">
            {extraStorage && (
              <StorageAndAiAddonCard
                label="Extra Storage (5GB)"
                feature={extraStorage}
                onUpdate={updateAddOnFeature}
                tooltipLabel={TOOLTIPS.storageAi.extraStorage}
                tooltipPrice={TOOLTIPS.storageAi.price}
                tooltipCustomers={TOOLTIPS.storageAi.customers}
              />
            )}
            {aiImagePacks && (
              <StorageAndAiAddonCard
                label="AI Image Packs (5k)"
                feature={aiImagePacks}
                onUpdate={updateAddOnFeature}
                tooltipLabel={TOOLTIPS.storageAi.aiImagePacks}
                tooltipPrice={TOOLTIPS.storageAi.price}
                tooltipCustomers={TOOLTIPS.storageAi.customers}
              />
            )}
          </div>
        </section>
      )}

      {/* ── Custom Add-on Features ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionHeading
            title="Add-on Features"
            tooltip={TOOLTIPS.addonFeatures.section}
          />
          <button
            onClick={addNewFeature}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3.5 py-2 text-sm font-medium
              text-white transition-all hover:bg-slate-700 active:bg-slate-900 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Feature
          </button>
        </div>
        <div className="space-y-3">
          {revenueAddons.map((feature) => (
            <SectionCard key={feature.id}>
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={feature.name}
                  onChange={(e) =>
                    updateAddOnFeature(feature.id, "name", e.target.value)
                  }
                  className="flex-1 border-0 border-b border-transparent bg-transparent px-0 py-0.5
                    text-sm font-bold text-slate-800 focus:border-green-400 focus:outline-none"
                />
                <CustomerBadge count={feature.customers} />
                <button
                  onClick={() => deleteFeature(feature.id)}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:text-red-500 hover:bg-red-50"
                  aria-label={`Delete ${feature.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-end gap-3">
                <NumberField
                  label="Cost/Customer"
                  value={feature.operating_cost_per_customer}
                  prefix="$"
                  onChange={(v) =>
                    updateAddOnFeature(
                      feature.id,
                      "operating_cost_per_customer",
                      v,
                    )
                  }
                  tooltip={TOOLTIPS.addonFeatures.costPerCustomer}
                />
                <NumberField
                  label="Customers"
                  value={feature.customers}
                  onChange={(v) =>
                    updateAddOnFeature(feature.id, "customers", v)
                  }
                  tooltip={TOOLTIPS.addonFeatures.customers}
                />
                <RevenueTag amount={feature.price * feature.customers} />
              </div>
            </SectionCard>
          ))}
        </div>
      </section>
    </div>
  );
}
