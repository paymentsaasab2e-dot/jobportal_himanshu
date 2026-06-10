'use client';

import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { SaButton } from '@/components/sa/ui/button';
import { SaDashboardPreview } from '@/components/sa/SaDashboardPreview';

const NAV_LINKS = ['Home', 'Pricing', 'About', 'Contact'] as const;

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4';

export function SaLandingPage() {
  return (
    <div className="sa-landing fixed inset-0 z-40 flex h-screen flex-col overflow-hidden bg-background">
      <nav className="relative z-10 flex shrink-0 items-center justify-between px-6 py-5 font-body md:px-12 lg:px-20">
        <div className="text-xl font-semibold tracking-tight text-foreground">✦ Nexora</div>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a key={link} href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {link}
            </a>
          ))}
          <SaButton className="px-5 text-sm font-medium">Get started</SaButton>
        </div>

        <SaButton className="px-5 text-sm font-medium md:hidden">Get started</SaButton>
      </nav>

      <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <video
          className="absolute inset-0 z-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>

        <div className="relative z-10 flex w-full flex-col items-center overflow-hidden px-6 pb-0 pt-2 md:px-12 lg:px-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 text-sm text-muted-foreground font-body"
          >
            Now with GPT-5 support ✨
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-xl text-center font-display text-5xl leading-[0.95] tracking-tight text-foreground md:text-6xl lg:text-[5rem]"
          >
            The Future of <em className="font-display italic">Smarter</em> Automation
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 max-w-[650px] text-center text-base leading-relaxed text-muted-foreground font-body md:text-lg"
          >
            Automate your busywork with intelligent agents that learn, adapt, and execute—so your team can focus on
            what matters most.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-5 flex items-center gap-3"
          >
            <SaButton className="px-6 py-5 text-sm font-medium font-body">Book a demo</SaButton>
            <SaButton
              variant="ghost"
              aria-label="Play video"
              className="h-11 w-11 border-0 bg-background shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:bg-background/80"
            >
              <Play className="h-4 w-4 fill-foreground text-foreground" />
            </SaButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-8 w-full max-w-5xl"
          >
            <div
              className="overflow-hidden rounded-2xl p-3 md:p-4"
              style={{
                background: 'rgba(255, 255, 255, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: 'var(--shadow-dashboard)',
              }}
            >
              <SaDashboardPreview />
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
