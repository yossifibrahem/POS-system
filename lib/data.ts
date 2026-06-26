import type { AppContext } from "@/lib/app-context";
import type {
  CatalogItem,
  DailySummaryRow,
  LowStockRow,
  MovementRow,
  ProductForEdit,
  RegisterReportRow,
  SaleDetailRow,
  SaleListRow,
  TopProductRow,
  UserMembershipRow
} from "@/lib/types";
import { todayDateString } from "@/lib/format";

type VariantQueryRow = {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  sale_price_cents: number;
  cost_price_cents: number;
  track_stock: boolean;
  reorder_level: number | string;
  is_active: boolean;
  products: {
    id: string;
    name: string;
    image_url: string | null;
    is_active: boolean;
    categories?: { name: string } | null;
  };
};

type BalanceRow = {
  product_variant_id: string;
  quantity_on_hand: number | string | null;
};

function displayVariantName(productName: string, variantName: string | null) {
  return !variantName || variantName === "Default"
    ? productName
    : `${productName} / ${variantName}`;
}

export async function getCatalogItems(context: AppContext): Promise<CatalogItem[]> {
  const { data: variants, error } = await context.supabase
    .from("product_variants")
    .select(
      "id, product_id, name, sku, barcode, sale_price_cents, cost_price_cents, track_stock, reorder_level, is_active, products!inner(id, name, image_url, is_active, categories(name))"
    )
    .eq("organization_id", context.organization.id)
    .eq("is_active", true)
    .eq("products.is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;

  const { data: balances, error: balanceError } = await context.supabase
    .from("inventory_balances")
    .select("product_variant_id, quantity_on_hand")
    .eq("store_id", context.store.id);

  if (balanceError) throw balanceError;

  const balanceRows = (balances ?? []) as BalanceRow[];
  const variantRows = (variants ?? []) as unknown as VariantQueryRow[];
  const balanceByVariant = new Map(
    balanceRows.map((balance) => [
      balance.product_variant_id,
      Number(balance.quantity_on_hand ?? 0)
    ])
  );

  return variantRows.map((variant) => {
    const product = variant.products;
    const productName = product.name as string;

    return {
      id: variant.id,
      product_id: variant.product_id,
      product_name: productName,
      variant_name: variant.name,
      display_name: displayVariantName(productName, variant.name),
      sku: variant.sku,
      barcode: variant.barcode,
      sale_price_cents: variant.sale_price_cents,
      cost_price_cents: variant.cost_price_cents,
      track_stock: variant.track_stock,
      reorder_level: Number(variant.reorder_level ?? 0),
      quantity_on_hand: balanceByVariant.get(variant.id) ?? 0,
      is_active: variant.is_active,
      image_url: product.image_url,
      category_name: product.categories?.name ?? null
    };
  });
}

export async function getAllProductRows(context: AppContext) {
  const items = await getCatalogItems(context);

  if (!context.isOwner) return items;

  const { data: inactiveVariants } = await context.supabase
    .from("product_variants")
    .select(
      "id, product_id, name, sku, barcode, sale_price_cents, cost_price_cents, track_stock, reorder_level, is_active, products!inner(id, name, image_url, is_active, categories(name))"
    )
    .eq("organization_id", context.organization.id)
    .eq("is_active", false)
    .order("created_at", { ascending: false });

  return [
    ...items,
    ...(((inactiveVariants ?? []) as unknown as VariantQueryRow[]).map((variant) => {
      const product = variant.products;
      const productName = product.name as string;

      return {
        id: variant.id,
        product_id: variant.product_id,
        product_name: productName,
        variant_name: variant.name,
        display_name: displayVariantName(productName, variant.name),
        sku: variant.sku,
        barcode: variant.barcode,
        sale_price_cents: variant.sale_price_cents,
        cost_price_cents: variant.cost_price_cents,
        track_stock: variant.track_stock,
        reorder_level: Number(variant.reorder_level ?? 0),
        quantity_on_hand: 0,
        is_active: variant.is_active,
        image_url: product.image_url,
        category_name: product.categories?.name ?? null
      };
    }) as CatalogItem[])
  ];
}

export async function getCategories(context: AppContext) {
  const { data, error } = await context.supabase
    .from("categories")
    .select("id, name")
    .eq("organization_id", context.organization.id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getOpenRegister(context: AppContext) {
  const { data, error } = await context.supabase
    .from("register_sessions")
    .select("*")
    .eq("store_id", context.store.id)
    .eq("opened_by", context.user.id)
    .eq("status", "open")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getDashboardData(context: AppContext): Promise<{
  summary: DailySummaryRow | null;
  lowStock: LowStockRow[];
  topProducts: TopProductRow[];
  openRegister: Awaited<ReturnType<typeof getOpenRegister>>;
}> {
  const today = todayDateString();

  const [summaryResult, lowStockResult, topProductsResult, registerResult] =
    await Promise.all([
      context.supabase
        .from("daily_sales_summary")
        .select("*")
        .eq("store_id", context.store.id)
        .eq("sale_date", today)
        .maybeSingle(),
      context.supabase
        .from("low_stock_products")
        .select("*")
        .eq("store_id", context.store.id)
        .order("quantity_on_hand", { ascending: true })
        .limit(6),
      context.supabase
        .from("daily_top_products")
        .select("*")
        .eq("store_id", context.store.id)
        .eq("sale_date", today)
        .order("quantity_sold", { ascending: false })
        .limit(5),
      getOpenRegister(context)
    ]);

  if (summaryResult.error) throw summaryResult.error;
  if (lowStockResult.error) throw lowStockResult.error;
  if (topProductsResult.error) throw topProductsResult.error;

  return {
    summary: (summaryResult.data as DailySummaryRow | null) ?? null,
    lowStock: (lowStockResult.data ?? []) as LowStockRow[],
    topProducts: (topProductsResult.data ?? []) as TopProductRow[],
    openRegister: registerResult
  };
}

export async function getInventoryData(context: AppContext): Promise<{
  items: CatalogItem[];
  movements: MovementRow[];
}> {
  const [items, movementResult] = await Promise.all([
    getCatalogItems(context),
    context.supabase
      .from("stock_movements")
      .select(
        "id, movement_type, quantity_delta, note, created_at, product_variants(id, name, sku, products(name)), profiles:created_by(full_name)"
      )
      .eq("store_id", context.store.id)
      .order("created_at", { ascending: false })
      .limit(30)
  ]);

  if (movementResult.error) throw movementResult.error;

  return {
    items,
    movements: (movementResult.data ?? []) as unknown as MovementRow[]
  };
}

export async function getSales(
  context: AppContext,
  limit = 50
): Promise<SaleListRow[]> {
  const { data, error } = await context.supabase
    .from("sales")
    .select("id, sale_number, status, total_cents, completed_at, cashier_id, profiles:cashier_id(full_name)")
    .eq("store_id", context.store.id)
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as SaleListRow[];
}

export async function getSaleDetail(
  context: AppContext,
  saleId: string
): Promise<SaleDetailRow> {
  const { data, error } = await context.supabase
    .from("sales")
    .select(
      "*, sale_items(*), payments(*), profiles:cashier_id(full_name), register_sessions(opened_at, closed_at, status)"
    )
    .eq("store_id", context.store.id)
    .eq("id", saleId)
    .single();

  if (error) throw error;
  return data as unknown as SaleDetailRow;
}

export async function getDailyReport(context: AppContext): Promise<{
  summaries: DailySummaryRow[];
  registers: RegisterReportRow[];
}> {
  const { data: summaries, error } = await context.supabase
    .from("daily_sales_summary")
    .select("*")
    .eq("store_id", context.store.id)
    .order("sale_date", { ascending: false })
    .limit(30);

  if (error) throw error;

  const { data: registers, error: registerError } = await context.supabase
    .from("register_sessions")
    .select("*, profiles:opened_by(full_name), closed_profile:closed_by(full_name)")
    .eq("store_id", context.store.id)
    .order("opened_at", { ascending: false })
    .limit(30);

  if (registerError) throw registerError;

  return {
    summaries: (summaries ?? []) as unknown as DailySummaryRow[],
    registers: (registers ?? []) as unknown as RegisterReportRow[]
  };
}

export async function getUsers(
  context: AppContext
): Promise<UserMembershipRow[]> {
  const { data, error } = await context.supabase
    .from("memberships")
    .select("id, role, store_id, created_at, profiles:user_id(id, full_name, phone, is_active)")
    .eq("organization_id", context.organization.id)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as UserMembershipRow[];
}

export async function getProductForEdit(
  context: AppContext,
  productId: string
): Promise<ProductForEdit> {
  const { data, error } = await context.supabase
    .from("products")
    .select("*, categories(name), product_variants(*)")
    .eq("organization_id", context.organization.id)
    .eq("id", productId)
    .single();

  if (error) throw error;
  return data as unknown as ProductForEdit;
}
