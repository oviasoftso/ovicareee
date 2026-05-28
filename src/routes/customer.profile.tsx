import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, AlertTriangle, Heart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/customer/profile")({ component: CustomerProfile });

function CustomerProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", address: "", date_of_birth: "", gender: "", blood_type: "",
    allergies: [] as string[], chronic_conditions: [] as string[],
    insurance_provider: "", insurance_number: "",
  });
  const [allergyInput, setAllergyInput] = useState("");
  const [conditionInput, setConditionInput] = useState("");

  const { data: patient } = useQuery({
    queryKey: ["customer-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("patients").select("*").eq("user_id", user.id).single();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (patient) {
      setForm({
        full_name: patient.full_name ?? "",
        phone: patient.phone ?? "",
        email: patient.email ?? "",
        address: patient.address ?? "",
        date_of_birth: patient.date_of_birth ?? "",
        gender: patient.gender ?? "",
        blood_type: patient.blood_type ?? "",
        allergies: patient.allergies ?? [],
        chronic_conditions: patient.chronic_conditions ?? [],
        insurance_provider: patient.insurance_provider ?? "",
        insurance_number: patient.insurance_number ?? "",
      });
    }
  }, [patient]);

  const handleSave = async () => {
    if (!patient) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("patients").update({
        full_name: form.full_name,
        phone: form.phone,
        address: form.address,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        blood_type: form.blood_type || null,
        allergies: form.allergies,
        chronic_conditions: form.chronic_conditions,
        insurance_provider: form.insurance_provider,
        insurance_number: form.insurance_number,
      }).eq("id", patient.id);
      if (error) throw error;
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["customer-profile"] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const addAllergy = () => {
    if (allergyInput.trim() && !form.allergies.includes(allergyInput.trim())) {
      setForm({ ...form, allergies: [...form.allergies, allergyInput.trim()] });
      setAllergyInput("");
    }
  };
  const removeAllergy = (a: string) => setForm({ ...form, allergies: form.allergies.filter((x) => x !== a) });

  const addCondition = () => {
    if (conditionInput.trim() && !form.chronic_conditions.includes(conditionInput.trim())) {
      setForm({ ...form, chronic_conditions: [...form.chronic_conditions, conditionInput.trim()] });
      setConditionInput("");
    }
  };
  const removeCondition = (c: string) => setForm({ ...form, chronic_conditions: form.chronic_conditions.filter((x) => x !== c) });

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10">
      <PageHeader title="My Profile" subtitle="Manage your personal and medical information" />

      <div className="space-y-6">
        <div className="rounded-xl bg-card border p-6 shadow-card">
          <h3 className="font-display font-semibold mb-4">Personal Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Full Name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={form.email} disabled className="opacity-60" /></div>
            <div><Label>Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} /></div>
            <div><Label>Gender</Label><Input value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} placeholder="Male/Female/Other" /></div>
            <div><Label>Blood Type</Label><Input value={form.blood_type} onChange={(e) => setForm({ ...form, blood_type: e.target.value })} placeholder="A+, B-, O+, etc." /></div>
            <div className="col-span-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          </div>
        </div>

        <div className="rounded-xl bg-card border p-6 shadow-card">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> Allergies</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {form.allergies.map((a) => (
              <Badge key={a} variant="destructive" className="cursor-pointer" onClick={() => removeAllergy(a)}>{a} x</Badge>
            ))}
            {form.allergies.length === 0 && <span className="text-sm text-muted-foreground">No allergies recorded</span>}
          </div>
          <div className="flex gap-2">
            <Input value={allergyInput} onChange={(e) => setAllergyInput(e.target.value)} placeholder="Add allergy" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAllergy())} />
            <Button type="button" variant="outline" onClick={addAllergy}>Add</Button>
          </div>
        </div>

        <div className="rounded-xl bg-card border p-6 shadow-card">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2"><Heart className="h-5 w-5 text-primary" /> Chronic Conditions</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {form.chronic_conditions.map((c) => (
              <Badge key={c} variant="secondary" className="cursor-pointer" onClick={() => removeCondition(c)}>{c} x</Badge>
            ))}
            {form.chronic_conditions.length === 0 && <span className="text-sm text-muted-foreground">No conditions recorded</span>}
          </div>
          <div className="flex gap-2">
            <Input value={conditionInput} onChange={(e) => setConditionInput(e.target.value)} placeholder="Add condition" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCondition())} />
            <Button type="button" variant="outline" onClick={addCondition}>Add</Button>
          </div>
        </div>

        <div className="rounded-xl bg-card border p-6 shadow-card">
          <h3 className="font-display font-semibold mb-4">Insurance</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Provider</Label><Input value={form.insurance_provider} onChange={(e) => setForm({ ...form, insurance_provider: e.target.value })} /></div>
            <div><Label>Policy Number</Label><Input value={form.insurance_number} onChange={(e) => setForm({ ...form, insurance_number: e.target.value })} /></div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="gradient-primary text-white px-8">
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}<Save className="h-4 w-4 mr-2" /> Save Changes
        </Button>
      </div>
    </div>
  );
}
