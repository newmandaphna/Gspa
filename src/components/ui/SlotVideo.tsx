"use client";

import { useEffect, useState } from "react";

type Props = {
  mp4?: string;
  webm?: string;
  poster?: string;
  /** The still layer (photo or art) that sits under the video and stands in for it. */
  children: React.ReactNode;
};

/**
 * A silent looping clip over a still. The still is in the server HTML, so the
 * frame paints before any script runs; the <video> is added after mount and
 * only when the viewer has not asked for reduced motion or data saving, in
 * which case the still is all they get. No controls, no sound, no autoplay
 * policy to negotiate: muted inline video is allowed everywhere.
 */
export function SlotVideo({ mp4, webm, poster, children }: Props) {
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (!mp4 && !webm) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    const decide = () => setPlay(!reduce.matches && !nav.connection?.saveData);
    decide();
    reduce.addEventListener("change", decide);
    return () => reduce.removeEventListener("change", decide);
  }, [mp4, webm]);

  return (
    <>
      {children}
      {play && (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          preload="metadata"
          poster={poster}
          aria-hidden="true"
          tabIndex={-1}
        >
          {webm && <source src={webm} type="video/webm" />}
          {mp4 && <source src={mp4} type="video/mp4" />}
        </video>
      )}
    </>
  );
}
