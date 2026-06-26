"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireOwnerContext } from "@/lib/app-context";
import { parseMoneyToCents, parseNumber } from "@/lib/format";
import type { ActionState } from "@/lib/types";

const productSchema = z.object({
  name: z.string().min(2, "Product name is required."),
  description: z.string().optional(),
  categoryName: z.string().optional(),
  variantName: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  trackStock: z.boolean(),
  salePriceCents: z.number().int().min(0),
  costPriceCents: z.number().int().min(0),
  reorderLevel: z.number().min(0),
  openingStock: z.number().min(0)
});

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function uploadProductImage(formData: FormData, organizationId: string) {
  const file = formData.get("image");

  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${organizationId}/${randomUUID()}-${safeName}`;
  return { file, path };
}

async function ensureCategory(
  context: Awaited<ReturnType<typeof requireOwnerContext>>,
  categoryName?: string
) {
  const name = categoryName?.trim();
  if (!name) return null;

  const { data, error } = await context.supabase
    .from("categories")
    .upsert(
      {
        organization_id: context.organization.id,
        name,
        is_active: true
      },
      { onConflict: "organization_id,name" }
    )
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

function readProductForm(formData: FormData) {
  return productSchema.parse({
    name: text(formData, "name"),
    description: text(formData, "description"),
    categoryName: text(formData, "categoryName"),
    variantName: text(formData, "variantName"),
    sku: text(formData, "sku"),
    barcode: text(formData, "barcode"),
    trackStock: formData.get("trackStock") === "on",
    salePriceCents: parseMoneyToCents(formData.get("salePrice")),
    costPriceCents: parseMoneyToCents(formData.get("costPrice")),
    reorderLevel: parseNumber(formData.get("reorderLevel")),
    openingStock: parseNumber(formData.get("openingStock"))
  });
}

export async function createProductAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const context = await requireOwnerContext();
    const input = readProductForm(formData);
    const categoryId = await ensureCategory(context, input.categoryName);
    let imageUrl: string | null = null;
    const upload = await uploadProductImage(formData, context.organization.id);

    if (upload) {
      const { error: uploadError } = await context.supabase.storage
        .from("product-images")
        .upload(upload.path, upload.file, {
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = context.supabase.storage
        .from("product-images")
        .getPublicUrl(upload.path);
      imageUrl = data.publicUrl;
    }

    const { data: product, error: productError } = await context.supabase
      .from("products")
      .insert({
        organization_id: context.organization.id,
        category_id: categoryId,
        name: input.name,
        description: input.description || null,
        image_url: imageUrl
      })
      .select("id")
      .single();

    if (productError) throw productError;

    const { data: variant, error: variantError } = await context.supabase
      .from("product_variants")
      .insert({
        organization_id: context.organization.id,
        product_id: product.id,
        name: input.variantName || "Default",
        sku: input.sku || null,
        barcode: input.barcode || null,
        sale_price_cents: input.salePriceCents,
        cost_price_cents: input.costPriceCents,
        reorder_level: input.reorderLevel,
        track_stock: input.trackStock
      })
      .select("id")
      .single();

    if (variantError) throw variantError;

    if (input.trackStock && input.openingStock > 0) {
      const { error: stockError } = await context.supabase.rpc("adjust_inventory", {
        p_store_id: context.store.id,
        p_product_variant_id: variant.id,
        p_quantity_delta: input.openingStock,
        p_note: "Opening stock from product creation",
        p_movement_type: "opening"
      });

      if (stockError) throw stockError;
    }

    await context.supabase.from("audit_logs").insert({
      organization_id: context.organization.id,
      actor_id: context.user.id,
      action: "create_product",
      entity_type: "product",
      entity_id: product.id,
      after_data: { variant_id: variant.id, name: input.name }
    });

    revalidatePath("/products");
    revalidatePath("/inventory");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Product was not saved." };
  }

  redirect("/products");
}

export async function updateProductAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const context = await requireOwnerContext();
    const productId = text(formData, "productId");
    const variantId = text(formData, "variantId");
    const input = readProductForm(formData);
    const categoryId = await ensureCategory(context, input.categoryName);
    let imageUrl: string | undefined;
    const upload = await uploadProductImage(formData, context.organization.id);

    if (!productId || !variantId) {
      return { error: "Product and variant are required." };
    }

    if (upload) {
      const { error: uploadError } = await context.supabase.storage
        .from("product-images")
        .upload(upload.path, upload.file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data } = context.supabase.storage
        .from("product-images")
        .getPublicUrl(upload.path);
      imageUrl = data.publicUrl;
    }

    const productUpdate: Record<string, unknown> = {
      category_id: categoryId,
      name: input.name,
      description: input.description || null
    };

    if (imageUrl) {
      productUpdate.image_url = imageUrl;
    }

    const { error: productError } = await context.supabase
      .from("products")
      .update(productUpdate)
      .eq("organization_id", context.organization.id)
      .eq("id", productId);

    if (productError) throw productError;

    const { error: variantError } = await context.supabase
      .from("product_variants")
      .update({
        name: input.variantName || "Default",
        sku: input.sku || null,
        barcode: input.barcode || null,
        sale_price_cents: input.salePriceCents,
        cost_price_cents: input.costPriceCents,
        reorder_level: input.reorderLevel,
        track_stock: input.trackStock
      })
      .eq("organization_id", context.organization.id)
      .eq("id", variantId);

    if (variantError) throw variantError;

    await context.supabase.from("audit_logs").insert({
      organization_id: context.organization.id,
      actor_id: context.user.id,
      action: "update_product",
      entity_type: "product",
      entity_id: productId,
      after_data: { variant_id: variantId, name: input.name }
    });

    revalidatePath("/products");
    revalidatePath(`/products/${productId}/edit`);
    revalidatePath("/inventory");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Product was not updated." };
  }

  redirect("/products");
}

export async function deactivateProductAction(formData: FormData) {
  const context = await requireOwnerContext();
  const productId = text(formData, "productId");
  const variantId = text(formData, "variantId");

  await context.supabase
    .from("product_variants")
    .update({ is_active: false })
    .eq("organization_id", context.organization.id)
    .eq("id", variantId);

  await context.supabase
    .from("products")
    .update({ is_active: false })
    .eq("organization_id", context.organization.id)
    .eq("id", productId);

  await context.supabase.from("audit_logs").insert({
    organization_id: context.organization.id,
    actor_id: context.user.id,
    action: "deactivate_product",
    entity_type: "product",
    entity_id: productId,
    after_data: { variant_id: variantId }
  });

  revalidatePath("/products");
  revalidatePath("/inventory");
}
