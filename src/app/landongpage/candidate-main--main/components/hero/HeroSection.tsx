'use client'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, TrendingUp, Users, DollarSign, Zap, Star, Layers, Search, Sparkles } from 'lucide-react'
import { heroMetrics, candidate, portalRoutes, heroSocialProof } from '@candmain/lib/data'
import { useCountUp } from '@candmain/hooks/useCountUp'
import { useMouseTrack } from '@candmain/hooks/useMouseTrack'

// ─── Particle Canvas ────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      radius: number; opacity: number; color: string
    }> = []

    const colors = ['rgba(40,168,225,', 'rgba(40,168,223,', 'rgba(14,165,233,', 'rgba(56,189,248,']

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    let mouse = { x: -9999, y: -9999 }
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    })

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p, i) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 120) {
          p.vx -= (dx / dist) * 0.02
          p.vy -= (dy / dist) * 0.02
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${p.opacity})`
        ctx.fill()

        particles.slice(i + 1).forEach((p2) => {
          const dx2 = p.x - p2.x
          const dy2 = p.y - p2.y
          const d = Math.sqrt(dx2 * dx2 + dy2 * dy2)
          if (d < 100) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(15,23,42,${0.06 * (1 - d / 100)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}

// ─── Live Metric Card ───────────────────
const metricIcons = [TrendingUp, Users, DollarSign, Zap, Star, Layers]
const metricColors = ['#28A8E1', '#28A8DF', '#0EA5E9', '#10B981', '#38BDF8', '#6366F1']

function LiveMetricCard({
  metric,
  index,
}: {
  metric: (typeof heroMetrics)[0]
  index: number
}) {
  const Icon = metricIcons[index % metricIcons.length]
  const { formatted, ref } = useCountUp({
    end: metric.value,
    duration: 2000 + index * 200,
    decimals: metric.decimals ?? 0,
    prefix: metric.prefix ?? '',
    suffix: metric.suffix,
  })

  return (
    <motion.div
      ref={ref as any}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 + index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-xl p-3.5 bg-white border border-[rgba(15,23,42,0.07)] shadow-card group hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${metricColors[index % metricColors.length]}15` }}
        >
          <Icon
            className="w-3.5 h-3.5"
            style={{ color: metricColors[index % metricColors.length] }}
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="relative flex h-1.5 w-1.5">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: metricColors[index % metricColors.length] }}
            />
            <span
              className="relative inline-flex rounded-full h-1.5 w-1.5"
              style={{ background: metricColors[index % metricColors.length] }}
            />
          </span>
          <span className="text-[10px] font-medium text-text-muted">LIVE</span>
        </div>
      </div>
      <div
        className="text-xl font-bold tracking-tight metric-value mb-1"
        style={{ color: metricColors[index % metricColors.length] }}
      >
        {formatted}
      </div>
      <div className="text-xs text-text-muted font-medium">{metric.label}</div>

      {/* Shimmer on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 shimmer opacity-0 group-hover:opacity-100" />
    </motion.div>
  )
}

// ─── Aurora Background ──────────────────
function AuroraBackground({ mouse }: { mouse: { normalX: number; normalY: number } }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Mesh gradient blobs */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(40,168,225,0.12) 0%, transparent 70%)',
          top: '-10%',
          left: '-5%',
          x: mouse.normalX * -20,
          y: mouse.normalY * -15,
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(40,168,225,0.1) 0%, transparent 70%)',
          top: '20%',
          right: '-5%',
          x: mouse.normalX * 20,
          y: mouse.normalY * 15,
        }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)',
          bottom: '10%',
          left: '30%',
        }}
        animate={{ scale: [1, 1.1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />

      {/* Grid lines */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(15,23,42,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15,23,42,1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  )
}

// ─── Main Hero Section ──────────────────
export default function HeroSection() {
  const mouse = useMouseTrack()
  const [liveTime, setLiveTime] = useState('')

  useEffect(() => {
    const update = () => {
      setLiveTime(new Date().toLocaleTimeString('en-US', { hour12: false }))
    }
    update()
    const id = window.setInterval(update, 15000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20 pb-16">
      <ParticleCanvas />
      <AuroraBackground mouse={mouse} />

      <div className="container-wide relative z-10 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
        {/* Left: Copy */}
        <div>
          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[rgba(15,23,42,0.08)] shadow-card mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            <span className="text-xs font-semibold text-blue-700">{candidate.heroBadge}</span>
            <span className="text-xs text-text-muted">· {candidate.location}</span>
          </motion.div>

          {/* AI Search */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="max-w-xl mb-7"
          >
            <div className="flex items-center gap-3 rounded-2xl bg-white border border-[rgba(15,23,42,0.08)] shadow-card px-4 py-3">
              <div className="w-9 h-9 rounded-xl bg-[rgba(40,168,225,0.08)] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-blue-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <Search className="w-4 h-4 text-text-muted" />
                  <span className="truncate">Ask HR Yantra AI to match jobs to my profile</span>
                </div>
                <div className="text-xs text-text-muted mt-0.5">Explore Jobs · skills fit · salary · location</div>
              </div>
              <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">
                AI Live
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-display-xl text-text-primary mb-5 leading-[1.08]"
          >
            {candidate.heroLine1}{' '}
            <span className="gradient-text-orange">{candidate.heroLine2}</span>
            <br />
            <span className="gradient-text-blue">{candidate.heroAccent}</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="text-base text-text-muted leading-relaxed mb-8 max-w-xl"
          >
            {candidate.subtitle}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
            className="flex flex-wrap gap-3 mb-10"
          >
            <a
              href={portalRoutes.exploreJobs}
              className="flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white rounded-xl transition-all duration-300 hover:shadow-blue-glow hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #28A8E1, #28A8DF)' }}
            >
              {candidate.ctaPrimary}
              <ArrowUpRight className="w-4 h-4" />
            </a>
            <a
              href={portalRoutes.whatsappLogin}
              className="flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-text-primary bg-white border border-[rgba(15,23,42,0.1)] rounded-xl hover:border-[rgba(15,23,42,0.2)] hover:-translate-y-0.5 transition-all duration-300 shadow-card"
            >
              {candidate.ctaSecondary}
            </a>
          </motion.div>

          {/* Social proof strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex items-center gap-6 pt-6 border-t border-[rgba(15,23,42,0.06)]"
          >
            {heroSocialProof.map((item) => (
              <div key={item.label}>
                <div className="text-lg font-bold text-text-primary tracking-tight">{item.value}</div>
                <div className="text-xs text-text-muted">{item.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: Live Dashboard */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-[520px] w-full lg:justify-self-end"
        >
          {/* Dashboard header */}
          <div className="relative rounded-2xl overflow-hidden border border-[rgba(15,23,42,0.08)] shadow-premium bg-white">
            {/* Header bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(15,23,42,0.06)] bg-[#FAFBFC]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#28A8DF]" />
                  <div className="w-3 h-3 rounded-full bg-[#60A5FA]" />
                  <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                </div>
                <span className="ml-2 text-xs font-semibold text-text-muted tracking-wide uppercase">
                  HR Yantra Candidate Dashboard
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs text-emerald-600 font-medium">Live</span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="p-4 grid grid-cols-2 gap-3">
              {heroMetrics.map((metric, i) => (
                <LiveMetricCard key={metric.label} metric={metric} index={i} />
              ))}
            </div>

            {/* Bottom status bar */}
            <div className="px-4 pb-4">
              <div className="rounded-xl bg-[#FAFBFC] border border-[rgba(15,23,42,0.06)] p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Zap className="w-3.5 h-3.5 text-orange-primary" />
                  <span>Portal signals syncing live</span>
                </div>
                <div className="text-xs font-mono text-text-muted">
                  {liveTime}
                </div>
              </div>
            </div>
          </div>

          {/* Floating accent card */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-5 -left-6 glass rounded-2xl p-3 shadow-premium border border-white/60 hidden lg:block"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-blue-primary to-blue-secondary flex items-center justify-center">
                <Star className="w-4 h-4 text-white fill-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-text-primary">94% Role Match</div>
                <div className="text-xs text-text-muted">Senior Product roles</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
            className="absolute -top-5 -right-5 glass rounded-2xl p-3 shadow-premium border border-white/60 hidden lg:block"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[rgba(40,168,225,0.1)] flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-blue-primary" />
              </div>
              <div>
                <div className="text-xs font-bold text-text-primary">12 Recruiter Views</div>
                <div className="text-[10px] text-text-muted">Updated today</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-5 h-8 rounded-full border-2 border-[rgba(15,23,42,0.15)] flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-2 rounded-full bg-text-muted/40" />
        </motion.div>
        <span className="text-[10px] font-medium text-text-muted tracking-widest uppercase">Scroll</span>
      </motion.div>
    </section>
  )
}
