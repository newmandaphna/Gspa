"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function CancelForm({ code }: { code: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("Cancel this reservation? This can't be undone.")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(code)}/cancel`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not cancel.");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Button variant="link" className="mt-3 text-[0.9375rem]" onClick={() => setOpen(true)}>
        Cancel reservation
      </Button>
    );
  }
  return (
    <form onSubmit={submit} className="mt-4">
      <label htmlFor="cancel-email" className="t-caption font-semibold">
        Confirm the email on the reservation
      </label>
      <input
        id="cancel-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-2 h-11 w-full rounded-xl bg-white px-4 text-[1rem] ring-1 ring-inset ring-ink/15 focus:ring-ink"
      />
      <div className="mt-3 flex items-center gap-3">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Cancelling…" : "Cancel reservation"}
        </Button>
        <Button variant="link" className="text-[0.9375rem]" onClick={() => setOpen(false)}>
          Keep it
        </Button>
      </div>
      {error && (
        <p role="alert" className="t-caption mt-3 text-[#c0392b]">
          {error}
        </p>
      )}
    </form>
  );
}
