"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="font-display text-3xl">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        This page hit an unexpected problem. Try again. If it keeps happening, come back in a few
        minutes.
      </p>
      <button type="button" onClick={reset} className="btn btn-primary mt-6">
        Try again
      </button>
    </div>
  );
}
