import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { formatDeskDate, listDeskLog } from "@/lib/desk-log";

/**
 * From the desk: three to five dated mono lines written by whoever is on,
 * above the footer. Reads the desk_log table; renders nothing if the table
 * is empty or unreachable, so a database hiccup never blanks the page.
 */
export async function DeskLog() {
  const entries = await listDeskLog().catch(() => []);
  if (entries.length === 0) return null;
  return (
    <Section theme="dark" padded={false} className="border-t border-white/10" aria-labelledby="desk-log-title">
      <Container>
        <div className="grid gap-6 py-12 sm:py-14 lg:grid-cols-[minmax(0,3fr)_minmax(0,9fr)] lg:gap-12">
          <h2 id="desk-log-title" className="t-eyebrow text-mist">
            From the desk
          </h2>
          <ol className="font-mono text-[0.8125rem] leading-relaxed text-snow/90 sm:text-[0.875rem]">
            {entries.map((e) => (
              <li key={e.id} className="flex flex-col gap-1 border-t border-white/10 py-3 first:border-t-0 first:pt-0 sm:flex-row sm:gap-6">
                <time dateTime={e.date} className="tabular shrink-0 text-mist sm:w-28">
                  {formatDeskDate(e.date)}
                </time>
                <span className="min-w-0 flex-1">{e.text}</span>
                <span className="shrink-0 text-mist">
                  <span className="sr-only">Initials </span>
                  {e.initials}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}
