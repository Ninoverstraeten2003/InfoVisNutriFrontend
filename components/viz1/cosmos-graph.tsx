'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { Nutrient, NutrientLink, Food, NUTRIENT_FAMILY_COLORS } from '@/lib/viz1-cosmos-model'

interface PlanetNode {
  id: string
  nutrient: Nutrient
  link: NutrientLink
  x: number
  y: number
  radius: number
  angle: number
  orbitRadius: number
}

interface FoodDot {
  food: Food
  x: number
  y: number
  radius: number
  opacity: number
  angle: number
}

interface Tooltip {
  x: number
  y: number
  content: TooltipContent
}

type TooltipContent =
  | { type: 'planet'; nutrient: Nutrient; link: NutrientLink }
  | { type: 'food'; food: Food; nutrient: Nutrient }
  | { type: 'center'; nutrient: Nutrient }

interface Props {
  nutrients: Nutrient[]
  selectedNutrientId: string
  onSelectNutrient: (id: string) => void
}

const STAR_COUNT = 180
const SUN_RADIUS = 48
const ORBIT_RADIUS_BASE = 200
const ORBIT_RADIUS_STEP = 40
const FOOD_ORBIT_RADIUS = 38
const PARTICLE_SPEED = 0.004

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

export default function CosmosGraph({ nutrients, selectedNutrientId, onSelectNutrient }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const tickRef = useRef(0)
  const starsRef = useRef<Array<{ x: number; y: number; r: number; op: number; speed: number }>>([])
  const hoveredPlanetRef = useRef<string | null>(null)
  const hoveredFoodRef = useRef<string | null>(null)
  const clickedPlanetRef = useRef<string | null>(null)
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })
  const planetNodesRef = useRef<PlanetNode[]>([])
  const foodDotsRef = useRef<Map<string, FoodDot[]>>(new Map())
  const foodExpandRef = useRef<Map<string, number>>(new Map()) // 0-1 expand animation
  const transitionRef = useRef({ active: false, progress: 0, fromId: '', toId: '' })

  // Init stars
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    setDims({ w, h })
    starsRef.current = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.2,
      op: Math.random() * 0.7 + 0.1,
      speed: Math.random() * 0.003 + 0.001,
    }))
  }, [])

  // Recompute planet nodes when selection changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    const cx = w / 2
    const cy = h / 2

    const nutrient = nutrients.find(n => n.id === selectedNutrientId)
    if (!nutrient) return

    // Sort links by strength desc
    const sorted = [...nutrient.links].sort((a, b) => b.strength - a.strength)

    const nodes: PlanetNode[] = sorted.map((link, i) => {
      const angle = (i / sorted.length) * Math.PI * 2 - Math.PI / 2
      const orbitRadius = ORBIT_RADIUS_BASE + Math.floor(i / 8) * ORBIT_RADIUS_STEP
      const foodCount = link.foods.length
      const radius = 10 + foodCount * 2.5
      return {
        id: link.targetId,
        nutrient: nutrients.find(n => n.id === link.targetId) || nutrient,
        link,
        x: cx + Math.cos(angle) * orbitRadius,
        y: cy + Math.sin(angle) * orbitRadius,
        radius: Math.min(radius, 28),
        angle,
        orbitRadius,
      }
    })

    planetNodesRef.current = nodes
    foodDotsRef.current = new Map()
    foodExpandRef.current = new Map()
  }, [dims, nutrients, selectedNutrientId])

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(() => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      canvas.width = w * window.devicePixelRatio
      canvas.height = h * window.devicePixelRatio
      setDims({ w, h })
    })
    observer.observe(canvas)
    // Initial size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    return () => observer.disconnect()
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const cx = w / 2
    const cy = h / 2
    tickRef.current += 1
    const t = tickRef.current

    // Clear background
    ctx.clearRect(0, 0, w, h)


    const selectedNutrient = nutrients.find(n => n.id === selectedNutrientId)
    if (!selectedNutrient) return

    const nodes = planetNodesRef.current

    // Slowly rotate all planets
    const orbitAngleOffset = t * PARTICLE_SPEED

    // Draw orbit rings
    nodes.forEach((node, i) => {
      const orbitR = node.orbitRadius
      ctx.beginPath()
      ctx.arc(cx, cy, orbitR, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(30, 58, 110, ${0.15 + node.link.strength * 0.1})`
      ctx.lineWidth = 0.5
      ctx.stroke()
    })

    // Draw edges (lines from sun to planets)
    nodes.forEach(node => {
      const angle = node.angle + orbitAngleOffset
      const nx = cx + Math.cos(angle) * node.orbitRadius
      const ny = cy + Math.sin(angle) * node.orbitRadius

      const isHovered = hoveredPlanetRef.current === node.id
      const isClicked = clickedPlanetRef.current === node.id
      const alpha = isHovered || isClicked ? 0.6 : 0.15 + node.link.strength * 0.2

      // Gradient edge
      const grad = ctx.createLinearGradient(cx, cy, nx, ny)
      grad.addColorStop(0, `rgba(255, 245, 157, ${alpha * 0.8})`)
      const col = NUTRIENT_FAMILY_COLORS[node.nutrient.family]
      grad.addColorStop(1, hexToRgba(col, alpha))
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(nx, ny)
      ctx.strokeStyle = grad
      ctx.lineWidth = isHovered || isClicked ? 2 : 0.8 + node.link.strength * 1.5
      ctx.stroke()

      // Animated particle along edge
      if (isHovered || isClicked) {
        const pt = ((t * 0.012) % 1)
        const px = cx + (nx - cx) * pt
        const py = cy + (ny - cy) * pt
        ctx.beginPath()
        ctx.arc(px, py, 3, 0, Math.PI * 2)
        ctx.fillStyle = hexToRgba(col, 0.9)
        ctx.fill()
        const glow = ctx.createRadialGradient(px, py, 0, px, py, 8)
        glow.addColorStop(0, hexToRgba(col, 0.4))
        glow.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.beginPath()
        ctx.arc(px, py, 8, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()
      }
    })

    // Draw food dots for hovered/clicked planets
    nodes.forEach(node => {
      const isActive = hoveredPlanetRef.current === node.id || clickedPlanetRef.current === node.id
      const angle = node.angle + orbitAngleOffset
      const nx = cx + Math.cos(angle) * node.orbitRadius
      const ny = cy + Math.sin(angle) * node.orbitRadius

      let expand = foodExpandRef.current.get(node.id) || 0
      if (isActive) {
        expand = Math.min(1, expand + 0.04)
      } else {
        expand = Math.max(0, expand - 0.06)
      }
      foodExpandRef.current.set(node.id, expand)

      if (expand > 0) {
        const ease = easeInOut(expand)
        const foods = node.link.foods
        if (foods.length === 0) return
        const maxAmt = Math.max(...foods.map(f => f.rawValue), 1)

        foods.forEach((food, fi) => {
          const foodAngle = (fi / foods.length) * Math.PI * 2 + t * 0.005
          const foodDist = FOOD_ORBIT_RADIUS + node.radius + 10
          const fx = nx + Math.cos(foodAngle) * foodDist * ease
          const fy = ny + Math.sin(foodAngle) * foodDist * ease
          const fRadius = 3 + (food.rawValue / maxAmt) * 6
          const col = NUTRIENT_FAMILY_COLORS[node.nutrient.family]

          // Glow
          const glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, fRadius * 2.5)
          glow.addColorStop(0, hexToRgba(col, 0.4 * ease))
          glow.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.beginPath()
          ctx.arc(fx, fy, fRadius * 2.5, 0, Math.PI * 2)
          ctx.fillStyle = glow
          ctx.fill()

          // Dot
          ctx.beginPath()
          ctx.arc(fx, fy, fRadius * ease, 0, Math.PI * 2)
          ctx.fillStyle = hexToRgba(col, 0.85 * ease)
          ctx.fill()
          ctx.strokeStyle = `rgba(255,255,255,${0.3 * ease})`
          ctx.lineWidth = 0.5
          ctx.stroke()

          // Label if fully expanded
          if (ease > 0.85 && expand === 1) {
              const MAX_CHARS = 15; // Adjust based on your zoom level
              
              // Truncate the name
              const displayName = food.name.split(',')[0].length > MAX_CHARS 
                  ? food.name.split(',')[0].substring(0, MAX_CHARS).trim() + '...' 
                  : food.name.split(',')[0];

              ctx.font = `bold 9px "Space Mono", monospace`;
              ctx.fillStyle = `rgba(232,234,246,${ease * 0.9})`;
              ctx.textAlign = 'center';
              
              // Draw truncated name
              ctx.fillText(displayName, fx, fy + fRadius * ease + 10);
          }
        })
      }
    })

    // Draw planet nodes
    nodes.forEach(node => {
      const angle = node.angle + orbitAngleOffset
      const nx = cx + Math.cos(angle) * node.orbitRadius
      const ny = cy + Math.sin(angle) * node.orbitRadius

      // Update stored position for hit testing
      node.x = nx
      node.y = ny

      const isHovered = hoveredPlanetRef.current === node.id
      const isClicked = clickedPlanetRef.current === node.id
      const col = NUTRIENT_FAMILY_COLORS[node.nutrient.family]
      const r = node.radius * (isHovered ? 1.25 : 1)

      // Outer glow
      const glowR = r * 2.2
      const outerGlow = ctx.createRadialGradient(nx, ny, 0, nx, ny, glowR)
      outerGlow.addColorStop(0, hexToRgba(col, isHovered ? 0.4 : 0.15))
      outerGlow.addColorStop(0.5, hexToRgba(col, isHovered ? 0.15 : 0.05))
      outerGlow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.beginPath()
      ctx.arc(nx, ny, glowR, 0, Math.PI * 2)
      ctx.fillStyle = outerGlow
      ctx.fill()

      // Planet body gradient
      const bodyGrad = ctx.createRadialGradient(nx - r * 0.3, ny - r * 0.3, r * 0.1, nx, ny, r)
      bodyGrad.addColorStop(0, hexToRgba(col, 0.9))
      bodyGrad.addColorStop(0.6, hexToRgba(col, 0.6))
      bodyGrad.addColorStop(1, hexToRgba(col, 0.2))
      ctx.beginPath()
      ctx.arc(nx, ny, r, 0, Math.PI * 2)
      ctx.fillStyle = bodyGrad
      ctx.fill()

      // Atmosphere ring
      if (isHovered || isClicked) {
        ctx.beginPath()
        ctx.arc(nx, ny, r + 5, 0, Math.PI * 2)
        ctx.strokeStyle = hexToRgba(col, 0.5)
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // Label
      ctx.font = `bold ${Math.max(8, r * 0.55)}px "Space Grotesk", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(node.nutrient.shortName, nx, ny)
    })

    // Draw sun (center nutrient)
    const pulse = 1 + Math.sin(t * 0.04) * 0.03
    const sunR = SUN_RADIUS * pulse

    // Corona layers
    ;[4.0, 2.8, 1.8].forEach((factor, i) => {
      const coronaGrad = ctx.createRadialGradient(cx, cy, sunR * 0.5, cx, cy, sunR * factor)
      coronaGrad.addColorStop(0, `rgba(255, 245, 157, ${[0.08, 0.12, 0.18][i]})`)
      coronaGrad.addColorStop(1, 'rgba(255, 179, 0, 0)')
      ctx.beginPath()
      ctx.arc(cx, cy, sunR * factor, 0, Math.PI * 2)
      ctx.fillStyle = coronaGrad
      ctx.fill()
    })

    // Sun body
    const sunGrad = ctx.createRadialGradient(cx - sunR * 0.3, cy - sunR * 0.3, sunR * 0.05, cx, cy, sunR)
    sunGrad.addColorStop(0, '#fffde7')
    sunGrad.addColorStop(0.4, '#fff59d')
    sunGrad.addColorStop(0.75, '#ffb300')
    sunGrad.addColorStop(1, '#e65100')
    ctx.beginPath()
    ctx.arc(cx, cy, sunR, 0, Math.PI * 2)
    ctx.fillStyle = sunGrad
    ctx.fill()

    // Sun label
    ctx.font = `bold ${Math.max(10, sunR * 0.32)}px "Space Grotesk", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#1e293b'
    ctx.fillText(selectedNutrient.shortName, cx, cy - 4)
    ctx.font = `${Math.max(7, sunR * 0.2)}px "Space Mono", monospace`
    ctx.fillStyle = 'rgba(5,8,20,0.7)'
    ctx.fillText(`${selectedNutrient.links.length} links`, cx, cy + sunR * 0.35)

    animRef.current = requestAnimationFrame(draw)
  }, [nutrients, selectedNutrientId])

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw])

  const getHitTarget = useCallback((mx: number, my: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const x = mx - rect.left
    const y = my - rect.top
    const cx = canvas.offsetWidth / 2
    const cy = canvas.offsetHeight / 2

    // Check sun
    const distSun = Math.hypot(x - cx, y - cy)
    if (distSun < SUN_RADIUS + 10) return { type: 'center' as const, id: selectedNutrientId }

    // Check planets
    for (const node of planetNodesRef.current) {
      const dist = Math.hypot(x - node.x, y - node.y)
      if (dist < node.radius + 12) return { type: 'planet' as const, node }
    }
    return null
  }, [selectedNutrientId])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const hit = getHitTarget(e.clientX, e.clientY)
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()

    if (!hit) {
      hoveredPlanetRef.current = null
      setTooltip(null)
      canvas.style.cursor = 'default'
      return
    }
    canvas.style.cursor = 'pointer'

    if (hit.type === 'planet') {
      hoveredPlanetRef.current = hit.node.id
      const selectedNutrient = nutrients.find(n => n.id === selectedNutrientId)
      if (!selectedNutrient) return
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        content: { type: 'planet', nutrient: hit.node.nutrient, link: hit.node.link },
      })
    } else if (hit.type === 'center') {
      hoveredPlanetRef.current = null
      const selectedNutrient = nutrients.find(n => n.id === selectedNutrientId)
      if (!selectedNutrient) return
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        content: { type: 'center', nutrient: selectedNutrient },
      })
    }
  }, [getHitTarget, nutrients, selectedNutrientId])

  const handleClick = useCallback((e: React.MouseEvent) => {
    const hit = getHitTarget(e.clientX, e.clientY)
    if (!hit) {
      clickedPlanetRef.current = null
      return
    }
    if (hit.type === 'planet') {
      if (clickedPlanetRef.current === hit.node.id) {
        // Double-click = navigate to that nutrient
        onSelectNutrient(hit.node.id)
        clickedPlanetRef.current = null
      } else {
        clickedPlanetRef.current = hit.node.id
      }
    } else if (hit.type === 'center') {
      clickedPlanetRef.current = null
    }
  }, [getHitTarget, onSelectNutrient])

  const handleMouseLeave = useCallback(() => {
    hoveredPlanetRef.current = null
    setTooltip(null)
  }, [])

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={handleMouseLeave}
      />
      {tooltip && (
        <TooltipPanel tooltip={tooltip} canvasWidth={dims.w} canvasHeight={dims.h} />
      )}
    </div>
  )
}

function TooltipPanel({ tooltip, canvasWidth, canvasHeight }: { tooltip: Tooltip; canvasWidth: number; canvasHeight: number }) {
  const { x, y, content } = tooltip
  const offsetX = x > canvasWidth * 0.65 ? -220 : 16
  const offsetY = y > canvasHeight * 0.75 ? -180 : 16

  if (content.type === 'center') {
    const n = content.nutrient
    const col = NUTRIENT_FAMILY_COLORS[n.family]
    return (
      <div
        className="pointer-events-none absolute z-50 w-52 rounded-xl border p-3 text-sm shadow-2xl"
        style={{
          left: x + offsetX,
          top: y + offsetY,
          background: 'color-mix(in srgb, var(--sidebar) 95%, transparent)',
          borderColor: col,
          boxShadow: `0 0 20px ${col}33`,
        }}
      >
        <div className="font-bold text-base mb-1" style={{ color: 'var(--cosmos-sun)' }}>{n.name}</div>
        <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-mono">{n.family}</div>
        <div className="text-xs text-foreground/80">
          <span className="font-bold" style={{ color: col }}>{n.links.length}</span> linked nutrients
        </div>
        <div className="text-xs text-muted-foreground mt-1">Click a planet to explore · Double-click to navigate</div>
      </div>
    )
  }

  if (content.type === 'planet') {
    const { nutrient, link } = content
    const col = NUTRIENT_FAMILY_COLORS[nutrient.family]
    const foods = link.foods
    const top = foods.length > 0 ? foods.reduce((a, b) => a.rawValue > b.rawValue ? a : b) : null
    return (
      <div
        className="pointer-events-none absolute z-50 w-60 rounded-xl border p-3 text-sm shadow-2xl"
        style={{
          left: x + offsetX,
          top: y + offsetY,
          background: 'color-mix(in srgb, var(--sidebar) 95%, transparent)',
          borderColor: col,
          boxShadow: `0 0 20px ${col}44`,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: col }} />
          <span className="font-bold text-base" style={{ color: col }}>{nutrient.name}</span>
        </div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider font-mono mb-2">{nutrient.family}</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mb-2">
          <span className="text-muted-foreground">Best source</span>
          <span className="font-mono font-bold" style={{ color: col }}>{top?.name ?? "No foods"}</span>
        </div>
        <div className="text-xs text-muted-foreground border-t pt-2" style={{ borderColor: 'var(--border)' }}>
          Click again to navigate → {nutrient.shortName}
        </div>
      </div>
    )
  }

  return null
}
