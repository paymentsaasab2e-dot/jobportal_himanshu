"use client";

import React, { useEffect, useRef, useState } from "react";

const STAGGER_S = 0.02;
const DURATION_S = 0.55;

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "span";

export type BlurRevealLine = {
  text: string;
  className?: string;
  lineClassName?: string;
  charClassName?: string;
  charStyle?: React.CSSProperties;
};

function useRevealActive(triggerOnView: boolean) {
  const ref = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(!triggerOnView);

  useEffect(() => {
    if (!triggerOnView) {
      setActive(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [triggerOnView]);

  return { ref, active };
}

export function BlurRevealText({
  text,
  as: Tag = "span",
  className = "",
  charClassName = "",
  charStyle,
  startIndex = 0,
  active,
}: {
  text: string;
  as?: HeadingTag;
  className?: string;
  charClassName?: string;
  charStyle?: React.CSSProperties;
  startIndex?: number;
  active: boolean;
}) {
  return (
    <Tag className={className} aria-label={text}>
      {text.split("").map((char, index) => (
        <span
          key={`${startIndex + index}-${char}`}
          aria-hidden="true"
          className={`inline-block ${charClassName}`}
          style={{
            ...charStyle,
            opacity: active ? 1 : 0.5,
            filter: active ? "blur(0px)" : "blur(5px)",
            transition: `opacity ${DURATION_S}s ease, filter ${DURATION_S}s ease`,
            transitionDelay: active ? `${(startIndex + index) * STAGGER_S}s` : "0s",
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </Tag>
  );
}

export function BlurRevealHeading({
  as: Tag = "h2",
  className = "",
  lines,
  triggerOnView = true,
}: {
  as?: "h1" | "h2" | "h3" | "h4";
  className?: string;
  lines: BlurRevealLine[];
  triggerOnView?: boolean;
}) {
  const { ref, active } = useRevealActive(triggerOnView);

  let charOffset = 0;

  return (
    <Tag ref={ref as React.RefObject<HTMLHeadingElement>} className={className}>
      {lines.map((line, lineIndex) => {
        const startIndex = charOffset;
        charOffset += line.text.length;

        return (
          <span
            key={`${lineIndex}-${line.text}`}
            className={line.lineClassName ?? ""}
          >
            <BlurRevealText
              as="span"
              text={line.text}
              className={line.className}
              charClassName={line.charClassName}
              charStyle={line.charStyle}
              startIndex={startIndex}
              active={active}
            />
          </span>
        );
      })}
    </Tag>
  );
}
