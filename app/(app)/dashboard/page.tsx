import Link from "next/link";
import { ArrowRight, Banknote, Boxes, ReceiptText, TrendingUp } from "lucide-react";
import { Metric } from "@/components/ui/metric";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { requireAppContext } from "@/lib/app-context";
import { formatMoney, formatQuantity } from "@/lib/format";
import { getDashboardData } from "@/lib/data";

export default async function DashboardPage() {
  const context = await requireAppContext();
  const { summary, lowStock, topProducts, openRegister } =
    await getDashboardData(context);
  const currency = context.organization.currency;

  return (
    <>
      <PageHeader
        action={
          <Link className="btn btn-primary" href="/pos">
            <Banknote aria-hidden="true" className="h-4 w-4" />
            Open POS
          </Link>
        }
        description="Daily sales, stock pressure, register status, and product movement."
        title="Dashboard"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          detail="Completed sales today"
          label="Gross sales"
          value={formatMoney(summary?.gross_sales_cents ?? 0, currency)}
        />
        <Metric
          detail="Transactions today"
          label="Orders"
          value={String(summary?.transaction_count ?? 0)}
        />
        <Metric
          detail="Average order value"
          label="Average order"
          value={formatMoney(summary?.average_order_cents ?? 0, currency)}
        />
        <Metric
          detail="Cash expected from sales"
          label="Cash collected"
          value={formatMoney(summary?.cash_collected_cents ?? 0, currency)}
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <TrendingUp aria-hidden="true" className="h-5 w-5 text-forest" />
              <h2 className="font-semibold text-ink">Top products today</h2>
            </div>
            <Link className="text-sm font-semibold text-ocean" href="/reports/daily">
              Report
            </Link>
          </div>
          <div className="divide-y divide-line">
            {topProducts.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">No completed sales yet today.</p>
            ) : (
              topProducts.map((product) => (
                <div className="flex items-center justify-between gap-4 p-4" key={product.product_variant_id}>
                  <div>
                    <p className="font-semibold text-ink">{product.product_name_snapshot}</p>
                    <p className="text-sm text-slate-500">
                      {formatQuantity(product.quantity_sold)} sold
                    </p>
                  </div>
                  <p className="font-semibold text-ink">
                    {formatMoney(product.sales_cents, currency)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="panel p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ReceiptText aria-hidden="true" className="h-5 w-5 text-ocean" />
                <h2 className="font-semibold text-ink">Register</h2>
              </div>
              <StatusPill tone={openRegister ? "green" : "amber"}>
                {openRegister ? "Open" : "Closed"}
              </StatusPill>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              {openRegister
                ? `Expected drawer: ${formatMoney(openRegister.expected_cash_cents, currency)}`
                : "Open a register before processing sales."}
            </p>
            <Link className="btn btn-secondary mt-4 w-full" href="/pos">
              Manage register
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>

          <div className="panel overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <Boxes aria-hidden="true" className="h-5 w-5 text-sun" />
              <h2 className="font-semibold text-ink">Low stock</h2>
            </div>
            <div className="divide-y divide-line">
              {lowStock.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">No low-stock products.</p>
              ) : (
                lowStock.map((item) => (
                  <div className="p-4" key={item.product_variant_id}>
                    <p className="font-semibold text-ink">{item.product_name}</p>
                    <p className="text-sm text-slate-500">
                      {formatQuantity(item.quantity_on_hand)} left, reorder at{" "}
                      {formatQuantity(item.reorder_level)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
