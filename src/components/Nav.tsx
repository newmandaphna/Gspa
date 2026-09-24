"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { NAV, isNavActive } from "@/lib/content/nav";
import { SITE } from "@/lib/config/site";
import { cn } from "@/lib/cn";
import type { OpenStatus } from "@/lib/hours";
import { useOpenStatus } from "@/components/LiveStatus";
import { Wordmark } from "@/components/Wordmark";
import { Owner } from "@/components/ui/Owner";

type NavTheme = "dark" | "light" | "clear";

/**
 * Routes whose first band is paper, so the server HTML already carries the
 * light bar and nothing flashes. Keep in step with the first <Section theme>
 * of each page; a route missing here paints a dark bar over a white hero
 * until the bundle hydrates.
 */
const LIGHT_FIRST = ["/training/classes", "/reserve", "/admin", "/events", "/legal", "/members/login", "/members/activate", "/members/account", "/members/requests/new"];
function firstBand(pathname: string): "dark" | "light" {
  return LIGHT_FIRST.some((p) => pathname === p || pathname.startsWith(p + "/")) ? "light" : "dark";
}

/** A store that never changes: server snapshot false, client snapshot true, so "mounted" hydrates without a set-state. */
const subscribeNever = () => () => {};

type Props = {
  /** The signed-in member's first name, resolved by the server layout. */
  memberName: string | null;
  /** Open/closed at render time; the client refreshes it each minute. */
  initialStatus: OpenStatus;
};

/**
 * apple.com-style chrome: 48px, translucent, centered links, a single
 * "Reserve" pill. The bar takes the tone of the band under it (an
 * IntersectionObserver on every data-theme section), is fully transparent
 * over the home hero, and shows the live open/closed line at md and up.
 * Mobile collapses into a full-screen sheet and gets a bottom Reserve bar
 * once the first viewport has scrolled away.
 */
export function Nav({ memberName, initialStatus }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [bandTheme, setBandTheme] = useState<"dark" | "light">(() => firstBand(pathname));
  const [overHero, setOverHero] = useState(pathname === "/");
  const [pastHero, setPastHero] = useState(false);
  const status = useOpenStatus(initialStatus);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  // The phone's bottom bar is portalled to the end of <body>, after the footer, so it
  // comes last in the tab order rather than before every link on the page. It only
  // exists once mounted (nothing to portal into on the server); it is hidden until
  // the hero has scrolled away anyway.
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  const barHost = mounted ? document.body : null;
  const close = () => setOpen(false);

  const home = pathname === "/";
  const inFlow = pathname.startsWith("/reserve") || pathname.startsWith("/admin");
  const theme: NavTheme = home && overHero && !open ? "clear" : open ? "dark" : bandTheme;

  // While the sheet is open: lock scroll, make the page behind it inert (it is
  // rendered by the server layout, so the attribute is toggled on the DOM),
  // close on Escape or when the viewport widens past the mobile breakpoint
  // (the sheet is md:hidden), move focus into the sheet, and hand it back to
  // the toggle on close.
  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    const behind = [document.getElementById("main"), document.getElementById("site-footer")].filter((el): el is HTMLElement => Boolean(el));
    for (const el of behind) el.setAttribute("inert", "");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 768px)");
    const onResize = () => {
      if (desktop.matches) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    const raf = requestAnimationFrame(() => sheetRef.current?.querySelector("a")?.focus());
    const toggle = toggleRef.current;
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
      document.documentElement.style.overflow = "";
      for (const el of behind) el.removeAttribute("inert");
      requestAnimationFrame(() => toggle?.focus());
    };
  }, [open]);

  // The band under the bar. Every data-theme element in the page is observed
  // against a root shrunk to the bar's own strip (rootMargin closes the
  // viewport from the bottom up to the nav height); the deepest intersecting
  // element wins so a light panel inside a dark band still reads correctly.
  useEffect(() => {
    const main = document.getElementById("main");
    const footer = document.getElementById("site-footer");
    if (!main) return;
    const targets = [...main.querySelectorAll<HTMLElement>("[data-theme]"), ...(footer ? [footer] : [])];
    if (targets.length === 0) return;
    // The observer keeps a short list of bands near the top edge; the pick reads
    // their rects against the middle of the bar, so a boundary sliding under the
    // bar switches the tone at the right pixel and the deepest band wins a tie.
    const live = new Set<HTMLElement>();
    let raf = 0;
    const pick = () => {
      raf = 0;
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h"), 10) || 48;
      const mid = navH / 2;
      let best: HTMLElement | null = null;
      for (const el of live) {
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid && (!best || best.contains(el))) best = el;
      }
      if (best) setBandTheme(best.dataset.theme === "light" ? "light" : "dark");
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(pick);
    };
    // rootMargin only takes px or %, so the root is a strip one percent of the viewport tall under the top edge.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) live.add(e.target as HTMLElement);
          else live.delete(e.target as HTMLElement);
        }
        schedule();
      },
      { rootMargin: "0px 0px -99% 0px", threshold: 0 },
    );
    for (const el of targets) io.observe(el);
    window.addEventListener("scroll", schedule, { passive: true });
    // Sections mount after navigation and after client fetches; watch for new ones.
    const mo = new MutationObserver(() => {
      for (const el of main.querySelectorAll<HTMLElement>("[data-theme]")) {
        if (!targets.includes(el)) {
          targets.push(el);
          io.observe(el);
        }
      }
    });
    mo.observe(main, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("scroll", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pathname]);

  // Scroll position: transparent over the home hero (fades in at 80 vh) and
  // the phone's bottom Reserve bar once the first viewport has gone.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      setOverHero(home && y < vh * 0.8);
      setPastHero(y > vh * 0.7);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [home, pathname]);

  const membersHref = memberName ? "/members" : "/members/login";
  const light = theme === "light";
  const showBottomBar = pastHero && !open && !inFlow;

  return (
    <header className="fixed inset-x-0 top-0 z-50" data-theme={light ? "light" : "dark"} data-nav-theme={theme}>
      <nav
        aria-label="Primary"
        className={cn(
          "h-[var(--nav-h)] border-b transition-[background-color,border-color,color,backdrop-filter] duration-250 ease-[var(--ease-apple)]",
          theme === "clear" && "border-transparent bg-transparent text-snow",
          theme === "dark" && "glass-dark border-white/[0.08] text-snow",
          theme === "light" && "glass border-ink/[0.08] text-ink",
        )}
      >
        <div className="mx-auto flex h-full max-w-[1180px] items-center justify-between px-5 sm:px-8">
          <Link href="/" onClick={close} className="flex items-center gap-2 rounded-md" aria-label={`${SITE.name} home`}>
            <Wordmark tone="current" className="text-[15px]" />
          </Link>

           <ul className="hidden items-center gap-3 lg:gap-5 md:flex">
            {NAV.map((item) => {
               const active = isNavActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                     aria-current={active ? "page" : undefined}
                    className={cn(
                      "whitespace-nowrap text-[0.8125rem] tracking-[-0.01em] transition-opacity duration-200 hover:opacity-100",
                      active ? "opacity-100" : "opacity-80",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-4">
            <Link href={membersHref} className="hidden text-[0.8125rem] tracking-[-0.01em] opacity-80 transition-opacity hover:opacity-100 md:inline">
              {memberName ? memberName : "Members"}
            </Link>
            {/* Live status: server-rendered, refreshed each minute. Gold dot when open, mist when closed. */}
            <Link
              href="/visit#hours"
              className={cn("hidden items-center gap-2 font-mono text-[0.6875rem] tracking-[0.02em] transition-opacity hover:opacity-100 xl:inline-flex", light ? "text-ink-muted" : "text-mist")}
              aria-label={`${status.short}. See hours`}
            >
              <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full transition-colors duration-500", status.open ? "bg-accent" : "bg-mist")} />
              <span aria-live="polite">{status.short}</span>
            </Link>
            <Link
              href="/reserve"
              className={cn(
                "hidden h-7 items-center rounded-pill px-3.5 text-[0.75rem] font-medium transition-colors duration-250 sm:inline-flex",
                light ? "bg-ink text-snow hover:bg-night-3" : "bg-snow text-ink hover:bg-white",
              )}
            >
              Reserve
            </Link>
            <button
              ref={toggleRef}
              type="button"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
              className="relative flex h-9 w-9 items-center justify-center rounded-md md:hidden"
            >
              <span
                className={cn(
                  "absolute h-[1.5px] w-[18px] bg-current transition-transform duration-300 ease-[var(--ease-apple)]",
                  open ? "translate-y-0 rotate-45" : "-translate-y-[4px]",
                )}
              />
              <span
                className={cn(
                  "absolute h-[1.5px] w-[18px] bg-current transition-transform duration-300 ease-[var(--ease-apple)]",
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
            ref={sheetRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="glass-dark fixed inset-x-0 bottom-0 top-[var(--nav-h)] overflow-y-auto text-snow md:hidden"
          >
            <motion.ul
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } }}
              className="flex flex-col px-8 pt-8"
            >
              {[...NAV, { label: memberName ? `Members · ${memberName}` : "Members", href: membersHref }, { label: "Reserve", href: "/reserve" }].map((item) => (
                <motion.li
                  key={item.href}
                  variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                  className="border-b border-white/10"
                >
                  <Link href={item.href} onClick={close} aria-current={isNavActive(pathname, item.href) ? "page" : undefined} className="block py-4 text-[1.75rem] font-semibold tracking-[-0.02em] text-snow aria-[current=page]:underline underline-offset-8">
                    {item.label}
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
            <p className="mt-8 flex items-center gap-2 px-8 font-mono text-[0.8125rem] text-mist">
              <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", status.open ? "bg-accent" : "bg-mist")} />
              {status.short}
            </p>
            <p className="px-8 pt-2 text-[0.8125rem] text-mist">
              {SITE.address.neighborhood}
              <Owner value={SITE.phone}> · {SITE.phone}</Owner>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phone: a thumb-reach Reserve bar once the hero has scrolled out. Hidden in the reserve
          flow and admin. It stays mounted and slides out of view (inert while hidden) rather than
          unmounting, so a focused link is never pulled out from under the keyboard on scroll. */}
      {barHost &&
        !inFlow &&
        createPortal(
          <motion.div
            initial={false}
            animate={{ y: showBottomBar ? 0 : 72 }}
            transition={{ duration: 0.3, ease: [0.28, 0.11, 0.32, 1] }}
            inert={!showBottomBar}
            aria-hidden={!showBottomBar}
            data-theme={light ? "light" : "dark"}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 border-t pb-[env(safe-area-inset-bottom)] md:hidden",
              light ? "glass border-ink/[0.08] text-ink" : "glass-dark border-white/[0.08] text-snow",
            )}
          >
            <div className="flex h-14 items-center justify-between gap-4 px-5">
              <p className={cn("flex min-w-0 items-center gap-2 font-mono text-[0.75rem]", light ? "text-ink-muted" : "text-mist")}>
                <span aria-hidden="true" className={cn("h-1.5 w-1.5 shrink-0 rounded-full", status.open ? "bg-accent" : "bg-mist")} />
                <span className="truncate">{status.short}</span>
              </p>
              <Link
                href="/reserve"
                tabIndex={showBottomBar ? undefined : -1}
                className={cn("inline-flex h-9 shrink-0 items-center rounded-pill px-5 text-[0.875rem] font-medium", light ? "bg-ink text-snow" : "bg-snow text-ink")}
              >
                Reserve
              </Link>
            </div>
          </motion.div>,
          barHost,
        )}
    </header>
  );
}
