'use client'
import { ArrowUpRight, Mail } from 'lucide-react'
import { candidate, portalRoutes } from '@candmain/lib/data'

export default function Footer() {
  return (
    <footer className="py-10 bg-[#0F172A] text-white/50">
      <div className="container flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-orange-blue flex items-center justify-center">
            <span className="text-white font-bold text-xs">{candidate.shortName}</span>
          </div>
          <span className="text-sm font-semibold text-white">{candidate.name}</span>
          <span className="text-white/20">·</span>
          <span className="text-xs">{candidate.title}</span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <a href={portalRoutes.exploreJobs} className="hover:text-white transition-colors">Explore Jobs</a>
          <a href={portalRoutes.dashboard} className="hover:text-white transition-colors">Dashboard</a>
          <a href={portalRoutes.contact} className="hover:text-white transition-colors">Contact</a>
          <a href={portalRoutes.whatsappLogin} className="flex items-center gap-1 hover:text-white transition-colors">
            <Mail className="w-3 h-3" />
            Sign in
          </a>
        </div>

        <div className="text-xs">
          © {new Date().getFullYear()} {candidate.name}. AI-powered candidate portal — Phase 1.
        </div>
      </div>
    </footer>
  )
}
