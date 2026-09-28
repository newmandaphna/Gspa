import { SITE } from "@/lib/config/site";
import { formatMoney } from "@/lib/time";

/**
 * Whether prices are shown to the public. The catalog, the membership tiers and
 * the booking engine keep their real figures either way; this only decides what
 * a visitor reads. Flip SITE.pricesPublic in site.ts to publish every price at once.
 */
export const PRICES_PUBLIC: boolean = SITE.pricesPublic;

/** What a visitor reads in place of a price while prices are held back. */
export const PRICE_PENDING: string = SITE.pricePending;

/** A sum of money for display, or the pending line. */
export function shownMoney(cents: number): string {
  return PRICES_PUBLIC ? formatMoney(cents) : PRICE_PENDING;
}

/** `withPrice` while prices are public, otherwise `without` (a wording that names no figure). */
export function ifPriced<T>(withPrice: T, without: T): T {
  return PRICES_PUBLIC ? withPrice : without;
}
