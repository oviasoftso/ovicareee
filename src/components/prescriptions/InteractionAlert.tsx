import { AlertTriangle, ShieldAlert, Info, AlertCircle } from "lucide-react";
import { severityColor, type DrugInteraction } from "@/lib/drug-interactions";

interface Props {
  interactions: DrugInteraction[];
}

const SEVERITY_ICONS: Record<string, typeof AlertTriangle> = {
  mild: Info,
  moderate: AlertTriangle,
  severe: AlertCircle,
  contraindicated: ShieldAlert,
};

export function InteractionAlert({ interactions }: Props) {
  if (interactions.length === 0) return null;

  return (
    <div className="space-y-2">
      {interactions.map((ix) => {
        const Icon = SEVERITY_ICONS[ix.severity] ?? AlertTriangle;
        return (
          <div key={ix.id} className={`rounded-lg border p-3 ${severityColor(ix.severity)}`}>
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Icon className="h-4 w-4" />
              {ix.drug_a} + {ix.drug_b}
              <span className="ml-auto text-xs uppercase font-bold">{ix.severity}</span>
            </div>
            <p className="text-sm mt-1">{ix.description}</p>
            {ix.recommendation && (
              <p className="text-xs mt-1 opacity-80">Recommendation: {ix.recommendation}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
