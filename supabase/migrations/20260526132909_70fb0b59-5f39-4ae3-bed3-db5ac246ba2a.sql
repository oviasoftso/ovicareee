
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM (
  'super_admin','director','branch_manager','pharmacist','cashier','inventory_clerk','customer'
);

CREATE TYPE public.prescription_status AS ENUM (
  'pending','verifying','dispensing','ready','completed','expired','cancelled'
);

CREATE TYPE public.sale_status AS ENUM ('completed','held','refunded','voided');

CREATE TYPE public.payment_method AS ENUM ('cash','card','mobile_money','insurance','split');

CREATE TYPE public.po_status AS ENUM ('draft','sent','confirmed','partial','received','cancelled');

-- ============ BRANCHES ============
CREATE TABLE public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  address text,
  city text,
  phone text,
  email text,
  opening_hours text,
  latitude numeric,
  longitude numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  avatar_url text,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_login timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ USER ROLES (separate for security) ============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- security definer for RLS checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin','director','branch_manager','pharmacist','cashier','inventory_clerk')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('super_admin','director')
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_branch(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT branch_id FROM public.profiles WHERE id = _user_id
$$;

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  color text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ SUPPLIERS ============
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  address text,
  payment_terms text,
  rating numeric DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  generic_name text,
  brand text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  description text,
  unit text DEFAULT 'unit',
  dosage_form text,
  strength text,
  requires_prescription boolean NOT NULL DEFAULT false,
  is_controlled boolean NOT NULL DEFAULT false,
  reorder_level int NOT NULL DEFAULT 10,
  reorder_quantity int NOT NULL DEFAULT 50,
  storage_temp text,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  cost_price numeric(12,2) NOT NULL DEFAULT 0,
  selling_price numeric(12,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ INVENTORY (per-branch stock) ============
CREATE TABLE public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  batch_number text,
  expiry_date date,
  quantity_in_stock int NOT NULL DEFAULT 0,
  cost_price numeric(12,2),
  location_in_store text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_inventory_branch_product ON public.inventory(branch_id, product_id);
CREATE INDEX idx_inventory_expiry ON public.inventory(expiry_date);

-- ============ PATIENTS ============
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  patient_code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  date_of_birth date,
  gender text,
  phone text,
  email text,
  address text,
  blood_type text,
  allergies text[],
  chronic_conditions text[],
  insurance_provider text,
  insurance_number text,
  loyalty_points int NOT NULL DEFAULT 0,
  registered_branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ PRESCRIPTIONS ============
CREATE TABLE public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_number text NOT NULL UNIQUE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  prescriber_name text NOT NULL,
  prescriber_license text,
  prescriber_phone text,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date date,
  status public.prescription_status NOT NULL DEFAULT 'pending',
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  dispensed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  image_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.prescription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  dosage text,
  frequency text,
  duration text,
  quantity_prescribed int NOT NULL DEFAULT 1,
  quantity_dispensed int NOT NULL DEFAULT 0,
  notes text
);

-- ============ SALES ============
CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number text NOT NULL UNIQUE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  cashier_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  prescription_id uuid REFERENCES public.prescriptions(id) ON DELETE SET NULL,
  sale_date timestamptz NOT NULL DEFAULT now(),
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  payment_method public.payment_method NOT NULL DEFAULT 'cash',
  payment_reference text,
  status public.sale_status NOT NULL DEFAULT 'completed',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sales_branch_date ON public.sales(branch_id, sale_date DESC);

CREATE TABLE public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  inventory_id uuid REFERENCES public.inventory(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  total_price numeric(12,2) NOT NULL DEFAULT 0
);

-- ============ EXPENSES ============
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  category text NOT NULL,
  description text,
  amount numeric(12,2) NOT NULL,
  payment_method text,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ LOYALTY ============
CREATE TABLE public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  points_earned int NOT NULL DEFAULT 0,
  points_redeemed int NOT NULL DEFAULT 0,
  balance_after int NOT NULL DEFAULT 0,
  transaction_type text NOT NULL DEFAULT 'earn',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  type text DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  action_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id, is_read);

-- ============ AUDIT LOG ============
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text,
  record_id text,
  details jsonb,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ GRANTS ============
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescription_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- ============ RLS ============
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- branches
CREATE POLICY "Staff read branches" ON public.branches FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Admins manage branches" ON public.branches FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- profiles
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Admins manage profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- user_roles
CREATE POLICY "Read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- shared catalogues (categories/suppliers/products)
CREATE POLICY "Staff read categories" ON public.categories FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff write categories" ON public.categories FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff read suppliers" ON public.suppliers FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff write suppliers" ON public.suppliers FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff read products" ON public.products FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff write products" ON public.products FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- inventory (branch-scoped)
CREATE POLICY "Staff read inventory" ON public.inventory FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff write inventory" ON public.inventory FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- patients
CREATE POLICY "Staff read patients" ON public.patients FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff write patients" ON public.patients FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Customer reads own patient" ON public.patients FOR SELECT TO authenticated USING (user_id = auth.uid());

-- prescriptions
CREATE POLICY "Staff read prescriptions" ON public.prescriptions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff write prescriptions" ON public.prescriptions FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Customer reads own prescriptions" ON public.prescriptions FOR SELECT TO authenticated USING (
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);
CREATE POLICY "Staff read rx items" ON public.prescription_items FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff write rx items" ON public.prescription_items FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- sales
CREATE POLICY "Staff read sales" ON public.sales FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff write sales" ON public.sales FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Customer reads own sales" ON public.sales FOR SELECT TO authenticated USING (
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);
CREATE POLICY "Staff read sale items" ON public.sale_items FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff write sale items" ON public.sale_items FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- expenses
CREATE POLICY "Staff read expenses" ON public.expenses FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Admins or managers write expenses" ON public.expenses FOR ALL TO authenticated USING (
  public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'branch_manager')
) WITH CHECK (
  public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'branch_manager')
);

-- loyalty
CREATE POLICY "Staff read loyalty" ON public.loyalty_transactions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Customer read own loyalty" ON public.loyalty_transactions FOR SELECT TO authenticated USING (
  patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);
CREATE POLICY "Staff write loyalty" ON public.loyalty_transactions FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- notifications
CREATE POLICY "Own notifications" ON public.notifications FOR ALL TO authenticated USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());

-- audit logs
CREATE POLICY "Admins read audit" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- ============ TRIGGER: auto-create profile on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)));
  -- default role: customer (staff roles assigned manually by admin)
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
