"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Botão com efeito de ripple
 */
interface RippleButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export function RippleButton({ 
  children, 
  onClick, 
  className,
  disabled 
}: RippleButtonProps) {
  return (
    <motion.button
      className={cn("relative overflow-hidden", className)}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {children}
      <motion.span
        className="absolute inset-0 bg-white/20 rounded-full"
        initial={{ scale: 0, opacity: 1 }}
        whileTap={{ scale: 4, opacity: 0 }}
        transition={{ duration: 0.6 }}
      />
    </motion.button>
  )
}

/**
 * Card com efeito de hover suave
 */
interface HoverCardProps {
  children: ReactNode
  className?: string
}

export function HoverCard({ children, className }: HoverCardProps) {
  return (
    <motion.div
      className={cn(className)}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Badge com animação de entrada
 */
interface AnimatedBadgeProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function AnimatedBadge({ children, className, delay = 0 }: AnimatedBadgeProps) {
  return (
    <motion.span
      className={className}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        delay,
        type: "spring",
        stiffness: 500,
        damping: 30
      }}
    >
      {children}
    </motion.span>
  )
}

/**
 * Loading spinner animado
 */
export function AnimatedSpinner({ size = 24 }: { size?: number }) {
  return (
    <motion.div
      className="border-2 border-primary border-t-transparent rounded-full"
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  )
}

/**
 * Progress bar animada
 */
interface AnimatedProgressProps {
  value: number
  max?: number
  className?: string
}

export function AnimatedProgress({ value, max = 100, className }: AnimatedProgressProps) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className={cn("w-full h-2 bg-muted rounded-full overflow-hidden", className)}>
      <motion.div
        className="h-full bg-primary"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  )
}

