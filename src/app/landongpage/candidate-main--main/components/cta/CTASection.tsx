'use client'
import { motion } from 'framer-motion'
import { ArrowUpRight, Mail, Linkedin, Twitter, Calendar } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useCandmainLandingContent } from '@/lib/candmain-landing'
import { AppLocale, localizePath } from '@/lib/i18n'
import { candidate } from '@candmain/lib/data'

export default function CTASection() {
  const content = useCandmainLandingContent()
  const c = content.cta
  const locale = useLocale() as AppLocale

  return (
    <section className="section relative overflow-hidden" id="cta">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAFBFC] via-white to-[#F0F4FF]" />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.06, 0.1, 0.06] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,1) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,1) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[rgba(15,23,42,0.08)] shadow-card mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            <span className="text-xs font-semibold text-blue-700">{c.badge}</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-display-2xl text-text-primary mb-6"
          >
            {c.tagline}{' '}
            <span className="gradient-text-mixed">{c.accent}</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg text-text-muted leading-relaxed mb-12"
          >
            {c.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-2 mb-12"
          >
            {c.roles.map((role) => (
              <span key={role} className="tag-pill tag-neutral text-xs">
                {role}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="flex flex-wrap justify-center gap-3 mb-12"
          >
            <a
              href={localizePath('/explore-jobs', locale)}
              className="group flex items-center gap-3 px-8 py-4 text-white font-semibold rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-blue-glow text-base"
              style={{ background: 'linear-gradient(135deg, #28A8E1, #28A8DF)' }}
            >
              {c.exploreJobs}
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
            <a
              href={localizePath('/whatsapp', locale)}
              className="flex items-center gap-3 px-8 py-4 text-text-primary font-semibold rounded-2xl border border-[rgba(15,23,42,0.12)] hover:border-[rgba(15,23,42,0.22)] bg-white hover:-translate-y-1 transition-all duration-300 shadow-card text-base"
            >
              <Calendar className="w-5 h-5" />
              {c.whatsappLogin}
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex justify-center gap-4"
          >
            {[
              { icon: Linkedin, label: 'LinkedIn', href: candidate.linkedin, color: '#0A66C2' },
              { icon: Twitter, label: 'Twitter', href: candidate.twitter, color: '#1DA1F2' },
              { icon: Mail, label: 'Email', href: `mailto:${candidate.email}`, color: '#FF6B35' },
            ].map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-11 h-11 rounded-2xl bg-white border border-[rgba(15,23,42,0.08)] shadow-card flex items-center justify-center hover:-translate-y-1 hover:shadow-premium transition-all duration-200 group"
              >
                <Icon className="w-4.5 h-4.5 text-text-muted group-hover:text-text-primary transition-colors" />
              </a>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
