import { Edit, Plus, Power } from "lucide-react";
import Link from "next/link";
import { deactivateProductAction } from "@/app/actions/products";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { requireAppContext } from "@/lib/app-context";
import { formatMoney, formatQuantity } from "@/lib/format";
import { getAllProductRows } from "@/lib/data";

export default async function ProductsPage() {
  const context = await requireAppContext();
  const products = await getAllProductRows(context);

  return (
    <>
      <PageHeader
        action={
          context.isOwner ? (
            <Link className="btn btn-primary" href="/products/new">
              <Plus aria-hidden="true" className="h-4 w-4" />
              New product
            </Link>
          ) : null
        }
        description="Catalog, prices, SKU/barcode lookup, and stock thresholds."
        title="Products"
      />

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse">
          <thead className="table-head">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU / Barcode</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              {context.isOwner ? <th className="px-4 py-3">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td className="table-cell">
                  <p className="font-semibold text-ink">{product.display_name}</p>
                  <p className="text-xs text-slate-500">{product.category_name ?? "Uncategorized"}</p>
                </td>
                <td className="table-cell">
                  <p>{product.sku ?? "No SKU"}</p>
                  <p className="text-xs text-slate-500">{product.barcode ?? "No barcode"}</p>
                </td>
                <td className="table-cell">
                  {formatMoney(product.sale_price_cents, context.organization.currency)}
                </td>
                <td className="table-cell">
                  {product.track_stock
                    ? formatQuantity(product.quantity_on_hand)
                    : "Not tracked"}
                </td>
                <td className="table-cell">
                  <StatusPill tone={product.is_active ? "green" : "slate"}>
                    {product.is_active ? "Active" : "Inactive"}
                  </StatusPill>
                </td>
                {context.isOwner ? (
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <Link
                        className="btn btn-secondary min-h-9 px-3"
                        href={`/products/${product.product_id}/edit`}
                        title="Edit product"
                      >
                        <Edit aria-hidden="true" className="h-4 w-4" />
                      </Link>
                      {product.is_active ? (
                        <form action={deactivateProductAction}>
                          <input name="productId" type="hidden" value={product.product_id} />
                          <input name="variantId" type="hidden" value={product.id} />
                          <button
                            className="btn btn-secondary min-h-9 px-3"
                            title="Deactivate product"
                            type="submit"
                          >
                            <Power aria-hidden="true" className="h-4 w-4" />
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
