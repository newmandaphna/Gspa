"use client";

import { useActionState } from "react";
import { adminLoginAction, createMemberAction, type AdminActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { TIERS } from "@/lib/config/site";
import { MEMBERSHIP_TIERS } from "@/lib/content/membership";
import { cn } from "@/lib/cn";

export const adminInput = "mt-1.5 h-10 w-full rounded-lg bg-white px-3 text-[0.9375rem] ring-1 ring-inset ring-ink/15 placeholder:text-ink-faint focus:ring-ink";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLoginAction, {} as AdminActionState);
  return (
    <form action={action} className="grid gap-4">
      <div>
        <label htmlFor="password" className="t-caption font-semibold">
          Admin password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={cn(adminInput, "h-12")} />
      </div>
      {state.error && (
        <p role="alert" className="t-caption rounded-lg bg-[#fff2f0] px-3 py-2 text-[#c0392b]">
          {state.error}
        </p>
      )}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </div>
    </form>
  );
}

export function CreateMemberForm() {
  const [state, action, pending] = useActionState(createMemberAction, {} as AdminActionState);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="firstName" className="t-caption font-semibold">
          First name
        </label>
        <input id="firstName" name="firstName" required className={adminInput} />
      </div>
      <div>
        <label htmlFor="lastName" className="t-caption font-semibold">
          Last name
        </label>
        <input id="lastName" name="lastName" required className={adminInput} />
      </div>
      <div>
        <label htmlFor="email" className="t-caption font-semibold">
          Email
        </label>
        <input id="email" name="email" type="email" required className={adminInput} />
      </div>
      <div>
        <label htmlFor="phone" className="t-caption font-semibold">
          Phone
        </label>
        <input id="phone" name="phone" type="tel" className={adminInput} />
      </div>
      <div>
        <label htmlFor="tier" className="t-caption font-semibold">
          Tier
        </label>
        <select id="tier" name="tier" defaultValue={TIERS[0]} className={adminInput}>
          {MEMBERSHIP_TIERS.map((t) => (
            <option key={t.key} value={t.key}>
              {t.name} · {t.price} {t.priceNote}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="billing" className="t-caption font-semibold">
          Billing
        </label>
        <select id="billing" name="billing" defaultValue="annual" className={adminInput}>
          <option value="annual">Annual (renews in 12 months)</option>
          <option value="lifetime">Lifetime</option>
        </select>
      </div>
      <div>
        <label htmlFor="guestPasses" className="t-caption font-semibold">
          Guest passes
        </label>
        <input id="guestPasses" name="guestPasses" type="number" min={0} defaultValue={0} className={adminInput} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="notes" className="t-caption font-semibold">
          Notes (internal)
        </label>
        <textarea id="notes" name="notes" rows={2} className={cn(adminInput, "h-auto py-2")} />
      </div>
      {state.error && (
        <p role="alert" className="t-caption rounded-lg bg-[#fff2f0] px-3 py-2 text-[#c0392b] sm:col-span-2">
          {state.error}
        </p>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create member and generate activation code"}
        </Button>
      </div>
    </form>
  );
}
