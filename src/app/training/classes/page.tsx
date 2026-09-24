import type { Metadata } from "next";
import { Suspense } from "react";
import { ClassSchedule } from "@/components/classes/ClassSchedule";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
export const metadata: Metadata = { title: "Scheduled Classes | Gun Spa", description: "Browse and reserve scheduled instruction at Gun Spa." };
export default function ClassesPage() { return <Section theme="light" className="pt-[calc(var(--nav-h)+3rem)]"><Container><Suspense fallback={<p role="status">Loading class schedule…</p>}><ClassSchedule /></Suspense></Container></Section>; }