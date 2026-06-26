import {
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Users
} from "lucide-react";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import type { AppRole } from "@/lib/types";

const baseNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "POS", icon: ShoppingCart },
  { href: "/products", label: "Products", icon: Package },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/sales", label: "Sales", icon: ClipboardList },
  { href: "/reports/daily", label: "Daily", icon: BarChart3 }
];

const ownerNav = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({
  children,
  businessName,
  storeName,
  userName,
  role
}: {
  children: React.ReactNode;
  businessName: string;
  storeName: string;
  userName: string;
  role: AppRole;
}) {
  const nav = role === "owner_admin" ? [...baseNav, ...ownerNav] : baseNav;

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white p-4 lg:block">
        <Link href="/dashboard" className="block rounded-md px-2 py-3">
          <p className="text-lg font-semibold text-ink">{businessName}</p>
          <p className="text-sm text-slate-500">{storeName}</p>
        </Link>

        <nav className="mt-6 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                href={item.href}
                key={item.href}
                className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-ink"
              >
                <Icon aria-hidden="true" className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 border-t border-line pt-4">
          <p className="truncate text-sm font-semibold text-ink">{userName}</p>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {role === "owner_admin" ? "Owner admin" : "Cashier"}
          </p>
          <form action={signOutAction} className="mt-3">
            <button className="btn btn-secondary w-full" type="submit">
              <LogOut aria-hidden="true" className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <Link href="/dashboard">
              <p className="font-semibold text-ink">{businessName}</p>
              <p className="text-xs text-slate-500">{storeName}</p>
            </Link>
            <form action={signOutAction}>
              <button className="btn btn-secondary min-h-9 px-3" title="Sign out" type="submit">
                <LogOut aria-hidden="true" className="h-4 w-4" />
              </button>
            </form>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  href={item.href}
                  key={item.href}
                  className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md border border-line bg-white px-3 text-xs font-semibold text-slate-600"
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
