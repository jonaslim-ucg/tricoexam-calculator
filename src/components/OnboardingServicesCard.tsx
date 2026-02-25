import { useState } from "react";
import { Briefcase, Plus, Trash2 } from "lucide-react";
import type { OnboardingRow } from "../types/forecast";

// ─── Constants ───────────────────────────────────────────────────

const PLAN_ORDER = ["Basic", "Professional", "Enterprise"];
const SESSION_DELIVERY_DEFAULT = 125;
const BUNDLE_DELIVERY_DEFAULT = 375;

// ─── Helpers ─────────────────────────────────────────────────────

function sortByPlan<T extends { plan_name: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) => PLAN_ORDER.indexOf(a.plan_name) - PLAN_ORDER.indexOf(b.plan_name),
  );
}

function calcMarginPct(revenue: number, profit: number): number {
  if (revenue <= 0) return 0;
  return (profit / revenue) * 100;
}

// ─── Small components ────────────────────────────────────────────

function MarginBadge({ pct }: { pct: number }) {
  const formatted = `${pct.toFixed(1)}%`;
  if (pct >= 65)
    return (
      <span className="inline-flex items-center rounded-md bg-green-50 border border-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-700 tabular-nums">
        {formatted}
      </span>
    );
  if (pct >= 50)
    return (
      <span className="inline-flex items-center rounded-md bg-amber-50 border border-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700 tabular-nums">
        {formatted}
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-md bg-red-50 border border-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700 tabular-nums">
      {formatted}
    </span>
  );
}

function SectionStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="text-right">
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
        {label}
      </div>
      <div className="text-sm font-bold text-slate-800 tabular-nums">
        {value}
      </div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

// ─── Shared table ────────────────────────────────────────────────

function OnboardingTable({
  rows,
  upgradeType,
  defaultDeliveryCost,
  onUpdate,
  onDelete,
}: {
  rows: OnboardingRow[];
  upgradeType: "session" | "bundle";
  defaultDeliveryCost: number;
  onUpdate: (
    planId: string,
    upgradeType: "session" | "bundle",
    field: keyof Pick<OnboardingRow, "price" | "customers" | "plan_name" | "delivery_cost">,
    value: number | string,
  ) => void;
  onDelete: (planId: string, upgradeType: "session" | "bundle") => void;
}) {
  const isSession = upgradeType === "session";
  const revenue = rows.reduce((s, r) => s + r.price * r.customers, 0);
  const cost = rows.reduce(
    (s, r) => s + (r.delivery_cost ?? defaultDeliveryCost) * r.customers,
    0,
  );
  const profit = revenue - cost;
  const marginPct = calcMarginPct(revenue, profit);

  return (
    <div>
      {/* Sub-section header */}
      <div
        className={`flex items-center justify-between flex-wrap gap-3 pb-3 mb-4 border-b-2
          ${isSession ? "border-sky-200" : "border-violet-200"}`}
      >
        <h3
          className={`text-sm font-bold
            ${isSession ? "text-sky-800" : "text-violet-800"}`}
        >
          {isSession ? "Single Sessions (1× 60-min)" : "Bundles (3× 60-min)"}
        </h3>
        <div className="flex items-center gap-5">
          <SectionStat label="Revenue" value={`$${revenue.toLocaleString()}`} />
          <SectionStat
            label="Gross Profit"
            value={`$${profit.toLocaleString()}`}
            sub={`${marginPct.toFixed(1)}% margin`}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          No {isSession ? "sessions" : "bundles"} added yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-100">
                {[
                  "Name",
                  "Price",
                  "Delivery Cost",
                  "Units Sold",
                  "Revenue",
                  "Profit",
                  "Margin",
                  "",
                ].map((h, i) => (
                  <th
                    key={i}
                    className={`pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide
                        ${i > 0 ? "px-2 text-right" : "pr-4"} ${i === 7 ? "w-8" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const rowDeliveryCost = row.delivery_cost ?? defaultDeliveryCost;
                const rowRevenue = row.price * row.customers;
                const rowCost = rowDeliveryCost * row.customers;
                const rowProfit = rowRevenue - rowCost;
                const rowMargin = calcMarginPct(rowRevenue, rowProfit);
                const isNegative = rowProfit < 0;

                return (
                  <tr
                    key={`${row.plan_id}-${upgradeType}`}
                    className="group hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-2.5 pr-4">
                      <input
                        type="text"
                        value={row.plan_name}
                        onChange={(e) =>
                          onUpdate(row.plan_id, upgradeType, "plan_name", e.target.value)
                        }
                        placeholder="Name"
                        className="w-full min-w-[8rem] px-2 py-1.5 border border-slate-200 rounded-md text-sm bg-white
                          focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 transition-colors"
                      />
                    </td>

                    <td className="py-2.5 px-2 text-right">
                      <div className="relative inline-flex">
                        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                          $
                        </span>
                        <input
                          type="number"
                          min={0}
                          value={row.price}
                          onChange={(e) =>
                            onUpdate(
                              row.plan_id,
                              upgradeType,
                              "price",
                              Number(e.target.value) || 0,
                            )
                          }
                          className="w-20 pl-5 pr-2 py-1.5 border border-slate-200 rounded-md text-right text-sm bg-white
                            focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 transition-colors"
                        />
                      </div>
                    </td>

                    <td className="py-2.5 px-2 text-right">
                      <div className="relative inline-flex justify-end w-full">
                        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                          $
                        </span>
                        <input
                          type="number"
                          min={0}
                          value={row.delivery_cost ?? defaultDeliveryCost}
                          onChange={(e) =>
                            onUpdate(
                              row.plan_id,
                              upgradeType,
                              "delivery_cost",
                              Number(e.target.value) || 0,
                            )
                          }
                          className="w-20 pl-5 pr-2 py-1.5 border border-slate-200 rounded-md text-right text-sm bg-white
                            focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 transition-colors"
                        />
                      </div>
                    </td>

                    <td className="py-2.5 px-2 text-right">
                      <input
                        type="number"
                        min={0}
                        value={row.customers}
                        onChange={(e) =>
                          onUpdate(
                            row.plan_id,
                            upgradeType,
                            "customers",
                            Number(e.target.value) || 0,
                          )
                        }
                        className="w-16 px-2 py-1.5 border border-slate-200 rounded-md text-right text-sm bg-white
                          focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 transition-colors"
                      />
                    </td>

                    <td className="py-2.5 px-2 text-right font-semibold text-slate-800 tabular-nums">
                      ${rowRevenue.toLocaleString()}
                    </td>

                    <td
                      className={`py-2.5 px-2 text-right font-semibold tabular-nums
                        ${isNegative ? "text-red-600" : "text-green-600"}`}
                    >
                      {isNegative ? "−" : ""}$
                      {Math.abs(rowProfit).toLocaleString()}
                    </td>

                    <td className="py-2.5 px-2 text-right">
                      <MarginBadge pct={rowMargin} />
                    </td>

                    <td className="py-2.5 pl-2">
                      <button
                        type="button"
                        onClick={() => onDelete(row.plan_id, upgradeType)}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md
                          opacity-0 group-hover:opacity-100 transition-all"
                        aria-label={`Delete ${row.plan_name} ${upgradeType} row`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────

interface OnboardingServicesCardProps {
  onboardingRows: OnboardingRow[];
  onUpdateOnboardingRow: (
    planId: string,
    upgradeType: "session" | "bundle",
    field: keyof Pick<OnboardingRow, "price" | "customers" | "plan_name" | "delivery_cost">,
    value: number | string,
  ) => void;
  onDeleteOnboardingRow: (
    planId: string,
    upgradeType: "session" | "bundle",
  ) => void;
  onAddSession: () => void;
  onAddBundle: () => void;
}

// ─── Main component ──────────────────────────────────────────────

export default function OnboardingServicesCard({
  onboardingRows,
  onUpdateOnboardingRow,
  onDeleteOnboardingRow,
  onAddSession,
  onAddBundle,
}: OnboardingServicesCardProps) {
  const [deliveryPerSession, setDeliveryPerSession] = useState(
    SESSION_DELIVERY_DEFAULT,
  );
  const [deliveryPerBundle, setDeliveryPerBundle] = useState(
    BUNDLE_DELIVERY_DEFAULT,
  );

  const sessionRows = sortByPlan(
    onboardingRows.filter((r) => r.upgrade_type === "session"),
  );
  const bundleRows = sortByPlan(
    onboardingRows.filter((r) => r.upgrade_type === "bundle"),
  );

  const sessionRevenue = sessionRows.reduce(
    (s, r) => s + r.price * r.customers,
    0,
  );
  const sessionProfit =
    sessionRevenue -
    sessionRows.reduce(
      (s, r) => s + (r.delivery_cost ?? deliveryPerSession) * r.customers,
      0,
    );

  const bundleRevenue = bundleRows.reduce(
    (s, r) => s + r.price * r.customers,
    0,
  );
  const bundleProfit =
    bundleRevenue -
    bundleRows.reduce(
      (s, r) => s + (r.delivery_cost ?? deliveryPerBundle) * r.customers,
      0,
    );

  const totalRevenue = sessionRevenue + bundleRevenue;
  const totalGrossProfit = sessionProfit + bundleProfit;
  const overallMargin = calcMarginPct(totalRevenue, totalGrossProfit);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Onboarding Services
            </h2>
            <p className="text-sm text-slate-400">
              One-time service revenue and delivery costs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-right">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Revenue
            </div>
            <div className="text-lg font-bold text-slate-800 tabular-nums">
              ${totalRevenue.toLocaleString()}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-right">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Gross Profit
            </div>
            <div className="text-2xl font-extrabold text-sky-600 tabular-nums tracking-tight">
              ${totalGrossProfit.toLocaleString()}
            </div>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <MarginBadge pct={overallMargin} />
              <span className="text-xs text-slate-400">overall margin</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* ── Sessions ── */}
        <OnboardingTable
          rows={sessionRows}
          upgradeType="session"
          defaultDeliveryCost={deliveryPerSession}
          onUpdate={onUpdateOnboardingRow}
          onDelete={onDeleteOnboardingRow}
        />

        {/* ── Bundles ── */}
        <OnboardingTable
          rows={bundleRows}
          upgradeType="bundle"
          defaultDeliveryCost={deliveryPerBundle}
          onUpdate={onUpdateOnboardingRow}
          onDelete={onDeleteOnboardingRow}
        />

        {/* ── Contractor Pay ── */}
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-4 space-y-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Contractor Pay (delivery cost per unit)
          </div>

          <div className="flex flex-wrap gap-6">
            {[
              {
                label: "Session (1× 60-min)",
                value: deliveryPerSession,
                onChange: setDeliveryPerSession,
                hint: "per session (≤ 2.5 hrs)",
              },
              {
                label: "Bundle (3× 60-min)",
                value: deliveryPerBundle,
                onChange: setDeliveryPerBundle,
                hint: "per bundle (3 sessions)",
              },
            ].map(({ label, value, onChange, hint }) => (
              <div key={label}>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1.5">
                  {label}
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={value}
                      onChange={(e) => onChange(Number(e.target.value) || 0)}
                      className="w-24 pl-6 pr-2 py-1.5 border border-slate-200 rounded-md text-sm bg-white
                        focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 transition-colors"
                    />
                  </div>
                  <span className="text-xs text-slate-400">{hint}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Included (all plans): Basic Onboarding (self-serve). Scope: standard
            setup + training only — no migrations or custom builds. Follow-up:
            recap email + limited support (30 min / 7 days).
          </p>
        </div>

        {/* ── Add buttons ── */}
        <div className="flex gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onAddSession}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg
              hover:bg-slate-700 active:bg-slate-900 text-sm font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Single Session
          </button>
          <button
            type="button"
            onClick={onAddBundle}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg
              hover:bg-sky-500 active:bg-sky-700 text-sm font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Bundle
          </button>
        </div>
      </div>
    </div>
  );
}
