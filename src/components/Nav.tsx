"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { NAV } from "@/lib/content/nav";
import { SITE } from "@/lib/config/site";
import { cn } from "@/lib/cn";
import { Wordmark } from "@/components/Wordmark";

/**
 * apple.com-style chrome: 48px, always dark and translucent, centered links,
 * a single "Reserve" pill. Mobile collapses into a full-screen sheet.
 */
export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50" data-theme="dark">
      <nav aria-label="Primary" className="glass-dark h-[var(--nav-h)] border-b border-white/[0.08] text-snow">
        <div className="mx-auto flex h-full max-w-[1180px] items-center justify-between px-5 sm:px-8">
          <Link href="/" onClick={close} className="flex items-center gap-2 rounded-md" aria-label={`${SITE.name} home`}>
            <Wordmark className="h-[18px] w-auto" />
          </Link>

          <ul className="hidden items-center gap-8 md:flex">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "text-[0.8125rem] tracking-[-0.01em] transition-opacity duration-200 hover:opacity-100",
                      active ? "opacity-100" : "opacity-80",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3">
            <Link
              href="/reserve"
              className="hidden h-7 items-center rounded-pill bg-snow px-3.5 text-[0.75rem] font-medium text-ink transition-colors hover:bg-white sm:inline-flex"
            >
              Reserve
            </Link>
            <button
              type="button"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
              className="relative flex h-9 w-9 items-center justify-center rounded-md md:hidden"
            >
              <span
                className={cn(
                  "absolute h-[1.5px] w-[18px] bg-snow transition-transform duration-300 ease-[var(--ease-apple)]",
                  open ? "translate-y-0 rotate-45" : "-translate-y-[4px]",
                )}
              />
              <span
                className={cn(
                  "absolute h-[1.5px] w-[18px] bg-snow transition-transform duration-300 ease-[var(--ease-apple)]",
                  open ? "translate-y-0 -rotate-45" : "translate-y-[4px]",
                )}
              />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="glass-dark fixed inset-x-0 bottom-0 top-[var(--nav-h)] overflow-y-auto md:hidden"
          >
            <motion.ul
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } }}
              className="flex flex-col px-8 pt-8"
            >
              {[...NAV, { label: "Reserve", href: "/reserve" }].map((item) => (
                <motion.li
                  key={item.href}
                  variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                  className="border-b border-white/10"
                >
                  <Link href={item.href} onClick={close} className="block py-4 text-[1.75rem] font-semibold tracking-[-0.02em] text-snow">
                    {item.label}
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
            <p className="px-8 pt-8 text-[0.8125rem] text-mist">
              {SITE.address.neighborhood} · {SITE.phone}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
