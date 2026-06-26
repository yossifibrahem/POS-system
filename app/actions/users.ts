"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerContext } from "@/lib/app-context";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionState } from "@/lib/types";

export async function createStaffUserAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const context = await requireOwnerContext();
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const role = String(formData.get("role") ?? "cashier");

    if (!fullName || !email || !password) {
      return { error: "Name, email, and password are required." };
    }

    if (role !== "cashier" && role !== "owner_admin") {
      return { error: "Invalid role." };
    }

    const admin = createAdminClient();
    const { data: createdUser, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName
        }
      });

    if (createError || !createdUser.user) {
      throw createError ?? new Error("User was not created.");
    }

    const userId = createdUser.user.id;

    const { error: profileError } = await admin.from("profiles").upsert({
      id: userId,
      full_name: fullName,
      is_active: true
    });

    if (profileError) throw profileError;

    const { error: membershipError } = await admin.from("memberships").insert({
      organization_id: context.organization.id,
      store_id: role === "cashier" ? context.store.id : null,
      user_id: userId,
      role,
      created_by: context.user.id
    });

    if (membershipError) throw membershipError;

    await admin.from("audit_logs").insert({
      organization_id: context.organization.id,
      actor_id: context.user.id,
      action: "create_staff_user",
      entity_type: "profile",
      entity_id: userId,
      after_data: { role, email }
    });

    revalidatePath("/admin/users");
    return { ok: true, message: "Staff user created." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Staff user was not created. Check the service-role key."
    };
  }
}
