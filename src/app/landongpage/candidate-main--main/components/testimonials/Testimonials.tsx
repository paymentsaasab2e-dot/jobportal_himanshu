'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { testimonials } from '@candmain/lib/data'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'

function TestimonialCard({ testimonial }: { testimonial: (typeof testimonials)[0] }) {
  const initials = testimonial.name.split(' ').map((n) => n[0]).join('')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-3xl bg-white border border-[rgba(15,23,42,0.08)] shadow-premium p-10"
    >
      {/* Quote mark */}
      <div className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-gradient-orange-blue flex items-center justify-center opacity-10">
        <Quote className="w-6 h-6 text-white" />
      </div>

      {/* Stars */}
      <div className="flex gap-1 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className="w-5 h-5 fill-orange-primary text-orange-primary"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Quote */}
      <blockquote className="text-lg font-medium text-text-primary leading-relaxed mb-8">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-orange-blue flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {initials}
        </div>
        <div>
          <div className="font-bold text-text-primary">{testimonial.name}</div>
          <div className="text-sm text-text-muted">{testimonial.title}</div>
          <div className="text-xs font-semibold text-orange-primary">{testimonial.company}</div>
        </div>
      </div>
    </motion.div>
  )
}

export default function Testimonials() {
  const [current, setCurrent] = useState(0)

  const prev = () => setCurrent((i) => (i === 0 ? testimonials.length - 1 : i - 1))
  const next = () => setCurrent((i) => (i + 1) % testimonials.length)

  return (
    <section className="section" id="testimonials">
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
            <span>Executive Endorsements</span>
          </div>
          <h2 className="text-display-xl text-text-primary mb-4">
            What{' '}
            <span className="gradient-text-blue">Leaders Say</span>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            From CEOs to Heads of Engineering. Real perspectives from the
            people who&apos;ve seen the impact firsthand.
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <TestimonialCard
              key={testimonials[current].id}
              testimonial={testimonials[current]}
            />
          </AnimatePresence>

          {/* Controls */}
          <div className="flex items-center justify-between mt-8">
            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === current
                      ? 'w-8 bg-orange-primary'
                      : 'w-2 bg-[rgba(15,23,42,0.15)]'
                  }`}
                />
              ))}
            </div>

            {/* Arrows */}
            <div className="flex gap-2">
              <button
                onClick={prev}
                className="w-10 h-10 rounded-xl border border-[rgba(15,23,42,0.1)] flex items-center justify-center hover:border-orange-primary hover:text-orange-primary transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={next}
                className="w-10 h-10 rounded-xl border border-[rgba(15,23,42,0.1)] flex items-center justify-center hover:border-orange-primary hover:text-orange-primary transition-all duration-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom social proof bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-6 py-6 border-t border-[rgba(15,23,42,0.06)]"
        >
          {[
            { label: 'Executive References', value: '12+' },
            { label: 'Average NPS Across Roles', value: '+68' },
            { label: 'Teams Mentored', value: '4' },
            { label: 'Cross-functional Orgs', value: '6' },
          ].map((item) => (
            <div key={item.label} className="text-center px-6">
              <div className="text-2xl font-black gradient-text-orange">{item.value}</div>
              <div className="text-xs text-text-muted font-medium mt-1">{item.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
