import type { ActionState } from "@/lib/types";

export function ActionMessage({ state }: { state: ActionState }) {
  if (!state.error && !state.message) return null;

  return (
    <p
      className={
        state.error
          ? "rounded-md border border-berry/20 bg-berry/10 px-3 py-2 text-sm font-medium text-berry"
          : "rounded-md border border-forest/20 bg-forest/10 px-3 py-2 text-sm font-medium text-forest"
      }
    >
      {state.error ?? state.message}
    </p>
  );
}
