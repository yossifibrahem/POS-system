import { SettingsForm } from "@/components/settings-form";
import { PageHeader } from "@/components/page-header";
import { requireOwnerContext } from "@/lib/app-context";

export default async function SettingsPage() {
  const context = await requireOwnerContext();

  return (
    <>
      <PageHeader
        description="Business identity, currency, timezone, default tax, and store details."
        title="Settings"
      />
      <SettingsForm organization={context.organization} store={context.store} />
    </>
  );
}
