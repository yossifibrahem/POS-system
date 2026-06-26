import { ProductForm } from "@/components/product-form";
import { PageHeader } from "@/components/page-header";
import { requireOwnerContext } from "@/lib/app-context";

export default async function NewProductPage() {
  await requireOwnerContext();

  return (
    <>
      <PageHeader
        description="Create a product, its first variant, pricing, barcode/SKU, and opening stock."
        title="New product"
      />
      <ProductForm mode="create" />
    </>
  );
}
