/**
 * Shared admin form class strings. Kept in a plain module (no "use client")
 * so Server Components can import and compose them as real strings; exporting
 * them from a client module turns them into client references on the server,
 * which stringify to junk when passed through cn().
 */
export const adminInput = "mt-1.5 h-10 w-full rounded-lg bg-white px-3 text-[0.9375rem] ring-1 ring-inset ring-ink/15 placeholder:text-ink-faint focus:ring-ink";

export const adminTextarea = "mt-1.5 block w-full min-h-24 rounded-lg bg-white px-3 py-2 text-[0.9375rem] ring-1 ring-inset ring-ink/15 placeholder:text-ink-faint focus:ring-ink";
