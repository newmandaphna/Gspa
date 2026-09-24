import { sql } from "drizzle-orm";
import type { Db } from "./index";
import { experiences } from "./schema";
import { CATALOG } from "@/lib/content/catalog";

/**
 * Upserts the content catalog into the experiences table so the DB always
 * reflects src/lib/content/catalog.ts. Items removed from the catalog are
 * marked inactive (never deleted — bookings reference them).
 */
export async function seedCatalog(db: Db): Promise<void> {
  const slugs = CATALOG.map((c) => c.slug);
  for (const [i, item] of CATALOG.entries()) {
    await db
      .insert(experiences)
      .values({
        slug: item.slug,
        name: item.name,
        category: item.category,
        resource: item.resource,
        durationMin: item.durationMin,
        priceCents: item.priceCents,
        maxGuestsPerUnit: item.maxGuestsPerUnit,
        maxUnitsPerBooking: item.maxUnitsPerBooking,
        tagline: item.tagline,
        description: item.description,
        includes: item.includes,
        bookable: item.bookable,
        memberOnly: item.memberOnly ?? false,
        memberPriceCents: item.memberPriceCents ?? null,
        minTier: item.minTier ?? null,
        fixedUnits: item.fixedUnits ?? null,
        extraGuestCents: item.extraGuestCents ?? null,
        eligibility: item.eligibility,
        sortOrder: i,
        active: true,
      })
      .onConflictDoUpdate({
        target: experiences.slug,
        set: {
          name: item.name,
          category: item.category,
          resource: item.resource,
          durationMin: item.durationMin,
          priceCents: item.priceCents,
          maxGuestsPerUnit: item.maxGuestsPerUnit,
          maxUnitsPerBooking: item.maxUnitsPerBooking,
          tagline: item.tagline,
          description: item.description,
          includes: item.includes,
          bookable: item.bookable,
          memberOnly: item.memberOnly ?? false,
          memberPriceCents: item.memberPriceCents ?? null,
          minTier: item.minTier ?? null,
          fixedUnits: item.fixedUnits ?? null,
          extraGuestCents: item.extraGuestCents ?? null,
          eligibility: item.eligibility,
          sortOrder: i,
          active: true,
        },
      });
  }
  if (slugs.length) {
    await db
      .update(experiences)
      .set({ active: false })
      .where(sql`${experiences.slug} NOT IN (${sql.join(slugs.map((s) => sql`${s}`), sql`, `)})`);
  }
}
