import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getAuthenticatedUser } from "@/lib/app-context";
import { hasSupabaseEnv } from "@/lib/env";

export default async function LoginPage() {
  if (hasSupabaseEnv()) {
    const { user } = await getAuthenticatedUser();
    if (user) redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-semibold text-ink">MHG POS</h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to run sales, stock, registers, and daily reporting.
          </p>
        </div>
        {!hasSupabaseEnv() ? (
          <div className="panel mb-4 border-sun/30 bg-sun/10 p-4 text-sm text-sun">
            Add Supabase environment variables from `.env.example` before signing in.
          </div>
        ) : null}
        <LoginForm />
      </div>
    </main>
  );
}
