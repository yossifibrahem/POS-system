"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

export async function signInAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signUpOwnerAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || !password) {
    return { error: "Name, email, and password are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return {
      ok: true,
      message:
        "Account created. Confirm your email if Supabase email confirmation is enabled, then sign in."
    };
  }

  redirect("/onboarding");
}

export async function bootstrapOwnerAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const organizationName = String(formData.get("organizationName") ?? "").trim();
  const storeName = String(formData.get("storeName") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!organizationName || !storeName) {
    return { error: "Business name and store name are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("bootstrap_owner_account", {
    p_organization_name: organizationName,
    p_store_name: storeName,
    p_full_name: fullName || null
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
