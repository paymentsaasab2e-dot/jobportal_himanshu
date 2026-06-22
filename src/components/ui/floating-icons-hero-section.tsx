"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface IconProps {
  id: number;
  className: string;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  imageSrc?: string;
  imageAlt?: string;
}

export interface FloatingIconsHeroProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  icons: IconProps[];
  variant?: "light" | "dark";
  iconPresentation?: "tile" | "brand3d";
  size?: "default" | "compact";
}

const tileStyles = {
  light:
    "border-slate-200/90 bg-white/90 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur-md",
  dark: "border-border/10 bg-card/80 shadow-xl backdrop-blur-md",
} as const;

const iconStyles = {
  light: "text-indigo-600",
  dark: "text-foreground",
} as const;

const Icon = ({
  mouseX,
  mouseY,
  iconData,
  index,
  variant,
  iconPresentation,
}: {
  mouseX: React.MutableRefObject<number>;
  mouseY: React.MutableRefObject<number>;
  iconData: IconProps;
  index: number;
  variant: "light" | "dark";
  iconPresentation: "tile" | "brand3d";
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });
  const floatDuration = 5 + (index % 5);

  React.useEffect(() => {
    const handleMouseMove = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.hypot(mouseX.current - centerX, mouseY.current - centerY);

      if (distance < 150) {
        const angle = Math.atan2(mouseY.current - centerY, mouseX.current - centerX);
        const force = (1 - distance / 150) * 50;
        x.set(-Math.cos(angle) * force);
        y.set(-Math.sin(angle) * force);
      } else {
        x.set(0);
        y.set(0);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [x, y, mouseX, mouseY]);

  const IconComponent = iconData.icon;
  const isBrand3d = iconPresentation === "brand3d";
  const isBrand3dImage = isBrand3d && Boolean(iconData.imageSrc);
  const isBrand3dComponent = isBrand3d && Boolean(IconComponent) && !iconData.imageSrc;

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: index * 0.08,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn("absolute", iconData.className)}
    >
      <motion.div
        className={cn(
          isBrand3d
            ? "flex h-11 w-11 items-center justify-center md:h-14 md:w-14"
            : cn(
                "flex h-16 w-16 items-center justify-center rounded-3xl border p-3 md:h-20 md:w-20",
                tileStyles[variant],
              ),
        )}
        animate={{
          y: [0, -6, 0, 6, 0],
          x: [0, 4, 0, -4, 0],
          rotate: isBrand3d ? [0, 3, 0, -3, 0] : [0, 5, 0, -5, 0],
        }}
        transition={{
          duration: floatDuration,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      >
        {isBrand3dImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={iconData.imageSrc}
            alt={iconData.imageAlt ?? ""}
            draggable={false}
            loading="lazy"
            className="h-full w-full select-none object-contain drop-shadow-[0_16px_28px_rgba(15,23,42,0.22)]"
          />
        ) : isBrand3dComponent ? (
          <IconComponent className="h-full w-full" />
        ) : IconComponent ? (
          <IconComponent className={cn("h-8 w-8 md:h-10 md:w-10", iconStyles[variant])} />
        ) : null}
      </motion.div>
    </motion.div>
  );
};

const FloatingIconsHero = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & FloatingIconsHeroProps
>(({ className, title, subtitle, ctaText, ctaHref, icons, variant = "light", iconPresentation = "tile", size = "default", ...props }, ref) => {
  const mouseX = React.useRef(0);
  const mouseY = React.useRef(0);
  const isLight = variant === "light";
  const isCompact = size === "compact";

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    mouseX.current = event.clientX;
    mouseY.current = event.clientY;
  };

  return (
    <section
      ref={ref}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden bg-background",
        isCompact ? "h-auto min-h-[480px] py-12" : "h-screen min-h-[700px]",
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 h-full w-full">
        {icons.map((iconData, index) => (
          <Icon
            key={iconData.id}
            mouseX={mouseX}
            mouseY={mouseY}
            iconData={iconData}
            index={index}
            variant={variant}
            iconPresentation={iconPresentation}
          />
        ))}
      </div>

      <div className="relative z-10 px-4 text-center">
        <h1
          className={cn(
            "bg-clip-text font-bold tracking-tight text-transparent",
            isCompact ? "text-3xl md:text-4xl lg:text-5xl" : "text-5xl md:text-7xl",
            isLight
              ? "bg-linear-to-b from-slate-900 to-slate-600"
              : "bg-linear-to-b from-foreground to-foreground/70",
          )}
        >
          {title}
        </h1>
        <p
          className={cn(
            "mx-auto max-w-xl",
            isCompact ? "mt-4 text-base" : "mt-6 text-lg",
            isLight ? "text-slate-600" : "text-muted-foreground",
          )}
        >
          {subtitle}
        </p>
        <div className={isCompact ? "mt-6" : "mt-10"}>
          <a
            href={ctaHref}
            className={cn(
              isLight
                ? cn(
                    "inline-flex h-auto items-center justify-center rounded-full bg-linear-to-r from-indigo-600 to-purple-600 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(99,102,241,0.3)]",
                    isCompact ? "px-7 py-3 text-sm" : "px-8 py-3.5 text-base",
                  )
                : cn(buttonVariants({ size: "lg" }), "inline-flex h-auto px-8 py-3 text-base font-semibold"),
            )}
          >
            {ctaText}
          </a>
        </div>
      </div>
    </section>
  );
});

FloatingIconsHero.displayName = "FloatingIconsHero";

export { FloatingIconsHero };
