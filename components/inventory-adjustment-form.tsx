"use client";

import { useActionState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { adjustInventoryAction } from "@/app/actions/inventory";
import { ActionMessage } from "@/components/action-message";
import type { CatalogItem } from "@/lib/types";

export function InventoryAdjustmentForm({ items }: { items: CatalogItem[] }) {
  const [state, formAction, pending] = useActionState(adjustInventoryAction, {});

  return (
    <form action={formAction} className="panel space-y-4 p-5">
      <ActionMessage state={state} />
      <div>
        <label className="label" htmlFor="variantId">
          Product
        </label>
        <select className="field mt-1" id="variantId" name="variantId" required>
          <option value="">Choose product</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.display_name} {item.sku ? `(${item.sku})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="movementType">
            Type
          </label>
          <select className="field mt-1" id="movementType" name="movementType">
            <option value="adjustment">Adjustment</option>
            <option value="opening">Opening stock</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="quantityDelta">
            Quantity change
          </label>
          <input
            className="field mt-1"
            id="quantityDelta"
            name="quantityDelta"
            placeholder="Use - for reductions"
            step="0.001"
            type="number"
            required
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="note">
          Note
        </label>
        <input className="field mt-1" id="note" name="note" />
      </div>
      <button className="btn btn-primary" disabled={pending} type="submit">
        <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
        Save adjustment
      </button>
    </form>
  );
}
