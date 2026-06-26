import { UserForm } from "@/components/user-form";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { requireOwnerContext } from "@/lib/app-context";
import { getUsers } from "@/lib/data";

export default async function UsersPage() {
  const context = await requireOwnerContext();
  const users = await getUsers(context);

  return (
    <>
      <PageHeader
        description="Owner admins can create cashiers and additional admins for this store."
        title="Users"
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <section className="panel overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((membership) => (
                <tr key={membership.id}>
                  <td className="table-cell">
                    <p className="font-semibold text-ink">
                      {membership.profiles?.full_name ?? "User"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {membership.store_id ? "Store user" : "Organization user"}
                    </p>
                  </td>
                  <td className="table-cell">
                    {membership.role === "owner_admin" ? "Owner admin" : "Cashier"}
                  </td>
                  <td className="table-cell">
                    <StatusPill tone={membership.profiles?.is_active ? "green" : "slate"}>
                      {membership.profiles?.is_active ? "Active" : "Inactive"}
                    </StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <UserForm />
      </div>
    </>
  );
}
