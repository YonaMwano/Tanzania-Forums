"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div className="mx-auto max-w-2xl px-4 py-16 text-center"><h1 className="text-2xl font-bold">We couldn’t load this page</h1><p className="mt-4 text-stone-500">Please try again in a moment.</p><button onClick={reset} className="mt-6 rounded-lg bg-brand-600 px-4 py-2 text-white">Try again</button></div>;
}
