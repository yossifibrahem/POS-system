"use client";

import { useActionState } from "react";
import { Store } from "lucide-react";
import { bootstrapOwnerAction } from "@/app/actions/auth";
import { ActionMessage } from "@/components/action-message";

export function OnboardingForm({ email }: { email?: string }) {
  const [state, formAction, pending] = useActionState(bootstrapOwnerAction, {});

  return (
    <form action={formAction} className="panel w-full max-w-lg space-y-4 p-6">
      <ActionMessage state={state} />
      <div>
        <label className="label" htmlFor="fullName">
          Your name
        </label>
        <input
          className="field mt-1"
          defaultValue={email?.split("@")[0] ?? ""}
          id="fullName"
          name="fullName"
        />
      </div>
      <div>
        <label className="label" htmlFor="organizationName">
          Business name
        </label>
        <input className="field mt-1" id="organizationName" name="organizationName" required />
      </div>
      <div>
        <label className="label" htmlFor="storeName">
          Store name
        </label>
        <input className="field mt-1" id="storeName" name="storeName" required />
      </div>
      <button className="btn btn-primary w-full" disabled={pending} type="submit">
        <Store aria-hidden="true" className="h-4 w-4" />
        Finish setup
      </button>
    </form>
  );
}
