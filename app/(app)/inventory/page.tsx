import { InventoryAdjustmentForm } from "@/components/inventory-adjustment-form";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { requireAppContext } from "@/lib/app-context";
import { getInventoryData } from "@/lib/data";
import { formatQuantity } from "@/lib/format";

export default async function InventoryPage() {
  const context = await requireAppContext();
  const { items, movements } = await getInventoryData(context);

  return (
    <>
      <PageHeader
        description="Current stock, low-stock thresholds, and manual movement history."
        title="Inventory"
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <section className="panel overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">On hand</th>
                <th className="px-4 py-3">Reorder</th>
                <th className="px-4 py-3">Stock state</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isLow =
                  item.track_stock && item.quantity_on_hand <= item.reorder_level;
                return (
                  <tr key={item.id}>
                    <td className="table-cell">
                      <p className="font-semibold text-ink">{item.display_name}</p>
                      <p className="text-xs text-slate-500">{item.sku ?? item.barcode ?? "No SKU"}</p>
                    </td>
                    <td className="table-cell">
                      {item.track_stock ? formatQuantity(item.quantity_on_hand) : "Not tracked"}
                    </td>
                    <td className="table-cell">
                      {item.track_stock ? formatQuantity(item.reorder_level) : "-"}
                    </td>
                    <td className="table-cell">
                      <StatusPill tone={!item.track_stock ? "slate" : isLow ? "amber" : "green"}>
                        {!item.track_stock ? "Untracked" : isLow ? "Low" : "Healthy"}
                      </StatusPill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <aside className="space-y-5">
          {context.isOwner ? <InventoryAdjustmentForm items={items} /> : null}
          <div className="panel overflow-hidden">
            <div className="border-b border-line px-4 py-3">
              <h2 className="font-semibold text-ink">Recent movements</h2>
            </div>
            <div className="max-h-[520px] divide-y divide-line overflow-auto">
              {movements.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">No movements yet.</p>
              ) : (
                movements.map((movement) => {
                  const variant = movement.product_variants;
                  const productName = variant?.products?.name ?? "Product";
                  return (
                    <div className="p-4" key={movement.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-ink">{productName}</p>
                          <p className="text-xs text-slate-500">
                            {movement.movement_type} by{" "}
                            {movement.profiles?.full_name ?? "System"}
                          </p>
                        </div>
                        <p className="font-semibold text-ink">
                          {formatQuantity(movement.quantity_delta)}
                        </p>
                      </div>
                      {movement.note ? (
                        <p className="mt-2 text-sm text-slate-500">{movement.note}</p>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
