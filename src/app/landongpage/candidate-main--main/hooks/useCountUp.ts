'use client'
import { useState, useEffect, useRef } from 'react'

interface CountUpOptions {
  start?: number
  end: number
  duration?: number
  decimals?: number
  separator?: string
  prefix?: string
  suffix?: string
  triggerOnView?: boolean
}

export function useCountUp({
  start = 0,
  end,
  duration = 2000,
  decimals = 0,
  prefix = '',
  suffix = '',
  triggerOnView = true,
}: CountUpOptions) {
  const [count, setCount] = useState(start)
  const [hasTriggered, setHasTriggered] = useState(!triggerOnView)
  const ref = useRef<HTMLElement>(null)
  const frameRef = useRef<number | undefined>(undefined)
  const startTimeRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!triggerOnView) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered) {
          setHasTriggered(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [triggerOnView, hasTriggered])

  useEffect(() => {
    if (!hasTriggered) return

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(progress)
      const currentValue = start + (end - start) * easedProgress

      setCount(parseFloat(currentValue.toFixed(decimals)))

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [hasTriggered, start, end, duration, decimals])

  const formatted = `${prefix}${decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString()}${suffix}`

  return { count, formatted, ref }
}
