import Link from "next/link";
import { ArrowLeft, Ban } from "lucide-react";
import { voidSaleAction } from "@/app/actions/sales";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { requireAppContext } from "@/lib/app-context";
import { getSaleDetail } from "@/lib/data";
import { formatMoney, formatQuantity } from "@/lib/format";

export default async function SaleDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requireAppContext();
  const sale = await getSaleDetail(context, id);

  return (
    <>
      <PageHeader
        action={
          <Link className="btn btn-secondary" href="/sales">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Sales
          </Link>
        }
        description={`Cashier: ${sale.profiles?.full_name ?? "Cashier"}`}
        title={sale.sale_number}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="font-semibold text-ink">Receipt lines</h2>
            <StatusPill tone={sale.status === "completed" ? "green" : "red"}>
              {sale.status}
            </StatusPill>
          </div>
          <table className="w-full min-w-[620px] border-collapse">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Line total</th>
              </tr>
            </thead>
            <tbody>
              {sale.sale_items.map((item) => (
                <tr key={item.id}>
                  <td className="table-cell">
                    <p className="font-semibold text-ink">{item.product_name_snapshot}</p>
                    <p className="text-xs text-slate-500">{item.sku_snapshot ?? "No SKU"}</p>
                  </td>
                  <td className="table-cell">{formatQuantity(item.quantity)}</td>
                  <td className="table-cell">
                    {formatMoney(item.unit_price_cents, context.organization.currency)}
                  </td>
                  <td className="table-cell">
                    {formatMoney(item.line_total_cents, context.organization.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <aside className="space-y-5">
          <div className="panel space-y-3 p-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd className="font-semibold">
                  {formatMoney(sale.subtotal_cents, context.organization.currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Discount</dt>
                <dd className="font-semibold">
                  {formatMoney(sale.discount_cents, context.organization.currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Tax</dt>
                <dd className="font-semibold">
                  {formatMoney(sale.tax_cents, context.organization.currency)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-base">
                <dt className="font-semibold text-ink">Total</dt>
                <dd className="font-semibold text-ink">
                  {formatMoney(sale.total_cents, context.organization.currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Cash received</dt>
                <dd className="font-semibold">
                  {formatMoney(sale.cash_received_cents, context.organization.currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Change due</dt>
                <dd className="font-semibold">
                  {formatMoney(sale.change_due_cents, context.organization.currency)}
                </dd>
              </div>
            </dl>
          </div>

          {context.isOwner && sale.status === "completed" ? (
            <form action={voidSaleAction} className="panel space-y-3 p-4">
              <input name="saleId" type="hidden" value={sale.id} />
              <div>
                <label className="label" htmlFor="note">
                  Void reason
                </label>
                <input className="field mt-1" id="note" name="note" />
              </div>
              <button className="btn btn-danger w-full" type="submit">
                <Ban aria-hidden="true" className="h-4 w-4" />
                Void sale
              </button>
            </form>
          ) : null}
        </aside>
      </div>
    </>
  );
}
