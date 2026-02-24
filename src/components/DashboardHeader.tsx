import { Plus, TrendingUp, Beaker } from "lucide-react";
import type { ForecastScenario } from "../types/forecast";

interface DashboardHeaderProps {
  scenarios: ForecastScenario[];
  selectedScenarioId: string | null;
  onScenarioChange: (id: string) => void;
  onCreateScenario: () => void;
  onSimulateClick: () => void;
  scenario: ForecastScenario | null;
}

export default function DashboardHeader({
  scenarios,
  selectedScenarioId,
  onScenarioChange,
  onCreateScenario,
  onSimulateClick,
  scenario,
}: DashboardHeaderProps) {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Tricoexam Revenue Forecast
              </h1>
              <p className="text-sm text-slate-600">
                Interactive forecasting dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onSimulateClick}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Beaker className="w-4 h-4" />
              Bundle Simulator
            </button>
            <button
              onClick={onCreateScenario}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Scenario
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-700">
            Scenario:
          </label>
          <select
            value={selectedScenarioId || ""}
            onChange={(e) => onScenarioChange(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {scenario && (
            <div className="ml-auto text-sm text-slate-600">
              Capital Expenditure:{" "}
              <span className="font-semibold text-slate-900">
                ${scenario.capital_expenditure.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
