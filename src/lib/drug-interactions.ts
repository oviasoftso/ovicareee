import { supabase } from "@/integrations/supabase/client";

export interface DrugInteraction {
  id: string;
  drug_a: string;
  drug_b: string;
  severity: "mild" | "moderate" | "severe" | "contraindicated";
  description: string;
  recommendation: string | null;
}

export async function checkInteractions(drugNames: string[]): Promise<DrugInteraction[]> {
  if (drugNames.length < 2) return [];

  const normalized = drugNames.map((n) => n.toLowerCase().trim());
  const conditions = normalized.flatMap((name) => [
    `drug_a.ilike.%${name}%`,
    `drug_b.ilike.%${name}%`,
  ]);

  const { data, error } = await supabase
    .from("drug_interactions")
    .select("*")
    .or(conditions.join(","));

  if (error || !data) return [];

  return data.filter((interaction: any) => {
    const a = interaction.drug_a.toLowerCase();
    const b = interaction.drug_b.toLowerCase();
    const hasA = normalized.some((n) => a.includes(n) || n.includes(a));
    const hasB = normalized.some((n) => b.includes(n) || n.includes(b));
    return hasA && hasB;
  });
}

export function severityColor(severity: string): string {
  switch (severity) {
    case "mild":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "moderate":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "severe":
      return "bg-red-100 text-red-800 border-red-200";
    case "contraindicated":
      return "bg-red-200 text-red-900 border-red-300";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
