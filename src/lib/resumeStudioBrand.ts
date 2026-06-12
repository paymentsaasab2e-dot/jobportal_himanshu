export const SAASA_LOGO_PATH = '/SAASA%20Logo.png';

export function getJobPortalPublicOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  const configured =
    process.env.NEXT_PUBLIC_JOBPORTAL_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL;
  return String(configured || 'http://localhost:3000').replace(/\/$/, '');
}

export function absoluteSaasaLogoUrl(origin?: string): string {
  const base = (origin || getJobPortalPublicOrigin()).replace(/\/$/, '');
  return `${base}${SAASA_LOGO_PATH}`;
}

/** Inline watermark overlay — works without Tailwind (view tab, PDF export). */
export function buildSaasaWatermarkOverlayHtml(logoUrl: string): string {
  const src = logoUrl.replace(/"/g, '&quot;');
  return `<div aria-hidden="true" data-saasa-watermark="center" style="position:absolute;inset:0;pointer-events:none;z-index:20;display:flex;align-items:center;justify-content:center;">
  <img src="${src}" alt="" draggable="false" style="max-height:54%;max-width:70%;object-fit:contain;opacity:0.13;user-select:none;" />
</div>
<div aria-hidden="true" data-saasa-watermark="corner" style="position:absolute;bottom:1.25rem;right:1.25rem;pointer-events:none;z-index:21;">
  <img src="${src}" alt="" draggable="false" style="height:2rem;width:auto;max-width:96px;object-fit:contain;opacity:0.8;user-select:none;" />
</div>`;
}

function htmlHasSaasaWatermark(html: string): boolean {
  return /SAASA%20Logo|SAASA Logo|data-saasa-watermark/i.test(html);
}

/** Rewrite logo paths and guarantee watermark markup for stored studio HTML. */
export function normalizeResumeStudioHtml(
  html: string,
  options?: { origin?: string; ensureWatermark?: boolean },
): string {
  const raw = String(html || '').trim();
  if (!raw) return raw;

  const origin = (options?.origin || getJobPortalPublicOrigin()).replace(/\/$/, '');
  const logoUrl = absoluteSaasaLogoUrl(origin);
  const escapedLogo = logoUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let normalized = raw.replace(
    /src=(["'])(?:\/SAASA%20Logo\.png|\/SAASA Logo\.png)\1/gi,
    `src="${logoUrl}"`,
  );
  normalized = normalized.replace(
    new RegExp(`src=(["'])${escapedLogo}\\1`, 'gi'),
    `src="${logoUrl}"`,
  );

  if (options?.ensureWatermark === false) {
    return normalized;
  }

  if (!htmlHasSaasaWatermark(normalized)) {
    const needsRelativeRoot =
      !/position\s*:\s*relative/i.test(normalized) && !/\brelative\b/.test(normalized);
    if (needsRelativeRoot) {
      normalized = `<div style="position:relative;overflow:hidden;">${normalized}${buildSaasaWatermarkOverlayHtml(logoUrl)}</div>`;
    } else {
      normalized = `${normalized}${buildSaasaWatermarkOverlayHtml(logoUrl)}`;
    }
    return normalized;
  }

  normalized = normalized.replace(
    /<img([^>]*src=["'][^"']*SAASA(?:%20| )Logo\.png[^"']*["'][^>]*)>/gi,
    (tag) => {
      if (/style=/i.test(tag)) {
        return tag.replace(/style=(["'])(.*?)\1/i, (m, q, styles) => {
          const next = String(styles).includes('object-fit')
            ? styles
            : `${styles};object-fit:contain;user-select:none;`;
          return `style=${q}${next}${q}`;
        });
      }
      return tag.replace(
        /<img/i,
        '<img style="object-fit:contain;user-select:none;"',
      );
    },
  );

  return normalized;
}

export function wrapResumeStudioHtmlDocument(
  html: string,
  title = 'CV',
  options?: { origin?: string },
): string {
  const origin = (options?.origin || getJobPortalPublicOrigin()).replace(/\/$/, '');
  const safeTitle = String(title || 'CV').replace(/[<>"']/g, '');
  const body = normalizeResumeStudioHtml(html, { origin, ensureWatermark: true });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <base href="${origin}/" />
  <script src="https://cdn.tailwindcss.com"></script>
  <title>${safeTitle}</title>
  <style>
    html, body { margin: 0; padding: 0; background: #e2e8f0; }
    body { min-height: 100%; }
    .resume-studio-preview-root {
      box-sizing: border-box;
      max-width: 52rem;
      margin: 0 auto;
      padding: 1rem;
    }
    .resume-studio-preview-root * { box-sizing: border-box; }
  </style>
</head>
<body>
  <div class="resume-studio-preview-root">${body}</div>
</body>
</html>`;
}
