import { ProductForm } from "@/components/product-form";
import { PageHeader } from "@/components/page-header";
import { requireOwnerContext } from "@/lib/app-context";
import { getProductForEdit } from "@/lib/data";

export default async function EditProductPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requireOwnerContext();
  const product = await getProductForEdit(context, id);

  return (
    <>
      <PageHeader
        description="Update catalog details, prices, tracking, and reorder threshold."
        title="Edit product"
      />
      <ProductForm mode="edit" product={product} />
    </>
  );
}
