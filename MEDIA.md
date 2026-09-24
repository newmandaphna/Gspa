# Media guide for The Gun Spa site

Every photo on the site is a placeholder right now. Each one is an
`<ImageSlot slot="ID">` component (`src/components/ui/ImageSlot.tsx`) that
draws SVG/CSS art until a real photograph is supplied. The art is designed to
look finished, so the site can launch before the photo shoot; when photos
arrive they drop into the same frames with no layout change.

Every slot is discoverable in the rendered page as `data-image-slot="ID"`, so
you can open the browser inspector, find the frame you want to replace, and
read its ID.

## How to supply a photo

1. Export the photo as a JPG (sRGB, quality 80 to 85) at the size listed in
   the table below. Name it after the slot ID in lowercase, for example
   `hero_photo_01.jpg`.
2. Put it in `/public/media/`, for example `/public/media/hero_photo_01.jpg`.
3. That is the whole integration. `scripts/media-manifest.mjs` runs before
   every build (`npm run media` runs it by hand) and writes
   `src/lib/media/manifest.ts` with the file's size and a blur placeholder;
   `<ImageSlot>` looks its slot ID up there and switches from art to the
   photo, served as AVIF or WebP through `next/image` with `object-cover`
   (cropped to the frame, never stretched). Add a portrait export named
   `hero_photo_01-portrait.jpg` beside it and phones held upright get that
   file instead. A 12-second loop goes in as `video={{ mp4, webm }}` on the
   slot; it stays a still under reduced motion or Save-Data.

Where the slot ID is passed:

| Page | Where the slot ID lives |
|---|---|
| `/` (home) | `src/lib/content/pages/home.ts` (`imageSlot`), rendered by `src/app/page.tsx` |
| `/training` | `src/lib/content/pages/training.ts` (`imageSlot` for the hero, `slot` per instructor), rendered by `src/app/training/page.tsx` |
| `/club`, `/membership`, `/events`, `/visit` | inline in `src/app/<page>/page.tsx` |

The manifest is that central map: adding a correctly named file is the only
step. `src=` on the component still works as a manual override.

## Recommended dimensions by aspect

Photos are cropped to the frame, so shoot with some margin and keep the
subject away from the edges. Widths are the long side of the export.

| Aspect | Export size | Used for |
|---|---|---|
| Full-bleed 16:9 (hero backgrounds) | 2400 x 1350 min, 3200 x 1800 preferred | HERO_PHOTO_01, EXTERIOR_PHOTO_01, EVENTS_PHOTO_01 |
| 21:9 | 2400 x 1030 | SIM_PHOTO_01, SUITE_PHOTO_02, MAP_EMBED (desktop) |
| 16:9 | 1920 x 1080 | CLUB_PHOTO_01, TRAINING_PHOTO_01, FOUNDERS_WALL_01, MAP_EMBED (phones) |
| 16:10 | 1600 x 1000 | SUITE_PHOTO_01 |
| 3:2 | 1500 x 1000 | LOUNGE_PHOTO_01, DATE_PHOTO_01 |
| 4:3 | 1600 x 1200 | LOUNGE_PHOTO_02 |
| 1:1 | 600 x 600 (rendered at 96 px) | INSTRUCTOR_PHOTO_01 to 03 |
| Strip, 8:1 desktop / 3:1 phone | 2400 x 300 (logos on transparent or black) | CLIENT_LOGOS_01 |

Full-bleed heroes sit under a dark gradient with copy over the lower third,
so they should be dark, low-detail images that read well when dimmed. Keep
key content (the sign, the lanes) in the middle 60 percent horizontally so it
survives both phone and desktop crops.

## Slot list

Verified against the repo on 2026-09-24 by grepping `src/app`, `src/components`
and `src/lib/content` for `slot=` / `imageSlot`. EXTERIOR_PHOTO_01 is used on
two pages; one file serves both.

| Slot ID | Page | Intended photo | Aspect |
|---|---|---|---|
| HERO_PHOTO_01 | `/` | The firing line from behind the shooters, lit lanes receding toward the targets, near-black surroundings. Sits under a dark gradient so the tagline stays legible. | Full-bleed, 16:9 minimum (2400 x 1350) |
| SUITE_PHOTO_01 | `/` | Inside a private suite: two lanes behind frosted glass with the sofa, screen and espresso table of the attached lounge in the foreground. | 16:10 |
| SIM_PHOTO_01 | `/` | A simulator bay mid-scenario: laser-recoil pistol raised toward the 4K wall, room dim. Scanlines, corner labels and the gold trace are overlaid by the page. | 21:9 |
| LOUNGE_PHOTO_01 | `/` | The lounge: an espresso on a low table, folded warm towels, the firing line visible behind ballistic glass. | 3:2 |
| EXTERIOR_PHOTO_01 | `/` and `/visit` | The street entrance in Jamaica, Queens at dusk with the lit wordmark above the door. A bottom-up dark gradient and (on the home page) the transit sketch overlay it; the headline sits over the lower third. | Full-bleed, 16:9 or wider, min 2400 px wide |
| CLUB_PHOTO_01 | `/club` | Wide view of the range floor from the lounge side, lanes receding to the target line, seen through the glass. Hero, beneath the floor plan. | 16:9 |
| SUITE_PHOTO_02 | `/club` | Inside a private suite: the two lanes behind glass with the sofa and screen of the attached lounge in the foreground. | 21:9 on desktop, 16:9 on mobile |
| LOUNGE_PHOTO_02 | `/club` | The lounge at rest: espresso and sparkling water on a low table, the firing line visible through the ballistic glass wall. | 4:3 |
| TRAINING_PHOTO_01 | `/training` | Hero: an instructor beside a student on the firing line, both looking downrange at a tightening group on the target. Dark, low-key lighting. | 16:9 |
| INSTRUCTOR_PHOTO_01 | `/training` | Headshot of the first instructor, neutral background, rendered as a 96 px circle. Name and credential line are edited in `src/lib/content/pages/training.ts`. | 1:1 |
| INSTRUCTOR_PHOTO_02 | `/training` | Headshot of the second instructor, neutral background, rendered as a 96 px circle. | 1:1 |
| INSTRUCTOR_PHOTO_03 | `/training` | Headshot of the third instructor, neutral background, rendered as a 96 px circle. | 1:1 |
| FOUNDERS_WALL_01 | `/membership` | The Founders wall: a row of engraved brushed-metal nameplates on a pale wall, most still blank, shot straight on in soft light. Fallback art is the "001 / 50" nameplate SVG. | 16:9 |
| EVENTS_PHOTO_01 | `/events` | The range floor from above at night: twelve lanes, the two private suites lit, the lounge beyond the glass. Sits behind the hero copy and floor plan, so dark and low-detail. | Full-bleed 16:9 background (fill) |
| DATE_PHOTO_01 | `/events` | A lounge table set for two with espresso and dessert, the simulator wall glowing beyond the glass. Currently the Venn target-rings art with the espresso glyph. | 3:2 |
| CLIENT_LOGOS_01 | `/events` | A strip of client or partner logos in one muted tone on black. The caption above it is the placeholder "[Client logos]" until real names are supplied. | Strip: 3:1 on phones, 8:1 on desktop |
| MAP_EMBED | `/visit` | A map tile or embed centered on 158-12 Rockaway Blvd, Jamaica, NY 11434, showing the Van Wyck Expressway exit, Rockaway Blvd and the north edge of JFK. | 16:9 on phones, 21:9 on desktop |

## The logo

The nav and the footer use `src/components/Wordmark.tsx`, an inline SVG
rebuild of the owner's logo: GUN in charcoal (`#2f3b41`), a cartridge as the
divider, SPA in gold (`#c9a55a`), and the tagline "Ready? Aim. Relax!" when the
`tagline` prop is set (the footer uses it; the nav does not). In the nav the
charcoal switches to the current text color so it reads on the dark bar; gold
stays gold.

To use the original artwork instead:

1. Add `/public/brand/logo.svg` (preferred) or a 2x PNG such as
   `/public/brand/logo@2x.png` at 400 px tall or more, with a transparent
   background. If the artwork is only available in one color scheme, also
   supply a light-on-dark version for the nav.
2. Swap the internals of `Wordmark.tsx` to render that file (an `<img>` or
   `next/image`), keeping the same rendered height: the component sizes itself
   from the font size it is given (15 px in the nav, 30 px in the footer), so
   the replacement should fill `1em` tall and let its width follow. Keep the
   `Cartridge` export if anything else imports it.

`src/app/icon.svg` is the favicon; replace it with the cartridge mark from the
artwork if you want them to match.
