"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerContext } from "@/lib/app-context";
import { parseNumber } from "@/lib/format";
import type { ActionState } from "@/lib/types";

export async function adjustInventoryAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const context = await requireOwnerContext();
    const variantId = String(formData.get("variantId") ?? "");
    const quantityDelta = parseNumber(formData.get("quantityDelta"));
    const note = String(formData.get("note") ?? "").trim();
    const movementType =
      String(formData.get("movementType") ?? "adjustment") === "opening"
        ? "opening"
        : "adjustment";

    if (!variantId) {
      return { error: "Choose a product variant." };
    }

    if (quantityDelta === 0) {
      return { error: "Adjustment quantity cannot be zero." };
    }

    const { error } = await context.supabase.rpc("adjust_inventory", {
      p_store_id: context.store.id,
      p_product_variant_id: variantId,
      p_quantity_delta: quantityDelta,
      p_note: note || null,
      p_movement_type: movementType
    });

    if (error) throw error;

    revalidatePath("/inventory");
    revalidatePath("/dashboard");

    return { ok: true, message: "Inventory adjusted." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Inventory was not adjusted."
    };
  }
}
