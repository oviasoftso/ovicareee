export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          branch_id: string | null;
          created_at: string;
          details: Json | null;
          id: string;
          record_id: string | null;
          table_name: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          branch_id?: string | null;
          created_at?: string;
          details?: Json | null;
          id?: string;
          record_id?: string | null;
          table_name?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          branch_id?: string | null;
          created_at?: string;
          details?: Json | null;
          id?: string;
          record_id?: string | null;
          table_name?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      branches: {
        Row: {
          address: string | null;
          city: string | null;
          code: string;
          created_at: string;
          email: string | null;
          id: string;
          is_active: boolean;
          latitude: number | null;
          longitude: number | null;
          name: string;
          opening_hours: string | null;
          phone: string | null;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          code: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          opening_hours?: string | null;
          phone?: string | null;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          code?: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          opening_hours?: string | null;
          phone?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          color: string | null;
          created_at: string;
          description: string | null;
          icon: string | null;
          id: string;
          name: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          amount: number;
          branch_id: string | null;
          category: string;
          created_at: string;
          description: string | null;
          expense_date: string;
          id: string;
          payment_method: string | null;
          recorded_by: string | null;
        };
        Insert: {
          amount: number;
          branch_id?: string | null;
          category: string;
          created_at?: string;
          description?: string | null;
          expense_date?: string;
          id?: string;
          payment_method?: string | null;
          recorded_by?: string | null;
        };
        Update: {
          amount?: number;
          branch_id?: string | null;
          category?: string;
          created_at?: string;
          description?: string | null;
          expense_date?: string;
          id?: string;
          payment_method?: string | null;
          recorded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory: {
        Row: {
          batch_number: string | null;
          branch_id: string;
          cost_price: number | null;
          created_at: string;
          expiry_date: string | null;
          id: string;
          location_in_store: string | null;
          product_id: string;
          quantity_in_stock: number;
          updated_at: string;
        };
        Insert: {
          batch_number?: string | null;
          branch_id: string;
          cost_price?: number | null;
          created_at?: string;
          expiry_date?: string | null;
          id?: string;
          location_in_store?: string | null;
          product_id: string;
          quantity_in_stock?: number;
          updated_at?: string;
        };
        Update: {
          batch_number?: string | null;
          branch_id?: string;
          cost_price?: number | null;
          created_at?: string;
          expiry_date?: string | null;
          id?: string;
          location_in_store?: string | null;
          product_id?: string;
          quantity_in_stock?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      loyalty_transactions: {
        Row: {
          balance_after: number;
          created_at: string;
          id: string;
          notes: string | null;
          patient_id: string;
          points_earned: number;
          points_redeemed: number;
          sale_id: string | null;
          transaction_type: string;
        };
        Insert: {
          balance_after?: number;
          created_at?: string;
          id?: string;
          notes?: string | null;
          patient_id: string;
          points_earned?: number;
          points_redeemed?: number;
          sale_id?: string | null;
          transaction_type?: string;
        };
        Update: {
          balance_after?: number;
          created_at?: string;
          id?: string;
          notes?: string | null;
          patient_id?: string;
          points_earned?: number;
          points_redeemed?: number;
          sale_id?: string | null;
          transaction_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "loyalty_transactions_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          action_url: string | null;
          body: string | null;
          created_at: string;
          id: string;
          is_read: boolean;
          recipient_id: string;
          title: string;
          type: string | null;
        };
        Insert: {
          action_url?: string | null;
          body?: string | null;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          recipient_id: string;
          title: string;
          type?: string | null;
        };
        Update: {
          action_url?: string | null;
          body?: string | null;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          recipient_id?: string;
          title?: string;
          type?: string | null;
        };
        Relationships: [];
      };
      patients: {
        Row: {
          address: string | null;
          allergies: string[] | null;
          blood_type: string | null;
          chronic_conditions: string[] | null;
          created_at: string;
          date_of_birth: string | null;
          email: string | null;
          full_name: string;
          gender: string | null;
          id: string;
          insurance_number: string | null;
          insurance_provider: string | null;
          loyalty_points: number;
          patient_code: string;
          phone: string | null;
          registered_branch_id: string | null;
          user_id: string | null;
        };
        Insert: {
          address?: string | null;
          allergies?: string[] | null;
          blood_type?: string | null;
          chronic_conditions?: string[] | null;
          created_at?: string;
          date_of_birth?: string | null;
          email?: string | null;
          full_name: string;
          gender?: string | null;
          id?: string;
          insurance_number?: string | null;
          insurance_provider?: string | null;
          loyalty_points?: number;
          patient_code: string;
          phone?: string | null;
          registered_branch_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          address?: string | null;
          allergies?: string[] | null;
          blood_type?: string | null;
          chronic_conditions?: string[] | null;
          created_at?: string;
          date_of_birth?: string | null;
          email?: string | null;
          full_name?: string;
          gender?: string | null;
          id?: string;
          insurance_number?: string | null;
          insurance_provider?: string | null;
          loyalty_points?: number;
          patient_code?: string;
          phone?: string | null;
          registered_branch_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "patients_registered_branch_id_fkey";
            columns: ["registered_branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      prescription_items: {
        Row: {
          dosage: string | null;
          duration: string | null;
          frequency: string | null;
          id: string;
          notes: string | null;
          prescription_id: string;
          product_id: string | null;
          quantity_dispensed: number;
          quantity_prescribed: number;
        };
        Insert: {
          dosage?: string | null;
          duration?: string | null;
          frequency?: string | null;
          id?: string;
          notes?: string | null;
          prescription_id: string;
          product_id?: string | null;
          quantity_dispensed?: number;
          quantity_prescribed?: number;
        };
        Update: {
          dosage?: string | null;
          duration?: string | null;
          frequency?: string | null;
          id?: string;
          notes?: string | null;
          prescription_id?: string;
          product_id?: string | null;
          quantity_dispensed?: number;
          quantity_prescribed?: number;
        };
        Relationships: [
          {
            foreignKeyName: "prescription_items_prescription_id_fkey";
            columns: ["prescription_id"];
            isOneToOne: false;
            referencedRelation: "prescriptions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prescription_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      prescriptions: {
        Row: {
          branch_id: string | null;
          created_at: string;
          dispensed_by: string | null;
          expiry_date: string | null;
          id: string;
          image_url: string | null;
          issue_date: string;
          notes: string | null;
          patient_id: string;
          prescriber_license: string | null;
          prescriber_name: string;
          prescriber_phone: string | null;
          prescription_number: string;
          status: Database["public"]["Enums"]["prescription_status"];
        };
        Insert: {
          branch_id?: string | null;
          created_at?: string;
          dispensed_by?: string | null;
          expiry_date?: string | null;
          id?: string;
          image_url?: string | null;
          issue_date?: string;
          notes?: string | null;
          patient_id: string;
          prescriber_license?: string | null;
          prescriber_name: string;
          prescriber_phone?: string | null;
          prescription_number: string;
          status?: Database["public"]["Enums"]["prescription_status"];
        };
        Update: {
          branch_id?: string | null;
          created_at?: string;
          dispensed_by?: string | null;
          expiry_date?: string | null;
          id?: string;
          image_url?: string | null;
          issue_date?: string;
          notes?: string | null;
          patient_id?: string;
          prescriber_license?: string | null;
          prescriber_name?: string;
          prescriber_phone?: string | null;
          prescription_number?: string;
          status?: Database["public"]["Enums"]["prescription_status"];
        };
        Relationships: [
          {
            foreignKeyName: "prescriptions_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          brand: string | null;
          category_id: string | null;
          cost_price: number;
          created_at: string;
          description: string | null;
          dosage_form: string | null;
          generic_name: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean;
          is_controlled: boolean;
          name: string;
          reorder_level: number;
          reorder_quantity: number;
          requires_prescription: boolean;
          selling_price: number;
          sku: string;
          storage_temp: string | null;
          strength: string | null;
          supplier_id: string | null;
          tax_rate: number;
          unit: string | null;
        };
        Insert: {
          brand?: string | null;
          category_id?: string | null;
          cost_price?: number;
          created_at?: string;
          description?: string | null;
          dosage_form?: string | null;
          generic_name?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          is_controlled?: boolean;
          name: string;
          reorder_level?: number;
          reorder_quantity?: number;
          requires_prescription?: boolean;
          selling_price?: number;
          sku: string;
          storage_temp?: string | null;
          strength?: string | null;
          supplier_id?: string | null;
          tax_rate?: number;
          unit?: string | null;
        };
        Update: {
          brand?: string | null;
          category_id?: string | null;
          cost_price?: number;
          created_at?: string;
          description?: string | null;
          dosage_form?: string | null;
          generic_name?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          is_controlled?: boolean;
          name?: string;
          reorder_level?: number;
          reorder_quantity?: number;
          requires_prescription?: boolean;
          selling_price?: number;
          sku?: string;
          storage_temp?: string | null;
          strength?: string | null;
          supplier_id?: string | null;
          tax_rate?: number;
          unit?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          branch_id: string | null;
          created_at: string;
          full_name: string;
          id: string;
          is_active: boolean;
          last_login: string | null;
          phone: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          branch_id?: string | null;
          created_at?: string;
          full_name: string;
          id: string;
          is_active?: boolean;
          last_login?: string | null;
          phone?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          branch_id?: string | null;
          created_at?: string;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          last_login?: string | null;
          phone?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      sale_items: {
        Row: {
          discount: number;
          id: string;
          inventory_id: string | null;
          product_id: string | null;
          product_name: string;
          quantity: number;
          sale_id: string;
          total_price: number;
          unit_price: number;
        };
        Insert: {
          discount?: number;
          id?: string;
          inventory_id?: string | null;
          product_id?: string | null;
          product_name: string;
          quantity?: number;
          sale_id: string;
          total_price?: number;
          unit_price?: number;
        };
        Update: {
          discount?: number;
          id?: string;
          inventory_id?: string | null;
          product_id?: string | null;
          product_name?: string;
          quantity?: number;
          sale_id?: string;
          total_price?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sale_items_inventory_id_fkey";
            columns: ["inventory_id"];
            isOneToOne: false;
            referencedRelation: "inventory";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      sales: {
        Row: {
          branch_id: string;
          cashier_id: string | null;
          created_at: string;
          discount_amount: number;
          id: string;
          notes: string | null;
          patient_id: string | null;
          payment_method: Database["public"]["Enums"]["payment_method"];
          payment_reference: string | null;
          prescription_id: string | null;
          receipt_number: string;
          sale_date: string;
          status: Database["public"]["Enums"]["sale_status"];
          subtotal: number;
          tax_amount: number;
          total_amount: number;
        };
        Insert: {
          branch_id: string;
          cashier_id?: string | null;
          created_at?: string;
          discount_amount?: number;
          id?: string;
          notes?: string | null;
          patient_id?: string | null;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          payment_reference?: string | null;
          prescription_id?: string | null;
          receipt_number: string;
          sale_date?: string;
          status?: Database["public"]["Enums"]["sale_status"];
          subtotal?: number;
          tax_amount?: number;
          total_amount?: number;
        };
        Update: {
          branch_id?: string;
          cashier_id?: string | null;
          created_at?: string;
          discount_amount?: number;
          id?: string;
          notes?: string | null;
          patient_id?: string | null;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          payment_reference?: string | null;
          prescription_id?: string | null;
          receipt_number?: string;
          sale_date?: string;
          status?: Database["public"]["Enums"]["sale_status"];
          subtotal?: number;
          tax_amount?: number;
          total_amount?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sales_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_prescription_id_fkey";
            columns: ["prescription_id"];
            isOneToOne: false;
            referencedRelation: "prescriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      suppliers: {
        Row: {
          address: string | null;
          contact_person: string | null;
          created_at: string;
          email: string | null;
          id: string;
          is_active: boolean;
          name: string;
          notes: string | null;
          payment_terms: string | null;
          phone: string | null;
          rating: number | null;
        };
        Insert: {
          address?: string | null;
          contact_person?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          notes?: string | null;
          payment_terms?: string | null;
          phone?: string | null;
          rating?: number | null;
        };
        Update: {
          address?: string | null;
          contact_person?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          notes?: string | null;
          payment_terms?: string | null;
          phone?: string | null;
          rating?: number | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_branch: { Args: { _user_id: string }; Returns: string };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_admin: { Args: { _user_id: string }; Returns: boolean };
      is_staff: { Args: { _user_id: string }; Returns: boolean };
    };
    Enums: {
      app_role:
        | "super_admin"
        | "director"
        | "branch_manager"
        | "pharmacist"
        | "cashier"
        | "inventory_clerk"
        | "customer";
      payment_method: "cash" | "card" | "mobile_money" | "insurance" | "split";
      po_status: "draft" | "sent" | "confirmed" | "partial" | "received" | "cancelled";
      prescription_status:
        | "pending"
        | "verifying"
        | "dispensing"
        | "ready"
        | "completed"
        | "expired"
        | "cancelled";
      sale_status: "completed" | "held" | "refunded" | "voided";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "director",
        "branch_manager",
        "pharmacist",
        "cashier",
        "inventory_clerk",
        "customer",
      ],
      payment_method: ["cash", "card", "mobile_money", "insurance", "split"],
      po_status: ["draft", "sent", "confirmed", "partial", "received", "cancelled"],
      prescription_status: [
        "pending",
        "verifying",
        "dispensing",
        "ready",
        "completed",
        "expired",
        "cancelled",
      ],
      sale_status: ["completed", "held", "refunded", "voided"],
    },
  },
} as const;
