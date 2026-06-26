import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding-form";
import { getAuthenticatedUser } from "@/lib/app-context";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-6">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-semibold text-ink">Set up your store</h1>
          <p className="mt-2 text-sm text-slate-500">
            Create the first business and store for this POS workspace.
          </p>
        </div>
        <OnboardingForm email={user.email ?? undefined} />
      </div>
    </main>
  );
}
