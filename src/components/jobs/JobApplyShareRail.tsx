"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";

type SharePlatform = {
  id: string;
  label: string;
  brand: string;
  href?: string;
  copyLink?: boolean;
  icon: React.ReactNode;
};

type Props = {
  shareUrl: string;
  jobTitle?: string | null;
};

function openShareWindow(url: string) {
  window.open(url, "_blank", "noopener,noreferrer,width=640,height=640");
}

const iconClass = "h-[18px] w-[18px] fill-current";

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} aria-hidden>
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14C17.174 2.097 15.943 2 14.643 2 11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.833L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} aria-hidden>
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 1.882 4.267 4.335v6.406zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function GmailIcon() {
  // Official multicolor Gmail mark
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
      <path fill="#4285F4" d="M22.56 6.82v10.36c0 .9-.73 1.64-1.64 1.64h-1.91V9.55L12 14.09 4.99 9.55v9.27H3.08c-.9 0-1.64-.73-1.64-1.64V6.82c0-1.36 1.47-2.15 2.53-1.35L12 10.5l7.03-5.03c1.06-.8 2.53-.01 2.53 1.35z" />
      <path fill="#34A853" d="M20.92 18.82h-.91v-7.45l.91-.68v8.13z" />
      <path fill="#FBBC04" d="M3.99 11.37v7.45h-.91V10.69l.91.68z" />
      <path fill="#EA4335" d="M22.56 6.82c0-.34-.08-.66-.23-.93L12 13.05 1.67 5.89a1.9 1.9 0 0 0-.23.93c0 .28.06.54.16.78L12 14.91l10.4-7.31c.1-.24.16-.5.16-.78z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} aria-hidden>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.788.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export function JobApplyShareRail({ shareUrl, jobTitle }: Props) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  const shareText = useMemo(() => {
    const title = String(jobTitle || "this role").trim();
    return `Check out this job opportunity: ${title}`;
  }, [jobTitle]);

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);
  const encodedSubject = encodeURIComponent(jobTitle ? `Job: ${jobTitle}` : "Job opportunity");
  const encodedBody = encodeURIComponent(`${shareText}\n\n${shareUrl}`);

  const copyShareLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  const platforms: SharePlatform[] = useMemo(
    () => [
      {
        id: "facebook",
        label: "Facebook",
        brand: "#1877F2",
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        icon: <FacebookIcon />,
      },
      {
        id: "x",
        label: "X",
        brand: "#000000",
        href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
        icon: <XIcon />,
      },
      {
        id: "email",
        label: "Email",
        brand: "#5B6B76",
        href: `mailto:?subject=${encodedSubject}&body=${encodedBody}`,
        icon: <EmailIcon />,
      },
      {
        id: "linkedin",
        label: "LinkedIn",
        brand: "#0A66C2",
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        icon: <LinkedInIcon />,
      },
      {
        id: "whatsapp",
        label: "WhatsApp",
        brand: "#25D366",
        href: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`,
        icon: <WhatsAppIcon />,
      },
      {
        id: "gmail",
        label: "Gmail",
        brand: "#FFFFFF",
        href: `https://mail.google.com/mail/?view=cm&fs=1&su=${encodedSubject}&body=${encodedBody}`,
        icon: <GmailIcon />,
      },
      {
        id: "telegram",
        label: "Telegram",
        brand: "#229ED9",
        href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
        icon: <TelegramIcon />,
      },
    ],
    [encodedBody, encodedSubject, encodedText, encodedUrl, shareText, shareUrl],
  );

  if (!shareUrl) return null;

  const renderButton = (
    key: string,
    label: string,
    brand: string,
    icon: React.ReactNode,
    onActivate: () => void,
    href?: string,
    index = 0,
  ) => {
    const isHot = hovered === key || (copied && key === "copy");
    const isLight = brand.toLowerCase() === "#ffffff" || brand.toLowerCase() === "#fff";
    const content = (
      <>
        <span
          className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg border border-slate-200/80 bg-white/95 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-slate-700 opacity-0 shadow-sm backdrop-blur-sm transition-all duration-200 group-hover:-translate-x-0.5 group-hover:opacity-100"
          aria-hidden
        >
          {copied && key === "copy" ? "Copied!" : label}
        </span>
        <span
          className="relative flex h-10 w-10 items-center justify-center rounded-[0.9rem] transition-all duration-300 ease-out"
          style={{
            backgroundColor: brand,
            color: isLight ? "#EA4335" : "#fff",
            border: isLight ? "1px solid rgba(15, 28, 36, 0.1)" : "none",
            transform: isHot ? "scale(1.08) translateX(-2px)" : "scale(1)",
            boxShadow: isHot
              ? `0 10px 22px ${isLight ? "rgba(234,67,53,0.28)" : `${brand}55`}`
              : `0 4px 12px ${isLight ? "rgba(15,28,36,0.08)" : `${brand}28`}`,
            filter: isHot ? "brightness(1.05)" : "none",
          }}
        >
          {copied && key === "copy" ? (
            <Check className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
          ) : (
            icon
          )}
        </span>
      </>
    );

    const sharedClass =
      "group relative flex items-center justify-end outline-none focus-visible:ring-2 focus-visible:ring-[#2098C8]/40 focus-visible:ring-offset-2 rounded-[0.9rem]";
    const animStyle = {
      animation: `shareDockIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both`,
      animationDelay: `${0.04 + index * 0.045}s`,
    } as const;

    if (href && !href.startsWith("mailto:")) {
      return (
        <a
          key={key}
          href={href}
          title={label}
          aria-label={label}
          target="_blank"
          rel="noopener noreferrer"
          className={sharedClass}
          style={animStyle}
          onMouseEnter={() => setHovered(key)}
          onMouseLeave={() => setHovered(null)}
          onFocus={() => setHovered(key)}
          onBlur={() => setHovered(null)}
          onClick={(event) => {
            event.preventDefault();
            onActivate();
          }}
        >
          {content}
        </a>
      );
    }

    if (href?.startsWith("mailto:")) {
      return (
        <a
          key={key}
          href={href}
          title={label}
          aria-label={label}
          className={sharedClass}
          style={animStyle}
          onMouseEnter={() => setHovered(key)}
          onMouseLeave={() => setHovered(null)}
          onFocus={() => setHovered(key)}
          onBlur={() => setHovered(null)}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        key={key}
        type="button"
        title={label}
        aria-label={label}
        className={sharedClass}
        style={animStyle}
        onMouseEnter={() => setHovered(key)}
        onMouseLeave={() => setHovered(null)}
        onFocus={() => setHovered(key)}
        onBlur={() => setHovered(null)}
        onClick={onActivate}
      >
        {content}
      </button>
    );
  };

  return (
    <aside
      className="pointer-events-none fixed right-2 top-1/2 z-50 block -translate-y-1/2 sm:right-4 lg:right-5"
      aria-label="Share this job"
    >
      <style>{`
        @keyframes shareDockIn {
          from {
            opacity: 0;
            transform: translateX(12px) scale(0.92);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>

      <div className="pointer-events-auto relative flex flex-col items-end gap-2 rounded-[1.35rem] border border-white/70 bg-white/55 p-2 shadow-[0_18px_50px_rgba(15,28,36,0.12)] ring-1 ring-slate-900/5 backdrop-blur-xl">
        {platforms.map((platform, index) =>
          renderButton(
            platform.id,
            platform.label,
            platform.brand,
            platform.icon,
            () => {
              if (platform.copyLink) {
                void copyShareLink();
                return;
              }
              if (platform.href && !platform.href.startsWith("mailto:")) {
                openShareWindow(platform.href);
              }
            },
            platform.href,
            index,
          ),
        )}

        <div className="my-0.5 h-px w-7 self-center bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

        {renderButton(
          "copy",
          "Copy link",
          "#2098C8",
          <Copy className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />,
          () => {
            void copyShareLink();
          },
          undefined,
          platforms.length,
        )}
      </div>
    </aside>
  );
}
