import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { requireAppContext } from "@/lib/app-context";
import { getDailyReport } from "@/lib/data";
import { formatMoney, formatQuantity } from "@/lib/format";

export default async function DailyReportPage() {
  const context = await requireAppContext();
  const { summaries, registers } = await getDailyReport(context);
  const currency = context.organization.currency;

  return (
    <>
      <PageHeader
        description="Thirty-day daily sales summary and recent register closeouts."
        title="Daily report"
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <section className="panel overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Gross</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Average</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Cash</th>
                <th className="px-4 py-3">Voids</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((day) => (
                <tr key={day.sale_date}>
                  <td className="table-cell font-semibold text-ink">{day.sale_date}</td>
                  <td className="table-cell">{formatMoney(day.gross_sales_cents, currency)}</td>
                  <td className="table-cell">{day.transaction_count}</td>
                  <td className="table-cell">{formatMoney(day.average_order_cents, currency)}</td>
                  <td className="table-cell">{formatQuantity(day.items_sold)}</td>
                  <td className="table-cell">{formatMoney(day.cash_collected_cents, currency)}</td>
                  <td className="table-cell">{day.voided_sales_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <aside className="panel overflow-hidden">
          <div className="border-b border-line px-4 py-3">
            <h2 className="font-semibold text-ink">Register sessions</h2>
          </div>
          <div className="max-h-[620px] divide-y divide-line overflow-auto">
            {registers.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No register sessions yet.</p>
            ) : (
              registers.map((session) => {
                const difference =
                  session.actual_cash_cents == null
                    ? null
                    : session.actual_cash_cents - session.expected_cash_cents;
                return (
                  <div className="space-y-2 p-4" key={session.id}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-ink">
                        {new Date(session.opened_at).toLocaleString()}
                      </p>
                      <StatusPill tone={session.status === "open" ? "green" : "slate"}>
                        {session.status}
                      </StatusPill>
                    </div>
                    <p className="text-sm text-slate-500">
                      Opened by {session.profiles?.full_name ?? "Cashier"}
                    </p>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-slate-500">Expected</dt>
                        <dd className="font-semibold">
                          {formatMoney(session.expected_cash_cents, currency)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Difference</dt>
                        <dd className="font-semibold">
                          {difference == null ? "-" : formatMoney(difference, currency)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
