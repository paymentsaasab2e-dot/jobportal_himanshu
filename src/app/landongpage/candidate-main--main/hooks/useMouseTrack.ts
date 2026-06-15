'use client'
import { useState, useEffect, useCallback } from 'react'

export function useMouseTrack() {
  const [mouse, setMouse] = useState({ x: 0, y: 0, normalX: 0, normalY: 0 })

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMouse({
      x: e.clientX,
      y: e.clientY,
      normalX: (e.clientX / window.innerWidth - 0.5) * 2,
      normalY: (e.clientY / window.innerHeight - 0.5) * 2,
    })
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  return mouse
}
