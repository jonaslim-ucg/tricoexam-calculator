# Landing Screen Calculations

This document describes all calculations visible on the dashboard (landing) screen, organized by section. The values are produced by `calculateMetrics()` in `src/utils/calculations.ts` and displayed in the Summary, Revenue, Operating Costs, Marketing Costs, and Charts sections.

---

## 1. Summary cards (top section)

The first row shows four key metrics in cards.

### 1.1 Monthly Revenue

**Display:** "Monthly Revenue" card (green).

**Formula:**

```
Monthly Revenue =
  Σ (plan.price × plan.customers) for each pricing plan
  + Σ (feature.price × feature.customers) for each add-on where feature.is_revenue = true
```

- **Pricing plans:** Sum over all plans of `price × customers`.
- **Add-ons:** Only add-ons with `is_revenue === true` contribute; each adds `price × customers`.

---

### 1.2 Monthly Expenses

**Display:** "Monthly Expenses" card (red).

**Formula:**

```
Total Monthly Expenses = Monthly Operating Expenses + Monthly Marketing Expenses
```

See sections 2 (Operating) and 3 (Marketing) below for how each part is computed.

---

### 1.3 Monthly Profit

**Display:** "Monthly Profit" card (green if ≥ 0, red if negative).

**Formula:**

```
Monthly Profit = Monthly Revenue − Total Monthly Expenses
```

---

### 1.4 Break-even Period

**Display:** "Break-even Period" card (blue), in months.

**Formula:**

```
Break-even Months =
  Capital Expenditure / Monthly Profit   if Monthly Profit > 0
  0                                       if Monthly Profit ≤ 0
```

So many months of current monthly profit are needed to recover the scenario’s capital expenditure. If there is no positive profit, break-even is shown as 0.

---

## 2. Annual projections

The "Annual Projections" block shows 12-month extrapolations and repeats the break-even time.

### 2.1 Annual Revenue

**Formula:**

```
Annual Revenue = Monthly Revenue × 12
```

---

### 2.2 Annual Operating Expenses

**Formula:**

```
Annual Operating Expenses = Monthly Operating Expenses × 12
```

---

### 2.3 Annual Marketing Expenses

**Formula:**

```
Annual Marketing Expenses = Monthly Marketing Expenses × 12
```

---

### 2.4 Net Annual Cash Flow

**Display:** "Net Annual Cash Flow" in the annual projections grid.

**Formula:**

```
Annual Profit (Net Annual Cash Flow) =
  Annual Revenue − Annual Operating Expenses − Annual Marketing Expenses − Capital Expenditure
```

Capital expenditure is the one-time amount for the scenario; it is subtracted once in the annual profit.

---

### 2.5 Break-even time (annual block)

**Display:** "Break-even Time after Marketing Costs" in the dark summary box.

**Formula:** Same as **Break-even Period** in section 1.4:  
`Break-even Months = Capital Expenditure / Monthly Profit` (or 0 if profit ≤ 0), shown in months with 2 decimal places.

---

## 3. Underlying inputs for summary and annual

These are not shown as separate cards but feed into **Monthly Expenses**, **Monthly Profit**, and all annual figures.

### 3.1 Monthly operating expenses

**Used in:** Total Monthly Expenses, Monthly Profit, Annual Operating Expenses, Expense breakdown in charts.

**Formula:**

```
Add-on operating cost = Σ (feature.operating_cost_per_customer × feature.customers) for all add-ons

Monthly Operating Expenses =
  Σ (per cost item) +
  Add-on operating cost
```

**Per cost item (operating costs):**

- If `is_fixed === true`: add `amount`.
- If `is_fixed === false`: add `unit_price × units`.

---

### 3.2 Monthly marketing expenses

**Used in:** Total Monthly Expenses, Monthly Profit, Annual Marketing Expenses, Expense breakdown in charts.

**Formula (per marketing cost):**

```
Plan price = price of the matching pricing plan (by name, e.g. "Basic" matches "Basic Plan")
Per-item cost = plan_price × cost.customers × (cost.rate / 100)
Monthly Marketing Expenses = Σ (per-item cost) over all marketing costs
```

Note: The plan price is resolved from the scenario's pricing plans (by plan name match), not from the scenario’s actual pricing plan prices.

---

## 4. Revenue section (Monthly Revenue block)

The "Monthly Revenue" section shows:

- **Total Monthly Revenue:** Same value as **Monthly Revenue** in section 1.1, computed as:

  ```
  Total Monthly Revenue =
    Σ (plan.price × plan.customers) +
    Σ (feature.price × feature.customers) for add-ons with is_revenue = true
  ```

- Per-plan and per–add-on lines use the same building blocks: `price × customers` for each plan/feature.

---

## 5. Operating costs section

The "Operating Costs" section shows:

- **Total Monthly Expenses:** Sum of (1) base operating costs and (2) add-on operating costs:
  - Base: for each operating cost, `amount` if fixed, else `unit_price × units`.
  - Add-on: `Σ (operating_cost_per_customer × customers)` over all add-ons.

This total is the same as **Monthly Operating Expenses** used in the summary and charts (it does not include marketing).

---

## 6. Marketing costs section

The "Marketing Costs" section shows:

- **Total Monthly Marketing:** Same as **Monthly Marketing Expenses** in section 3.2:
  - For each marketing cost: `plan_price × customers × (rate / 100)` with plan prices 99 / 382 / 655 by plan name.
  - Sum over all marketing cost items.

---

## 7. Visual analytics (charts section)

### 7.1 Monthly cash flow bars

Three horizontal bars (Revenue, Total Expenses, Net Profit), with lengths as a percentage of the larger of Monthly Revenue and Total Monthly Expenses.

**Formulas:**

```
maxValue = max(Monthly Revenue, Total Monthly Expenses)

Revenue bar width %      = (Monthly Revenue / maxValue) × 100
Expenses bar width %     = (Total Monthly Expenses / maxValue) × 100
Net Profit bar width %   = |Monthly Profit| / maxValue × 100
```

Values shown next to the bars are the same **Monthly Revenue**, **Total Monthly Expenses**, and **Monthly Profit** from sections 1.1–1.3.

---

### 7.2 Revenue distribution

**Plan revenue (total):**

```
Total Plan Revenue = Σ (plan.price × plan.customers)
```

**Add-on revenue (total):**

```
Total Add-on Revenue = Σ (addon.price × addon.customers)
```

(Charts use all add-ons for this total; revenue used in the main summary only includes add-ons with `is_revenue === true`.)

**Total revenue (for percentages):**

```
Total Revenue = Total Plan Revenue + Total Add-on Revenue
```

**Percentages:**

- Plan revenue % = (Total Plan Revenue / Total Revenue) × 100  
- Add-on revenue % = (Total Add-on Revenue / Total Revenue) × 100  
- Per plan: `(plan.price × plan.customers) / Total Revenue × 100`  
- Per add-on: `(addon.price × addon.customers) / Total Revenue × 100`

---

### 7.3 Expense breakdown

Two bars showing the share of **Total Monthly Expenses** from operating vs marketing.

**Formulas:**

```
Operating share % = (Monthly Operating Expenses / Total Monthly Expenses) × 100
Marketing share % = (Monthly Marketing Expenses / Total Monthly Expenses) × 100
```

The amounts shown are **Monthly Operating Expenses** and **Monthly Marketing Expenses** from section 3.

---

## Summary of data flow

| Metric                         | Source / formula                                                                 |
|--------------------------------|-----------------------------------------------------------------------------------|
| Monthly Revenue                | Plans (price×customers) + revenue add-ons (price×customers)                      |
| Monthly Operating Expenses     | Fixed/variable operating costs + add-on (operating_cost_per_customer×customers)  |
| Monthly Marketing Expenses     | Σ plan_price×customers×(rate/100); plan price by name (99/382/655)              |
| Total Monthly Expenses         | Operating + Marketing                                                            |
| Monthly Profit                 | Revenue − Total Monthly Expenses                                                 |
| Break-even Months              | Capital Expenditure / Monthly Profit (or 0)                                      |
| Annual Revenue / Operating / Marketing | Monthly × 12                                                             |
| Annual Profit (Net Annual Cash Flow)   | Annual Revenue − Annual Operating − Annual Marketing − Capital Expenditure |

All numbers shown on the landing screen derive from these calculations and the current scenario’s plans, add-ons, operating costs, marketing costs, and capital expenditure.
