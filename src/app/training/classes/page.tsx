import type { Metadata } from "next";
import { ClassSchedule } from "@/components/classes/ClassSchedule";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
export const metadata: Metadata = { title: "Scheduled Classes | Gun Spa", description: "Browse and reserve scheduled instruction at Gun Spa." };
export default function ClassesPage() { return <Section theme="light" className="pt-[calc(var(--nav-h)+3rem)]"><Container><ClassSchedule /></Container></Section>; }