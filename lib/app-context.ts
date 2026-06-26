import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type AppContext = {
  supabase: SupabaseServerClient;
  user: {
    id: string;
    email?: string;
  };
  profile: {
    id: string;
    full_name: string | null;
    phone: string | null;
  };
  membership: {
    id: string;
    organization_id: string;
    store_id: string | null;
    role: AppRole;
  };
  organization: {
    id: string;
    name: string;
    currency: string;
    timezone: string;
    tax_rate_basis_points: number;
  };
  store: {
    id: string;
    organization_id: string;
    name: string;
    address: string | null;
  };
  isOwner: boolean;
};

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function requireAppContext(): Promise<AppContext> {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  const { data: membership } = await supabase
    .from("memberships")
    .select("id, organization_id, store_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, currency, timezone, tax_rate_basis_points")
    .eq("id", membership.organization_id)
    .single();

  if (orgError || !organization) {
    throw new Error("Organization could not be loaded.");
  }

  const storeQuery = supabase
    .from("stores")
    .select("id, organization_id, name, address")
    .eq("organization_id", membership.organization_id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1);

  const { data: stores, error: storeError } = membership.store_id
    ? await storeQuery.eq("id", membership.store_id)
    : await storeQuery;

  const store = stores?.[0];

  if (storeError || !store) {
    throw new Error("Store could not be loaded.");
  }

  return {
    supabase,
    user: {
      id: user.id,
      email: user.email ?? undefined
    },
    profile: profile ?? {
      id: user.id,
      full_name: user.email ?? "User",
      phone: null
    },
    membership: membership as AppContext["membership"],
    organization,
    store,
    isOwner: membership.role === "owner_admin"
  };
}

export async function requireOwnerContext() {
  const context = await requireAppContext();

  if (!context.isOwner) {
    redirect("/dashboard");
  }

  return context;
}
