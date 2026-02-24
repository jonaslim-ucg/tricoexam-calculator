/** Admin-facing plan model with defaults and guardrails */

export interface PlanDefaults {
  providers: number;
  staff: number;
  storageGb: number;
  images: number;
}

export interface PlanGuardrails {
  maxProviders: number | null; // null = no cap
  maxStaff: number | null;
  maxUsers: number | null;
  minProviders?: number; // e.g. Enterprise stays 2+
  /** Optional rule description, e.g. "If 2nd provider, require at least 2 staff" */
  note?: string;
}

export interface PlanModel {
  id: string;
  name: string;
  price: number;
  /** Number of customers on this plan (revenue projection). */
  customers: number;
  /** Additional users (e.g. extra staff) sold on this plan. */
  additionalUsers: number;
  tagline: string;
  defaults: PlanDefaults;
  guardrails: PlanGuardrails;
  displayOrder: number;
}

/** Predefined channel options for tech support tiers */
export type SupportChannel = 'Email' | 'Chat' | 'Phone' | 'Zoom';

export const SUPPORT_CHANNELS: SupportChannel[] = ['Email', 'Chat', 'Phone', 'Zoom'];

/** Single tech support tier — fully configurable by admin */
export interface TechSupportTier {
  id: string;
  displayOrder: number;
  name: string;
  responseTime: string;
  channels: SupportChannel[];
  /** Tier price per plan (covers plan's included users = providers + staff) */
  pricePerPlan: { basic: number; professional: number; enterprise: number };
  /** Per-seat price per plan for users beyond included (e.g. 3rd user on Basic) */
  seatPricePerPlan: { basic: number; professional: number; enterprise: number };
  /** Exactly one tier should be the default/included tier */
  isIncluded: boolean;
}

/** Plan names used for pricing and availability */
export type PlanKey = 'basic' | 'professional' | 'enterprise';

/** Tech Support add-on config: tiers, seat pricing, plan availability */
export interface TechSupportConfig {
  tiers: TechSupportTier[];
  /** Customers per plan (revenue projection). */
  customersPerPlan: { basic: number; professional: number; enterprise: number };
  seatPricingEnabled: boolean;
  availableOnPlans: { basic: boolean; professional: boolean; enterprise: boolean };
}

/** Included users per plan (providers + staff from plan defaults). Used for "Covers X users" display. */
export type IncludedUsersPerPlan = Record<PlanKey, number>;

/** Usage-based add-on: Additional Storage. Pack size in GB, price per pack. */
export interface StorageAddOnConfig {
  packSizeGb: number;
  pricePerPack: number;
  /** Number of customers (revenue projection). */
  customers: number;
}

/** Usage-based add-on: Additional Image Analytic Scans. Pack size in images, price per pack. */
export interface ImageScansAddOnConfig {
  packSizeImages: number;
  pricePerPack: number;
  /** Number of customers (revenue projection). */
  customers: number;
}

/** Included storage (GB) and images per plan — from plan defaults, for guardrail derivation. */
export type IncludedStoragePerPlan = Record<PlanKey, number>;
export type IncludedImagesPerPlan = Record<PlanKey, number>;

/** Single paid onboarding upgrade: recommended price per plan (revenue); description is read-only. */
export interface OnboardingUpgrade {
  name: string;
  description: string;
  trueDeliveryTime: string;
  trueCostMin: number;
  trueCostMax: number;
  pricePerPlan: { basic: number; professional: number; enterprise: number };
  /** Customers per plan (revenue projection). */
  customersPerPlan: { basic: number; professional: number; enterprise: number };
}

/** Onboarding options + true cost summary. Revenue-related fields are editable. */
export interface OnboardingConfig {
  /** Included (all plans): description only. */
  includedDescription: string;
  includedCostNote: string;
  upgrades: OnboardingUpgrade[];
  /** Contractor pay — editable so true cost and margin stay accurate. */
  contractorPayPerSession: number;
  contractorPayPerBundle: number;
  guardrailsDescription: string;
}

/** Volume tier for Surgical Services: volume range and monthly add-on price. */
export interface SurgicalVolumeTier {
  minVolume: number;
  maxVolume: number | null; // null = no cap (e.g. 100+)
  addOnPrice: number;
  label?: string; // e.g. "100+ (custom)"
}

/** Surgical Services Pack add-on. Revenue-related fields are editable. */
export interface SurgicalServicesConfig {
  description: string;
  monthlyPricePerPlan: { basic: number; professional: number; enterprise: number };
  /** Customers per plan (revenue projection). */
  customersPerPlan: { basic: number; professional: number; enterprise: number };
  volumeTiers: SurgicalVolumeTier[];
  includedSurgicalProvidersPerPlan: { basic: number; professional: number; enterprise: number };
  additionalProviderPricePerMonth: number;
  emailIncludedPerMonth: number;
  emailOveragePricePer1000: number;
  oneTimeOptions: {
    enableOnlyDescription: string;
    activationDescription: string;
    activationPrice: number;
    customizationDescription: string;
    customizationPrice: number;
  };
}

/** @deprecated Use TechSupportTier / TechSupportConfig instead */
export interface SupportTier {
  id: string;
  name: string;
  slug: 'standard' | 'priority' | 'urgent';
  description: string;
  responseTime: string;
  includedInPlans: boolean;
  pricePerMonth: number;
}

/** @deprecated Seat pricing is now part of TechSupportConfig */
export interface SupportSeatAddOn {
  id: string;
  name: string;
  pricePerSeatPerMonth: number;
  description: string;
}
