"use client"

import { useEffect, useRef } from "react"

export default function ConfettiEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const particles: Particle[] = []
    const particleCount = 100

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(canvas))
    }

    // Animation loop
    let animationId: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle) => {
        particle.update()
        particle.draw(ctx)
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-20" />
}

class Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  color: string
  canvas: HTMLCanvasElement
  gravity: number
  rotation: number
  rotationSpeed: number

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.x = canvas.width / 2
    this.y = canvas.height / 2
    this.size = Math.random() * 10 + 5
    this.speedX = Math.random() * 6 - 3
    this.speedY = Math.random() * -10 - 5
    this.gravity = 0.2
    this.rotation = Math.random() * 360
    this.rotationSpeed = Math.random() * 10 - 5

    // Emerald and teal colors
    const colors = [
      "#10B981", // emerald-500
      "#14B8A6", // teal-500
      "#34D399", // emerald-400
      "#2DD4BF", // teal-400
      "#6EE7B7", // emerald-300
      "#5EEAD4", // teal-300
    ]

    this.color = colors[Math.floor(Math.random() * colors.length)]
  }

  update() {
    this.speedY += this.gravity
    this.x += this.speedX
    this.y += this.speedY
    this.rotation += this.rotationSpeed

    if (this.y > this.canvas.height + this.size || this.x < -this.size || this.x > this.canvas.width + this.size) {
      this.x = this.canvas.width / 2
      this.y = this.canvas.height / 2
      this.speedY = Math.random() * -10 - 5
      this.speedX = Math.random() * 6 - 3
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate((this.rotation * Math.PI) / 180)

    // Draw a square or rectangle
    ctx.fillStyle = this.color
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size)

    ctx.restore()
  }
}
