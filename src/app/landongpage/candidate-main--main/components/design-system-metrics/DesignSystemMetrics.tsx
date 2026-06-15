'use client'
import { motion } from 'framer-motion'
import { designSystemMetrics } from '@candmain/lib/data'
import { useCountUp } from '@candmain/hooks/useCountUp'
import { CheckCircle2, Layers, Palette, Shield, Users, Zap } from 'lucide-react'

const dsIcons = [Layers, Zap, Palette, Shield, CheckCircle2, Users]

function DSMetricCard({
  metric,
  index,
}: {
  metric: (typeof designSystemMetrics)[0]
  index: number
}) {
  const { formatted, ref } = useCountUp({
    end: metric.value,
    duration: 2200 + index * 200,
    suffix: metric.suffix,
  })
  const Icon = dsIcons[index % dsIcons.length]

  return (
    <motion.div
      ref={ref as any}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="p-5 rounded-2xl bg-white border border-[rgba(15,23,42,0.07)] shadow-card hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300 text-center group"
    >
      <div
        className="w-10 h-10 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
        style={{ background: `${metric.color}12` }}
      >
        <Icon className="w-5 h-5" style={{ color: metric.color }} />
      </div>
      <div
        className="text-3xl font-black tracking-tight metric-value mb-1"
        style={{ color: metric.color }}
      >
        {formatted}
      </div>
      <div className="text-xs font-medium text-text-muted">{metric.label}</div>

      {/* Progress bar */}
      {metric.suffix === '%' && (
        <div className="mt-3 h-1 bg-[rgba(15,23,42,0.05)] rounded-full overflow-hidden">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: metric.value / 100 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 + index * 0.08, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ background: metric.color, transformOrigin: 'left' }}
            className="h-full rounded-full"
          />
        </div>
      )}
    </motion.div>
  )
}

const dsFeatures = [
  { title: 'AI Profile Optimization', desc: 'Real-time AI analysis maps your resume to 12K+ active job postings with 92% match accuracy', icon: '🤖' },
  { title: 'Multi-Industry Coverage', desc: 'Profiles indexed across Engineering, Design, Data, Product, Finance, Healthcare, and 7 more fields', icon: '🌐' },
  { title: 'ATS Compatibility Check', desc: 'Automated scoring against 50+ top ATS systems including Greenhouse, Lever, and Workday', icon: '✅' },
  { title: 'Live Career Analytics', desc: 'Bloomberg-grade live dashboards tracking recruiter views, interviews, offers, and career growth KPIs', icon: '📊' },
]

export default function DesignSystemMetrics() {
  return (
    <section className="section animated-gradient-bg" id="design-system">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="tag-pill tag-blue inline-flex mb-4">
            <span>Career Intelligence Platform</span>
          </div>
          <h2 className="text-display-xl text-text-primary mb-4">
            Platform{' '}
            <span className="gradient-text-blue">Performance Metrics</span>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            HR Yantra tracks measurable portal outcomes — profile completion, ATS scores, applications, and interview readiness across real candidate journeys.
          </p>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {designSystemMetrics.map((metric, i) => (
            <DSMetricCard key={metric.label} metric={metric} index={i} />
          ))}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dsFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="p-5 rounded-2xl bg-white border border-[rgba(15,23,42,0.07)] shadow-card"
            >
              <div className="text-2xl mb-3">{feature.icon}</div>
              <h4 className="font-bold text-text-primary text-sm mb-2">{feature.title}</h4>
              <p className="text-xs text-text-muted leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
