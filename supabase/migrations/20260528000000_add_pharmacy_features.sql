-- ============================================================
-- OviCare Health Suite - Phase 2 Migration
-- New tables for pharmacy operations, inventory, POS, compliance
-- ============================================================

-- New columns on existing tables
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS barcode text UNIQUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS controlled_schedule text CHECK (controlled_schedule IN ('I', 'II', 'III', 'IV', 'V'));
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS next_refill_date date;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS is_credit boolean NOT NULL DEFAULT false;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS amount_paid numeric(12,2) NOT NULL DEFAULT 0;

-- ============================================================
-- Purchase Orders (Inventory - Smart Reordering)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number text NOT NULL UNIQUE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id),
  branch_id uuid NOT NULL REFERENCES public.branches(id),
  status public.po_status NOT NULL DEFAULT 'draft',
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  ordered_by uuid REFERENCES auth.users(id),
  ordered_at timestamptz,
  expected_delivery date,
  received_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity_ordered int NOT NULL,
  quantity_received int NOT NULL DEFAULT 0,
  unit_cost numeric(12,2) NOT NULL,
  total_cost numeric(12,2) NOT NULL
);

-- ============================================================
-- Drug Interactions (Safety Engine)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.drug_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_a text NOT NULL,
  drug_b text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe', 'contraindicated')),
  description text NOT NULL,
  recommendation text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interactions_drug_a ON public.drug_interactions(drug_a);
CREATE INDEX IF NOT EXISTS idx_interactions_drug_b ON public.drug_interactions(drug_b);

-- Seed common drug interactions
INSERT INTO public.drug_interactions (drug_a, drug_b, severity, description, recommendation) VALUES
('Warfarin', 'Aspirin', 'severe', 'Increased risk of bleeding when combined', 'Monitor INR closely; consider alternative antiplatelet'),
('Metformin', 'Alcohol', 'severe', 'Risk of lactic acidosis', 'Avoid alcohol consumption'),
('Lisinopril', 'Potassium', 'moderate', 'Risk of hyperkalemia', 'Monitor serum potassium levels'),
('Omeprazole', 'Clopidogrel', 'severe', 'Reduces effectiveness of clopidogrel', 'Use pantoprazole instead'),
('Simvastatin', 'Amiodarone', 'severe', 'Increased risk of rhabdomyolysis', 'Limit simvastatin to 20mg/day'),
('Fluoxetine', 'Tramadol', 'severe', 'Risk of serotonin syndrome', 'Use alternative analgesic'),
('Digoxin', 'Amiodarone', 'moderate', 'Increased digoxin levels', 'Reduce digoxin dose by 50%'),
('Metoprolol', 'Verapamil', 'severe', 'Risk of severe bradycardia and heart block', 'Avoid combination; use alternative'),
('Ciprofloxacin', 'Tizanidine', 'contraindicated', 'Severe hypotension risk', 'Contraindicated - use alternative antibiotic'),
('Lithium', 'Ibuprofen', 'moderate', 'Increased lithium levels', 'Monitor lithium levels closely')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Insurance Claims (Adjudication)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.insurance_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  insurance_provider text NOT NULL,
  insurance_number text NOT NULL,
  claim_amount numeric(12,2) NOT NULL,
  approved_amount numeric(12,2),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'partial', 'rejected', 'paid')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Cash Drawer Sessions (Cash Management)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cash_drawer_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id),
  opened_by uuid NOT NULL REFERENCES auth.users(id),
  closed_by uuid REFERENCES auth.users(id),
  opening_amount numeric(12,2) NOT NULL DEFAULT 0,
  closing_amount numeric(12,2),
  expected_amount numeric(12,2),
  variance numeric(12,2),
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  notes text
);

-- ============================================================
-- Refill Reminders (Patient Care)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.refill_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  prescription_id uuid REFERENCES public.prescriptions(id),
  product_id uuid REFERENCES public.products(id),
  reminder_date date NOT NULL,
  is_sent boolean NOT NULL DEFAULT false,
  is_dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Staff Performance Metrics
-- ============================================================
CREATE TABLE IF NOT EXISTS public.staff_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  branch_id uuid REFERENCES public.branches(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  sales_count int NOT NULL DEFAULT 0,
  sales_total numeric(12,2) NOT NULL DEFAULT 0,
  prescriptions_filled int NOT NULL DEFAULT 0,
  avg_fill_time_minutes numeric(8,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drug_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_drawer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refill_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_performance ENABLE ROW LEVEL SECURITY;

-- Purchase orders: staff can read/write
CREATE POLICY "Staff can view purchase orders" ON public.purchase_orders FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage purchase orders" ON public.purchase_orders FOR ALL USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can view PO items" ON public.purchase_order_items FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage PO items" ON public.purchase_order_items FOR ALL USING (public.is_staff(auth.uid()));

-- Drug interactions: all authenticated can read
CREATE POLICY "Authenticated can view interactions" ON public.drug_interactions FOR SELECT USING (auth.role() = 'authenticated');

-- Insurance claims: staff can read/write
CREATE POLICY "Staff can view insurance claims" ON public.insurance_claims FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage insurance claims" ON public.insurance_claims FOR ALL USING (public.is_staff(auth.uid()));

-- Cash drawer: staff can read/write
CREATE POLICY "Staff can view cash drawer" ON public.cash_drawer_sessions FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage cash drawer" ON public.cash_drawer_sessions FOR ALL USING (public.is_staff(auth.uid()));

-- Refill reminders: staff can read/write, customers can read own
CREATE POLICY "Staff can view refill reminders" ON public.refill_reminders FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage refill reminders" ON public.refill_reminders FOR ALL USING (public.is_staff(auth.uid()));
CREATE POLICY "Customers can view own reminders" ON public.refill_reminders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.patients WHERE patients.id = refill_reminders.patient_id AND patients.user_id = auth.uid())
);

-- Staff performance: admins can read
CREATE POLICY "Admins can view performance" ON public.staff_performance FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage performance" ON public.staff_performance FOR ALL USING (public.is_admin(auth.uid()));

-- ============================================================
-- Grants
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_order_items TO authenticated;
GRANT SELECT ON public.drug_interactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insurance_claims TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_drawer_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.refill_reminders TO authenticated;
GRANT SELECT ON public.staff_performance TO authenticated;

GRANT ALL ON public.purchase_orders TO service_role;
GRANT ALL ON public.purchase_order_items TO service_role;
GRANT ALL ON public.drug_interactions TO service_role;
GRANT ALL ON public.insurance_claims TO service_role;
GRANT ALL ON public.cash_drawer_sessions TO service_role;
GRANT ALL ON public.refill_reminders TO service_role;
GRANT ALL ON public.staff_performance TO service_role;
