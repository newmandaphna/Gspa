import Link from "next/link";
import { redirect } from "next/navigation";
import { adminLogoutAction } from "@/app/admin/actions";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const LINKS = [
  { href: "/admin", label: "Today" },
  { href: "/admin/bookings", label: "Reservations" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/inquiries", label: "Inquiries" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Navigation-level guard only; each page under (protected) calls requireAdmin() itself.
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <div data-theme="light" className="min-h-dvh bg-paper-2 pt-[var(--nav-h)] text-ink">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-8 sm:px-8 lg:flex-row lg:gap-10">
        <aside className="lg:w-56 lg:shrink-0">
          <p className="t-eyebrow text-ink-faint">Front desk</p>
          <nav aria-label="Admin" className="no-scrollbar mt-3 flex gap-1 overflow-x-auto lg:flex-col">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="shrink-0 rounded-lg px-3 py-2 text-[0.9375rem] font-medium hover:bg-white">
                {l.label}
              </Link>
            ))}
          </nav>
          <form action={adminLogoutAction} className="mt-4">
            <button type="submit" className="t-caption px-3 text-ink-muted underline underline-offset-2 hover:text-ink">
              Sign out
            </button>
          </form>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
