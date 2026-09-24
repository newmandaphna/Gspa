import { serializeJsonLd } from "@/lib/seo/jsonld";

/** One application/ld+json script tag. Renders nothing for a null record. */
export function JsonLd({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
