"use client";

import { useActionState, useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { signInAction, signUpOwnerAction } from "@/app/actions/auth";
import { ActionMessage } from "@/components/action-message";

const initialState = {};

export function LoginForm() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [signInState, signInFormAction, signInPending] = useActionState(
    signInAction,
    initialState
  );
  const [signUpState, signUpFormAction, signUpPending] = useActionState(
    signUpOwnerAction,
    initialState
  );

  return (
    <div className="panel w-full max-w-md p-6">
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-md border border-line bg-slate-50 p-1">
        <button
          className={`rounded px-3 py-2 text-sm font-semibold ${mode === "sign-in" ? "bg-white text-ink shadow-sm" : "text-slate-500"}`}
          onClick={() => setMode("sign-in")}
          type="button"
        >
          Sign in
        </button>
        <button
          className={`rounded px-3 py-2 text-sm font-semibold ${mode === "sign-up" ? "bg-white text-ink shadow-sm" : "text-slate-500"}`}
          onClick={() => setMode("sign-up")}
          type="button"
        >
          Create owner
        </button>
      </div>

      {mode === "sign-in" ? (
        <form action={signInFormAction} className="space-y-4">
          <ActionMessage state={signInState} />
          <div>
            <label className="label" htmlFor="sign-in-email">
              Email
            </label>
            <input className="field mt-1" id="sign-in-email" name="email" type="email" required />
          </div>
          <div>
            <label className="label" htmlFor="sign-in-password">
              Password
            </label>
            <input
              className="field mt-1"
              id="sign-in-password"
              name="password"
              type="password"
              required
            />
          </div>
          <button className="btn btn-primary w-full" disabled={signInPending} type="submit">
            <LogIn aria-hidden="true" className="h-4 w-4" />
            Sign in
          </button>
        </form>
      ) : (
        <form action={signUpFormAction} className="space-y-4">
          <ActionMessage state={signUpState} />
          <div>
            <label className="label" htmlFor="owner-name">
              Owner name
            </label>
            <input className="field mt-1" id="owner-name" name="fullName" required />
          </div>
          <div>
            <label className="label" htmlFor="sign-up-email">
              Email
            </label>
            <input className="field mt-1" id="sign-up-email" name="email" type="email" required />
          </div>
          <div>
            <label className="label" htmlFor="sign-up-password">
              Password
            </label>
            <input
              className="field mt-1"
              id="sign-up-password"
              minLength={8}
              name="password"
              type="password"
              required
            />
          </div>
          <button className="btn btn-primary w-full" disabled={signUpPending} type="submit">
            <UserPlus aria-hidden="true" className="h-4 w-4" />
            Create account
          </button>
        </form>
      )}
    </div>
  );
}
