"use client";

import { MotionConfig } from "motion/react";

/**
 * Makes every motion.* animation in the tree honour the OS "reduce motion"
 * setting (transforms are dropped, opacity fades kept), including the reserve
 * flow's step transitions and the mobile menu, which do not check it themselves.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
