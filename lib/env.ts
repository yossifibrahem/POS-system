function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
}

function getSupabasePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY
  );
}

export function hasSupabaseEnv() {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}

export function getSupabaseEnv() {
  const url = getSupabaseUrl();
  const anonKey = getSupabasePublishableKey();

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase URL or publishable key. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or use the legacy NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return { url, anonKey };
}

export function getSupabaseServiceRoleKey() {
  const serviceRoleKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "Missing Supabase secret key. Set SUPABASE_SECRET_KEY, or use the legacy SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return serviceRoleKey;
}
