export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="panel flex min-h-48 items-center justify-center p-8 text-center">
      <div>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}
