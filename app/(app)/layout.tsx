import { AppShell } from "@/components/app-shell";
import { requireAppContext } from "@/lib/app-context";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const context = await requireAppContext();

  return (
    <AppShell
      businessName={context.organization.name}
      role={context.membership.role}
      storeName={context.store.name}
      userName={context.profile.full_name ?? context.user.email ?? "User"}
    >
      {children}
    </AppShell>
  );
}
