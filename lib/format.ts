export function formatMoney(cents = 0, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2
  }).format(cents / 100);
}

export function formatQuantity(quantity: number | string | null | undefined) {
  const value = Number(quantity ?? 0);
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

export function parseMoneyToCents(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return 0;

  const amount = Number(raw);
  if (!Number.isFinite(amount)) {
    throw new Error("Money amount must be a valid number.");
  }

  return Math.round(amount * 100);
}

export function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error("Value must be a valid number.");
  }

  return parsed;
}

export function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}
