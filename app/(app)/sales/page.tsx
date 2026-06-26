import { Eye } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { requireAppContext } from "@/lib/app-context";
import { getSales } from "@/lib/data";
import { formatMoney } from "@/lib/format";

export default async function SalesPage() {
  const context = await requireAppContext();
  const sales = await getSales(context);

  return (
    <>
      <PageHeader
        description="Completed and voided cash sales for the active store."
        title="Sales"
      />

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead className="table-head">
            <tr>
              <th className="px-4 py-3">Sale</th>
              <th className="px-4 py-3">Cashier</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td className="table-cell">
                  <p className="font-semibold text-ink">{sale.sale_number}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(sale.completed_at).toLocaleString()}
                  </p>
                </td>
                <td className="table-cell">{sale.profiles?.full_name ?? "Cashier"}</td>
                <td className="table-cell">
                  {formatMoney(sale.total_cents, context.organization.currency)}
                </td>
                <td className="table-cell">
                  <StatusPill tone={sale.status === "completed" ? "green" : "red"}>
                    {sale.status}
                  </StatusPill>
                </td>
                <td className="table-cell">
                  <Link className="btn btn-secondary min-h-9 px-3" href={`/sales/${sale.id}`}>
                    <Eye aria-hidden="true" className="h-4 w-4" />
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
