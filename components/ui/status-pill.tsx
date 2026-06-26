import { clsx } from "clsx";

const toneClass = {
  green: "border-forest/20 bg-forest/10 text-forest",
  amber: "border-sun/20 bg-sun/10 text-sun",
  red: "border-berry/20 bg-berry/10 text-berry",
  blue: "border-ocean/20 bg-ocean/10 text-ocean",
  slate: "border-slate-200 bg-slate-100 text-slate-600"
};

export function StatusPill({
  children,
  tone = "slate"
}: {
  children: React.ReactNode;
  tone?: keyof typeof toneClass;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold",
        toneClass[tone]
      )}
    >
      {children}
    </span>
  );
}
