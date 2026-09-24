"use client";

import { useActionState } from "react";
import Link from "next/link";
import { activateAction, changePasswordAction, createRequestAction, signInAction, type ActionState } from "@/app/members/actions";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const input = "mt-2 h-12 w-full rounded-xl bg-white px-4 text-[1.0625rem] ring-1 ring-inset ring-ink/15 placeholder:text-ink-faint focus:ring-ink";

function Label({ htmlFor, children, hint }: { htmlFor: string; children: React.ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="t-caption font-semibold text-ink">
      {children} {hint && <span className="font-normal text-ink-muted">({hint})</span>}
    </label>
  );
}

function ErrorLine({ state }: { state: ActionState }) {
  if (!state.error) return null;
  return (
    <p role="alert" className="t-body rounded-xl bg-[#fff2f0] px-4 py-3 text-[#c0392b]">
      {state.error}
    </p>
  );
}

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signInAction, {} as ActionState);
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="next" value={next ?? "/members"} />
      <div>
        <Label htmlFor="email">Email</Label>
        <input id="email" name="email" type="email" autoComplete="email" required className={input} />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={input} />
      </div>
      <ErrorLine state={state} />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
        <Link href="/members/activate" className="link-arrow text-[0.9375rem]">
          First time here? Activate your account
        </Link>
      </div>
    </form>
  );
}

export function ActivateForm() {
  const [state, action, pending] = useActionState(activateAction, {} as ActionState);
  return (
    <form action={action} className="grid gap-5">
      <div>
        <Label htmlFor="email">Email on file</Label>
        <input id="email" name="email" type="email" autoComplete="email" required className={input} />
      </div>
      <div>
        <Label htmlFor="code" hint="from your welcome packet">
          Activation code
        </Label>
        <input id="code" name="code" required placeholder="XXXX-XXXX" autoCapitalize="characters" className={cn(input, "font-mono uppercase tracking-widest")} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="password" hint="8+ characters">
            Choose a password
          </Label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className={input} />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required className={input} />
        </div>
      </div>
      <ErrorLine state={state} />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Activating…" : "Activate and sign in"}
        </Button>
        <Link href="/members/login" className="link-arrow text-[0.9375rem]">
          Already activated? Sign in
        </Link>
      </div>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, {} as ActionState);
  return (
    <form action={action} className="grid gap-5">
      <div>
        <Label htmlFor="current">Current password</Label>
        <input id="current" name="current" type="password" autoComplete="current-password" required className={input} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="password" hint="8+ characters">
            New password
          </Label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className={input} />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm</Label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required className={input} />
        </div>
      </div>
      <ErrorLine state={state} />
      {state.ok && <p className="t-body rounded-xl bg-success/10 px-4 py-3 text-[#1f7a3a]">Password updated.</p>}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Update password"}
        </Button>
      </div>
    </form>
  );
}

export function RequestForm({ kind, kinds, placeholder }: { kind: string; kinds: Record<string, string>; placeholder: string }) {
  const [state, action, pending] = useActionState(createRequestAction, {} as ActionState);
  return (
    <form action={action} className="grid gap-5">
      <div>
        <Label htmlFor="kind">Request</Label>
        <select id="kind" name="kind" defaultValue={kind} className={cn(input, "appearance-none")}>
          {Object.entries(kinds).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="details">Details</Label>
        <textarea id="details" name="details" rows={5} required minLength={4} maxLength={2000} placeholder={placeholder} className={cn(input, "h-auto py-3")} />
      </div>
      <ErrorLine state={state} />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Sending…" : "Send request"}
        </Button>
        <Link href="/members" className="link-arrow text-[0.9375rem]">
          Back to your dashboard
        </Link>
      </div>
    </form>
  );
}
