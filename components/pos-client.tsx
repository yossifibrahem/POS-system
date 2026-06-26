"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Banknote,
  Minus,
  Plus,
  ReceiptText,
  Search,
  Trash2
} from "lucide-react";
import { completeCashSaleAction } from "@/app/actions/sales";
import { formatMoney, formatQuantity } from "@/lib/format";
import type { CatalogItem, SaleReceipt } from "@/lib/types";

type CartLine = CatalogItem & {
  quantity: number;
};

function toCents(value: string) {
  const number = Number(value || "0");
  return Number.isFinite(number) ? Math.round(number * 100) : 0;
}

export function PosClient({
  products,
  registerSessionId,
  currency
}: {
  products: CatalogItem[];
  registerSessionId: string;
  currency: string;
}) {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cashReceived, setCashReceived] = useState("");
  const [discount, setDiscount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products.slice(0, 24);

    return products
      .filter((product) => {
        return [
          product.display_name,
          product.sku,
          product.barcode,
          product.category_name
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalized));
      })
      .slice(0, 24);
  }, [products, query]);

  const subtotalCents = cart.reduce(
    (sum, line) => sum + Math.round(line.sale_price_cents * line.quantity),
    0
  );
  const discountCents = Math.min(toCents(discount), subtotalCents);
  const totalCents = subtotalCents - discountCents;
  const cashReceivedCents = toCents(cashReceived);
  const changeDueCents = Math.max(0, cashReceivedCents - totalCents);

  function addProduct(product: CatalogItem) {
    setReceipt(null);
    setError(null);
    setCart((current) => {
      const existing = current.find((line) => line.id === product.id);
      const nextQuantity = (existing?.quantity ?? 0) + 1;

      if (product.track_stock && nextQuantity > product.quantity_on_hand) {
        setError(`${product.display_name} has only ${formatQuantity(product.quantity_on_hand)} in stock.`);
        return current;
      }

      if (existing) {
        return current.map((line) =>
          line.id === product.id ? { ...line, quantity: nextQuantity } : line
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });
  }

  function updateQuantity(variantId: string, quantity: number) {
    setError(null);
    setCart((current) =>
      current.flatMap((line) => {
        if (line.id !== variantId) return [line];
        if (quantity <= 0) return [];
        if (line.track_stock && quantity > line.quantity_on_hand) {
          setError(`${line.display_name} has only ${formatQuantity(line.quantity_on_hand)} in stock.`);
          return [line];
        }
        return [{ ...line, quantity }];
      })
    );
  }

  function checkout() {
    setError(null);
    setReceipt(null);

    if (cart.length === 0) {
      setError("Add at least one product to the cart.");
      return;
    }

    if (cashReceivedCents < totalCents) {
      setError("Cash received is less than the sale total.");
      return;
    }

    startTransition(async () => {
      const result = await completeCashSaleAction({
        registerSessionId,
        cartItems: cart.map((line) => ({
          variant_id: line.id,
          quantity: line.quantity
        })),
        cashReceivedCents,
        discountCents
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setReceipt(result.receipt);
      setCart([]);
      setCashReceived("");
      setDiscount("");
    });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_440px]">
      <section className="space-y-4">
        <div className="panel p-4">
          <label className="label" htmlFor="product-search">
            Search products
          </label>
          <div className="relative mt-1">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              autoComplete="off"
              className="field pl-9"
              id="product-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, SKU, or barcode"
              value={query}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <button
              className="panel min-h-32 p-4 text-left transition hover:border-forest hover:bg-forest/5 disabled:opacity-50"
              disabled={product.track_stock && product.quantity_on_hand <= 0}
              key={product.id}
              onClick={() => addProduct(product)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{product.display_name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {product.sku || product.barcode || product.category_name || "No SKU"}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-forest">
                  {formatMoney(product.sale_price_cents, currency)}
                </p>
              </div>
              <p className="mt-5 text-xs font-semibold text-slate-500">
                Stock:{" "}
                <span className="text-ink">
                  {product.track_stock ? formatQuantity(product.quantity_on_hand) : "Not tracked"}
                </span>
              </p>
            </button>
          ))}
        </div>
      </section>

      <aside className="panel h-fit p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Current sale</h2>
          <ReceiptText aria-hidden="true" className="h-5 w-5 text-ocean" />
        </div>

        {error ? (
          <p className="mb-4 rounded-md border border-berry/20 bg-berry/10 px-3 py-2 text-sm font-medium text-berry">
            {error}
          </p>
        ) : null}

        {receipt ? (
          <div className="mb-4 rounded-md border border-forest/20 bg-forest/10 p-3 text-sm text-forest">
            <p className="font-semibold">Sale {receipt.sale_number} completed.</p>
            <p>Change due: {formatMoney(receipt.change_due_cents, currency)}</p>
          </div>
        ) : null}

        <div className="max-h-[45vh] space-y-3 overflow-auto pr-1">
          {cart.length === 0 ? (
            <p className="rounded-md border border-dashed border-line p-6 text-center text-sm text-slate-500">
              Cart is empty.
            </p>
          ) : (
            cart.map((line) => (
              <div className="rounded-md border border-line p-3" key={line.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{line.display_name}</p>
                    <p className="text-xs text-slate-500">
                      {formatMoney(line.sale_price_cents, currency)} each
                    </p>
                  </div>
                  <button
                    className="btn btn-secondary min-h-8 px-2"
                    onClick={() => updateQuantity(line.id, 0)}
                    title="Remove item"
                    type="button"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      className="btn btn-secondary min-h-8 px-2"
                      onClick={() => updateQuantity(line.id, line.quantity - 1)}
                      title="Decrease quantity"
                      type="button"
                    >
                      <Minus aria-hidden="true" className="h-4 w-4" />
                    </button>
                    <input
                      className="field h-9 w-20 text-center"
                      min="0.001"
                      onChange={(event) =>
                        updateQuantity(line.id, Number(event.target.value))
                      }
                      step="0.001"
                      type="number"
                      value={line.quantity}
                    />
                    <button
                      className="btn btn-secondary min-h-8 px-2"
                      onClick={() => updateQuantity(line.id, line.quantity + 1)}
                      title="Increase quantity"
                      type="button"
                    >
                      <Plus aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="font-semibold text-ink">
                    {formatMoney(Math.round(line.sale_price_cents * line.quantity), currency)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 space-y-3 border-t border-line pt-4">
          <div>
            <label className="label" htmlFor="discount">
              Discount
            </label>
            <input
              className="field mt-1"
              id="discount"
              min="0"
              onChange={(event) => setDiscount(event.target.value)}
              placeholder="0.00"
              step="0.01"
              type="number"
              value={discount}
            />
          </div>
          <div>
            <label className="label" htmlFor="cashReceived">
              Cash received
            </label>
            <input
              className="field mt-1"
              id="cashReceived"
              min="0"
              onChange={(event) => setCashReceived(event.target.value)}
              placeholder="0.00"
              step="0.01"
              type="number"
              value={cashReceived}
            />
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="font-semibold">{formatMoney(subtotalCents, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Discount</dt>
              <dd className="font-semibold">{formatMoney(discountCents, currency)}</dd>
            </div>
            <div className="flex justify-between text-base">
              <dt className="font-semibold text-ink">Total</dt>
              <dd className="font-semibold text-ink">{formatMoney(totalCents, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Change</dt>
              <dd className="font-semibold">{formatMoney(changeDueCents, currency)}</dd>
            </div>
          </dl>

          <button
            className="btn btn-primary w-full"
            disabled={isPending || cart.length === 0}
            onClick={checkout}
            type="button"
          >
            <Banknote aria-hidden="true" className="h-4 w-4" />
            Complete cash sale
          </button>
        </div>
      </aside>
    </div>
  );
}
