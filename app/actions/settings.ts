"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerContext } from "@/lib/app-context";
import type { ActionState } from "@/lib/types";

export async function updateSettingsAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const context = await requireOwnerContext();
    const businessName = String(formData.get("businessName") ?? "").trim();
    const storeName = String(formData.get("storeName") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const currency = String(formData.get("currency") ?? "USD").trim().toUpperCase();
    const timezone = String(formData.get("timezone") ?? "UTC").trim();
    const taxRate = Number(String(formData.get("taxRate") ?? "0"));

    if (!businessName || !storeName || !currency || !timezone) {
      return { error: "Business, store, currency, and timezone are required." };
    }

    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
      return { error: "Tax rate must be between 0 and 100." };
    }

    const { error: orgError } = await context.supabase
      .from("organizations")
      .update({
        name: businessName,
        currency,
        timezone,
        tax_rate_basis_points: Math.round(taxRate * 100)
      })
      .eq("id", context.organization.id);

    if (orgError) throw orgError;

    const { error: storeError } = await context.supabase
      .from("stores")
      .update({
        name: storeName,
        address: address || null
      })
      .eq("id", context.store.id);

    if (storeError) throw storeError;

    await context.supabase.from("audit_logs").insert({
      organization_id: context.organization.id,
      actor_id: context.user.id,
      action: "update_settings",
      entity_type: "organization",
      entity_id: context.organization.id,
      after_data: { businessName, storeName, currency, timezone, taxRate }
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return { ok: true, message: "Settings updated." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Settings were not updated." };
  }
}
