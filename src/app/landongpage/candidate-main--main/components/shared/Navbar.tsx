'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ArrowUpRight } from 'lucide-react'
import { candidate, portalRoutes } from '@candmain/lib/data'

const navLinks = [
  { label: 'Features', href: '#case-studies' },
  { label: 'Portal Stats', href: '#impact' },
  { label: 'Job Sectors', href: '#skills' },
  { label: 'How It Works', href: '#experience' },
  { label: 'Why HR Yantra', href: '#why-hire' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'py-3 bg-white/80 backdrop-blur-glass border-b border-border-subtle shadow-sm'
            : 'py-5 bg-transparent'
        }`}
      >
        <div className="container flex items-center justify-between">
          {/* Logo */}
          <a href={portalRoutes.home} className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-orange-blue flex items-center justify-center shadow-orange-glow">
              <span className="text-white font-bold text-sm">{candidate.shortName}</span>
            </div>
            <span className="font-semibold text-text-primary tracking-tight">
              {candidate.name}
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-primary rounded-lg hover:bg-black/[0.03] transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              500+ Live Jobs
            </span>
            <a
              href={portalRoutes.exploreJobs}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-text-primary rounded-lg hover:bg-opacity-90 transition-all duration-200 hover:shadow-lg"
            >
              {candidate.ctaPrimary}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-black/[0.05] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="fixed top-16 left-4 right-4 z-40 glass rounded-2xl p-6 shadow-premium md:hidden"
          >
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-sm font-medium text-text-primary hover:bg-black/[0.04] rounded-xl transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-4 pt-4 border-t border-border-subtle">
                <a
                  href={portalRoutes.exploreJobs}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-white bg-text-primary rounded-xl"
                >
                  {candidate.ctaPrimary} <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
