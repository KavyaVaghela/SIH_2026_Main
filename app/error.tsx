"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console/error monitoring service
    console.error("Unhandled Error Caught by Boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md rounded-lg border border-destructive/20 bg-destructive/10 p-8 shadow-sm">
        <h2 className="mb-2 text-xl font-bold text-destructive">Something went wrong!</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred in the application."}
        </p>
        <button
          onClick={() => reset()}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
