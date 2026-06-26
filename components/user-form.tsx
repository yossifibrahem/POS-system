"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { createStaffUserAction } from "@/app/actions/users";
import { ActionMessage } from "@/components/action-message";

export function UserForm() {
  const [state, formAction, pending] = useActionState(createStaffUserAction, {});

  return (
    <form action={formAction} className="panel space-y-4 p-5">
      <ActionMessage state={state} />
      <div>
        <label className="label" htmlFor="fullName">
          Full name
        </label>
        <input className="field mt-1" id="fullName" name="fullName" required />
      </div>
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input className="field mt-1" id="email" name="email" type="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Temporary password
        </label>
        <input
          className="field mt-1"
          id="password"
          minLength={8}
          name="password"
          type="password"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="role">
          Role
        </label>
        <select className="field mt-1" defaultValue="cashier" id="role" name="role">
          <option value="cashier">Cashier</option>
          <option value="owner_admin">Owner admin</option>
        </select>
      </div>
      <button className="btn btn-primary w-full" disabled={pending} type="submit">
        <UserPlus aria-hidden="true" className="h-4 w-4" />
        Create user
      </button>
    </form>
  );
}
