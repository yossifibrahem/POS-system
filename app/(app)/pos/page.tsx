import { CloseRegisterForm, OpenRegisterForm } from "@/components/register-forms";
import { PageHeader } from "@/components/page-header";
import { PosClient } from "@/components/pos-client";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAppContext } from "@/lib/app-context";
import { getCatalogItems, getOpenRegister } from "@/lib/data";
import { formatMoney } from "@/lib/format";

export default async function PosPage() {
  const context = await requireAppContext();
  const [products, openRegister] = await Promise.all([
    getCatalogItems(context),
    getOpenRegister(context)
  ]);

  if (!openRegister) {
    return (
      <>
        <PageHeader
          description="Open a cash register session before taking sales."
          title="Point of sale"
        />
        <OpenRegisterForm />
      </>
    );
  }

  return (
    <>
      <PageHeader
        description={`Register opened with ${formatMoney(openRegister.opening_cash_cents, context.organization.currency)}.`}
        title="Point of sale"
      />

      {products.length === 0 ? (
        <EmptyState
          description="Create products and opening stock before processing sales."
          title="No sellable products"
        />
      ) : (
        <div className="space-y-5">
          <div className="panel grid gap-4 p-4 lg:grid-cols-[1fr_320px]">
            <div>
              <p className="label">Active register</p>
              <p className="mt-1 text-sm text-slate-500">
                Expected drawer is{" "}
                <span className="font-semibold text-ink">
                  {formatMoney(openRegister.expected_cash_cents, context.organization.currency)}
                </span>
                .
              </p>
            </div>
            <CloseRegisterForm
              currency={context.organization.currency}
              expectedCashCents={openRegister.expected_cash_cents}
              registerSessionId={openRegister.id}
            />
          </div>
          <PosClient
            currency={context.organization.currency}
            products={products}
            registerSessionId={openRegister.id}
          />
        </div>
      )}
    </>
  );
}
