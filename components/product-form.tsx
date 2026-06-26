"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { createProductAction, updateProductAction } from "@/app/actions/products";
import { ActionMessage } from "@/components/action-message";
import type { ProductForEdit } from "@/lib/types";

type ProductFormProps = {
  mode: "create" | "edit";
  product?: ProductForEdit;
};

function centsToInput(cents?: number | null) {
  return cents == null ? "" : (Number(cents) / 100).toFixed(2);
}

export function ProductForm({ mode, product }: ProductFormProps) {
  const variant = product?.product_variants?.[0];
  const action = mode === "create" ? createProductAction : updateProductAction;
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="panel grid gap-5 p-5 lg:grid-cols-[1fr_1fr]">
      <ActionMessage state={state} />
      <input name="productId" type="hidden" value={product?.id ?? ""} />
      <input name="variantId" type="hidden" value={variant?.id ?? ""} />

      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="name">
            Product name
          </label>
          <input
            className="field mt-1"
            defaultValue={product?.name ?? ""}
            id="name"
            name="name"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="description">
            Description
          </label>
          <textarea
            className="field mt-1 min-h-24"
            defaultValue={product?.description ?? ""}
            id="description"
            name="description"
          />
        </div>
        <div>
          <label className="label" htmlFor="categoryName">
            Category
          </label>
          <input
            className="field mt-1"
            defaultValue={product?.categories?.name ?? ""}
            id="categoryName"
            name="categoryName"
            placeholder="General"
          />
        </div>
        <div>
          <label className="label" htmlFor="image">
            Product image
          </label>
          <input
            accept="image/*"
            className="field mt-1"
            id="image"
            name="image"
            type="file"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="variantName">
            Variant name
          </label>
          <input
            className="field mt-1"
            defaultValue={variant?.name ?? "Default"}
            id="variantName"
            name="variantName"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="sku">
              SKU
            </label>
            <input className="field mt-1" defaultValue={variant?.sku ?? ""} id="sku" name="sku" />
          </div>
          <div>
            <label className="label" htmlFor="barcode">
              Barcode
            </label>
            <input
              className="field mt-1"
              defaultValue={variant?.barcode ?? ""}
              id="barcode"
              name="barcode"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="salePrice">
              Sale price
            </label>
            <input
              className="field mt-1"
              defaultValue={centsToInput(variant?.sale_price_cents)}
              id="salePrice"
              min="0"
              name="salePrice"
              step="0.01"
              type="number"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="costPrice">
              Cost price
            </label>
            <input
              className="field mt-1"
              defaultValue={centsToInput(variant?.cost_price_cents)}
              id="costPrice"
              min="0"
              name="costPrice"
              step="0.01"
              type="number"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="reorderLevel">
              Reorder level
            </label>
            <input
              className="field mt-1"
              defaultValue={variant?.reorder_level ?? 0}
              id="reorderLevel"
              min="0"
              name="reorderLevel"
              step="0.001"
              type="number"
            />
          </div>
          <div>
            <label className="label" htmlFor="openingStock">
              Opening stock
            </label>
            <input
              className="field mt-1"
              defaultValue="0"
              disabled={mode === "edit"}
              id="openingStock"
              min="0"
              name="openingStock"
              step="0.001"
              type="number"
            />
          </div>
        </div>
        <label className="flex min-h-10 items-center gap-3 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink">
          <input
            defaultChecked={variant?.track_stock ?? true}
            name="trackStock"
            type="checkbox"
          />
          Track stock for this variant
        </label>
        <button className="btn btn-primary w-full" disabled={pending} type="submit">
          <Save aria-hidden="true" className="h-4 w-4" />
          {mode === "create" ? "Create product" : "Save product"}
        </button>
      </div>
    </form>
  );
}
