"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAppContext, requireOwnerContext } from "@/lib/app-context";
import type { SaleReceipt } from "@/lib/types";

export async function completeCashSaleAction(input: {
  registerSessionId: string;
  cartItems: Array<{ variant_id: string; quantity: number }>;
  cashReceivedCents: number;
  discountCents: number;
}): Promise<{ ok: true; receipt: SaleReceipt } | { ok: false; error: string }> {
  try {
    const context = await requireAppContext();

    const { data, error } = await context.supabase.rpc("complete_cash_sale", {
      p_store_id: context.store.id,
      p_register_session_id: input.registerSessionId,
      p_cart_items: input.cartItems,
      p_cash_received_cents: input.cashReceivedCents,
      p_discount_cents: input.discountCents
    });

    if (error) throw error;

    revalidatePath("/dashboard");
    revalidatePath("/pos");
    revalidatePath("/sales");
    revalidatePath("/inventory");

    return { ok: true, receipt: data as SaleReceipt };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Sale could not be completed."
    };
  }
}

export async function voidSaleAction(formData: FormData) {
  const context = await requireOwnerContext();
  const saleId = String(formData.get("saleId") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  const { error } = await context.supabase.rpc("void_sale", {
    p_sale_id: saleId,
    p_note: note || null
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/sales");
  revalidatePath(`/sales/${saleId}`);
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
  redirect(`/sales/${saleId}`);
}
