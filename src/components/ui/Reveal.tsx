"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";

type Kind = "text" | "image";

/** Rise distance per kind: text barely moves, imagery travels, so the two read differently. */
const DISTANCE: Record<Kind, number> = { text: 12, image: 40 };

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Override the rise distance in px. Prefer `kind`. */
  y?: number;
  /** "text" (12 px) or "image" (40 px). */
  kind?: Kind;
  once?: boolean;
  as?: "div" | "section" | "li" | "span" | "p" | "h1" | "h2" | "h3";
};

/**
 * Fade-and-rise on scroll. Do not wrap hero type in it: the initial opacity
 * is serialized into the HTML, so anything inside stays invisible until the
 * bundle hydrates. Heroes use the CSS-only `.enter` class from globals.css
 * instead.
 *
 * prefers-reduced-motion is honoured by MotionConfig (reducedMotion="user"
 * in MotionProvider), which drops the rise and keeps the fade. It is never
 * read here: useReducedMotion is null on the server and true on a
 * reduced-motion client, so gating `initial` on it makes the server write
 * opacity 0 and the client never animate it away. The content stayed blank.
 */
export function Reveal({ children, className, delay = 0, y, kind = "text", once = true, as = "div" }: Props) {
  const Tag = motion[as];
  const distance = y ?? DISTANCE[kind];
  return (
    <Tag
      className={cn(className)}
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "0px 0px -10% 0px" }}
      transition={{ duration: kind === "image" ? 0.9 : 0.7, delay, ease: [0.28, 0.11, 0.32, 1] }}
    >
      {children}
    </Tag>
  );
}

/** Staggers direct children. Wrap items in <Reveal> or use <Stagger><Item/></Stagger>. */
export function Stagger({ children, className, gap = 0.08 }: { children: React.ReactNode; className?: string; gap?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function Item({ children, className, y, kind = "text" }: { children: React.ReactNode; className?: string; y?: number; kind?: Kind }) {
  const distance = y ?? DISTANCE[kind];
  return (
    <motion.div
      className={className}
      variants={{ hidden: { opacity: 0, y: distance }, show: { opacity: 1, y: 0, transition: { duration: kind === "image" ? 0.9 : 0.7, ease: [0.28, 0.11, 0.32, 1] } } }}
    >
      {children}
    </motion.div>
  );
}
