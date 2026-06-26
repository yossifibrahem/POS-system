export type AppRole = "owner_admin" | "cashier";

export type ActionState = {
  ok?: boolean;
  message?: string;
  error?: string;
};

export type ReceiptLine = {
  name: string;
  quantity: number;
  line_total_cents: number;
};

export type SaleReceipt = {
  sale_id: string;
  sale_number: string;
  subtotal_cents: number;
  discount_cents: number;
  tax_cents: number;
  total_cents: number;
  cash_received_cents: number;
  change_due_cents: number;
  items: ReceiptLine[];
};

export type CatalogItem = {
  id: string;
  product_id: string;
  product_name: string;
  variant_name: string;
  display_name: string;
  sku: string | null;
  barcode: string | null;
  sale_price_cents: number;
  cost_price_cents: number;
  track_stock: boolean;
  reorder_level: number;
  quantity_on_hand: number;
  is_active: boolean;
  image_url: string | null;
  category_name: string | null;
};

export type ProductVariantForEdit = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  sale_price_cents: number;
  cost_price_cents: number;
  track_stock: boolean;
  reorder_level: number | string;
};

export type ProductForEdit = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  categories?: { name: string } | null;
  product_variants: ProductVariantForEdit[];
};

export type DailySummaryRow = {
  sale_date: string;
  gross_sales_cents: number;
  transaction_count: number;
  average_order_cents: number;
  items_sold: number | string;
  cash_collected_cents: number;
  voided_sales_count: number;
};

export type TopProductRow = {
  product_variant_id: string;
  product_name_snapshot: string;
  quantity_sold: number | string;
  sales_cents: number;
};

export type LowStockRow = {
  product_variant_id: string;
  product_name: string;
  quantity_on_hand: number | string;
  reorder_level: number | string;
};

export type MovementRow = {
  id: string;
  movement_type: string;
  quantity_delta: number | string;
  note: string | null;
  created_at: string;
  product_variants?: {
    id: string;
    name: string;
    sku: string | null;
    products?: { name: string } | null;
  } | null;
  profiles?: { full_name: string | null } | null;
};

export type SaleListRow = {
  id: string;
  sale_number: string;
  status: "completed" | "voided";
  total_cents: number;
  completed_at: string;
  cashier_id: string;
  profiles?: { full_name: string | null } | null;
};

export type SaleDetailRow = SaleListRow & {
  subtotal_cents: number;
  discount_cents: number;
  tax_cents: number;
  cash_received_cents: number;
  change_due_cents: number;
  sale_items: Array<{
    id: string;
    product_name_snapshot: string;
    sku_snapshot: string | null;
    quantity: number | string;
    unit_price_cents: number;
    line_total_cents: number;
  }>;
  payments: Array<{
    id: string;
    method: string;
    amount_cents: number;
    status: string;
  }>;
};

export type RegisterReportRow = {
  id: string;
  opened_at: string;
  status: "open" | "closed";
  expected_cash_cents: number;
  actual_cash_cents: number | null;
  profiles?: { full_name: string | null } | null;
};

export type UserMembershipRow = {
  id: string;
  role: AppRole;
  store_id: string | null;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
    phone: string | null;
    is_active: boolean;
  } | null;
};
