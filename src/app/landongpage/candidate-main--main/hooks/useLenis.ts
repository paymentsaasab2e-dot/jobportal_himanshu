'use client'
import { useEffect, useRef } from 'react'

export function useLenis() {
  const lenisRef = useRef<any>(null)

  useEffect(() => {
    let lenis: any
    let animationId: number

    const init = async () => {
      try {
        const { default: Lenis } = await import('lenis')
        lenis = new Lenis({
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          touchMultiplier: 2,
          infinite: false,
        })
        lenisRef.current = lenis

        function raf(time: number) {
          lenis.raf(time)
          animationId = requestAnimationFrame(raf)
        }

        animationId = requestAnimationFrame(raf)
      } catch (e) {
        // Lenis not available
      }
    }

    init()

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
      if (lenis) lenis.destroy()
    }
  }, [])

  return lenisRef
}
