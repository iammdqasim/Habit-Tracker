import { useMemo } from 'react'
import { motion } from 'framer-motion'

const COLORS = ['#10b981', '#22d3ee', '#fbbf24', '#f472b6', '#818cf8', '#fb923c', '#f8fafc']

/** One-shot full-screen fireworks burst. */
export function Confetti({ count = 96 }: { count?: number }) {
  const bursts = useMemo(() => {
    const origins = [
      { x: 16, y: 25 },
      { x: 84, y: 22 },
      { x: 50, y: 15 },
      { x: 28, y: 68 },
      { x: 72, y: 62 },
    ]

    return Array.from({ length: count }, (_, i) => {
      const origin = origins[i % origins.length]
      return {
        id: i,
        originX: origin.x + (Math.random() - 0.5) * 10,
        originY: origin.y + (Math.random() - 0.5) * 8,
        angle: Math.random() * 360,
        dist: 55 + Math.random() * 180,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 0.35,
        duration: 1.1 + Math.random() * 1,
        size: 4 + Math.random() * 7,
      }
    })
  }, [count])

  return (
    <div className="pointer-events-none fixed inset-0 z-[101] overflow-hidden">
      {bursts.map((b) => {
        const x = Math.cos((b.angle * Math.PI) / 180) * b.dist
        const y = Math.sin((b.angle * Math.PI) / 180) * b.dist + 80
        return (
          <motion.span
            key={b.id}
            className="absolute rounded-full"
            style={{
              left: `${b.originX}%`,
              top: `${b.originY}%`,
              width: b.size,
              height: b.size,
              background: b.color,
              boxShadow: `0 0 10px ${b.color}`,
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.2, rotate: 0 }}
            animate={{
              x: [0, x * 0.55, x],
              y: [0, y - 90, y],
              opacity: [0, 1, 1, 0],
              scale: [0.2, 1.15, 0.9, 0.25],
              rotate: 180 + Math.random() * 540,
            }}
            transition={{
              duration: b.duration,
              ease: [0.12, 0.65, 0.24, 1],
              delay: b.delay,
            }}
          />
        )
      })}
    </div>
  )
}