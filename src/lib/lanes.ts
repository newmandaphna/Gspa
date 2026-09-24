import { FACILITY } from "@/lib/config/site";
import type { CatalogItem } from "@/lib/content/catalog";

/** "7", "07" or "12" becomes "07" or "12"; anything outside the lane count is dropped. */
export function parseLane(raw: string | null): string | null {
  if (!raw || !/^\d{1,2}$/.test(raw)) return null;
  const n = Number(raw);
  if (n < 1 || n > FACILITY.laneCount) return null;
  return String(n).padStart(2, "0");
}

/**
 * The lane a floor-plan tap asked for, but only while the chosen experience
 * runs on a lane. A visitor who arrives on ?lane=07 and then picks the
 * simulator or an instructor session has no lane to request, so the note,
 * the summary row and everything downstream drop it.
 */
export function laneFor(lane: string | null, experience: Pick<CatalogItem, "resource"> | null): string | null {
  if (!lane || !experience || experience.resource !== "lane") return null;
  return lane;
}

/** The sentence carried in the booking notes. Matched by requestedLane in email.ts. */
export function laneNoteFor(lane: string | null, experience: Pick<CatalogItem, "resource"> | null): string {
  const l = laneFor(lane, experience);
  return l ? `Lane ${l} requested.` : "";
}
