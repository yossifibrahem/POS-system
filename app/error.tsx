"use client";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-6">
      <div className="panel max-w-lg p-6">
        <h1 className="text-xl font-semibold text-ink">Something needs attention</h1>
        <p className="mt-2 text-sm text-slate-500">{error.message}</p>
        <button className="btn btn-primary mt-5" onClick={reset} type="button">
          Try again
        </button>
      </div>
    </main>
  );
}
