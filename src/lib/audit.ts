import { supabase } from "@/integrations/supabase/client";

export async function logAudit(
  action: string,
  tableName: string,
  recordId: string,
  details?: Record<string, unknown>,
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("audit_logs").insert({
      action,
      table_name: tableName,
      record_id: recordId,
      details: details ?? {},
      user_id: user?.id,
    });
  } catch {
    // Silent fail - audit logging should not block operations
  }
}
