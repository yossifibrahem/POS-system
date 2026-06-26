"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/app-context";
import { parseMoneyToCents } from "@/lib/format";
import type { ActionState } from "@/lib/types";

export async function openRegisterAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const context = await requireAppContext();
    const openingCashCents = parseMoneyToCents(formData.get("openingCash"));

    const { error } = await context.supabase.rpc("open_register_session", {
      p_store_id: context.store.id,
      p_opening_cash_cents: openingCashCents
    });

    if (error) throw error;

    revalidatePath("/pos");
    revalidatePath("/dashboard");

    return { ok: true, message: "Register opened." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Register was not opened." };
  }
}

export async function closeRegisterAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const context = await requireAppContext();
    const registerSessionId = String(formData.get("registerSessionId") ?? "");
    const actualCashCents = parseMoneyToCents(formData.get("actualCash"));

    if (!registerSessionId) {
      return { error: "Register session is required." };
    }

    const { data, error } = await context.supabase.rpc("close_register_session", {
      p_register_session_id: registerSessionId,
      p_actual_cash_cents: actualCashCents
    });

    if (error) throw error;

    revalidatePath("/pos");
    revalidatePath("/dashboard");
    revalidatePath("/reports/daily");

    const closeout = data as { difference_cents?: number } | null;

    return {
      ok: true,
      message: `Register closed. Difference: ${Number(closeout?.difference_cents ?? 0) / 100}`
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Register was not closed." };
  }
}
