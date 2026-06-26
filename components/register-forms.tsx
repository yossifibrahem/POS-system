"use client";

import { useActionState } from "react";
import { Banknote, LockKeyhole } from "lucide-react";
import { closeRegisterAction, openRegisterAction } from "@/app/actions/register";
import { ActionMessage } from "@/components/action-message";
import { formatMoney } from "@/lib/format";

export function OpenRegisterForm() {
  const [state, formAction, pending] = useActionState(openRegisterAction, {});

  return (
    <form action={formAction} className="panel max-w-xl space-y-4 p-5">
      <ActionMessage state={state} />
      <div>
        <label className="label" htmlFor="openingCash">
          Opening cash
        </label>
        <input
          className="field mt-1"
          id="openingCash"
          min="0"
          name="openingCash"
          placeholder="0.00"
          step="0.01"
          type="number"
        />
      </div>
      <button className="btn btn-primary" disabled={pending} type="submit">
        <Banknote aria-hidden="true" className="h-4 w-4" />
        Open register
      </button>
    </form>
  );
}

export function CloseRegisterForm({
  registerSessionId,
  expectedCashCents,
  currency
}: {
  registerSessionId: string;
  expectedCashCents: number;
  currency: string;
}) {
  const [state, formAction, pending] = useActionState(closeRegisterAction, {});

  return (
    <form action={formAction} className="space-y-3">
      <ActionMessage state={state} />
      <input name="registerSessionId" type="hidden" value={registerSessionId} />
      <p className="text-sm text-slate-500">
        Expected drawer:{" "}
        <span className="font-semibold text-ink">
          {formatMoney(expectedCashCents, currency)}
        </span>
      </p>
      <div>
        <label className="label" htmlFor="actualCash">
          Counted cash
        </label>
        <input
          className="field mt-1"
          id="actualCash"
          min="0"
          name="actualCash"
          placeholder="0.00"
          step="0.01"
          type="number"
          required
        />
      </div>
      <button className="btn btn-secondary w-full" disabled={pending} type="submit">
        <LockKeyhole aria-hidden="true" className="h-4 w-4" />
        Close register
      </button>
    </form>
  );
}
