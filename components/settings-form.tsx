"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { updateSettingsAction } from "@/app/actions/settings";
import { ActionMessage } from "@/components/action-message";

export function SettingsForm({
  organization,
  store
}: {
  organization: {
    name: string;
    currency: string;
    timezone: string;
    tax_rate_basis_points: number;
  };
  store: {
    name: string;
    address: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, {});

  return (
    <form action={formAction} className="panel max-w-2xl space-y-4 p-5">
      <ActionMessage state={state} />
      <div>
        <label className="label" htmlFor="businessName">
          Business name
        </label>
        <input
          className="field mt-1"
          defaultValue={organization.name}
          id="businessName"
          name="businessName"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="storeName">
            Store name
          </label>
          <input className="field mt-1" defaultValue={store.name} id="storeName" name="storeName" required />
        </div>
        <div>
          <label className="label" htmlFor="currency">
            Currency
          </label>
          <input
            className="field mt-1 uppercase"
            defaultValue={organization.currency}
            id="currency"
            maxLength={3}
            name="currency"
            required
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="address">
          Store address
        </label>
        <input className="field mt-1" defaultValue={store.address ?? ""} id="address" name="address" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="timezone">
            Timezone
          </label>
          <input
            className="field mt-1"
            defaultValue={organization.timezone}
            id="timezone"
            name="timezone"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="taxRate">
            Tax rate %
          </label>
          <input
            className="field mt-1"
            defaultValue={(organization.tax_rate_basis_points / 100).toFixed(2)}
            id="taxRate"
            max="100"
            min="0"
            name="taxRate"
            step="0.01"
            type="number"
          />
        </div>
      </div>
      <button className="btn btn-primary" disabled={pending} type="submit">
        <Save aria-hidden="true" className="h-4 w-4" />
        Save settings
      </button>
    </form>
  );
}
