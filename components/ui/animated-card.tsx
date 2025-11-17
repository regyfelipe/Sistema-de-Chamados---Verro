"use client"

import { motion } from "framer-motion"
import { Card } from "./card"
import { cn } from "@/lib/utils"
import { HTMLAttributes } from "react"

interface AnimatedCardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  delay?: number
}

export function AnimatedCard({ 
  children, 
  className,
  delay = 0,
  ...props 
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4,
        delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      whileHover={{ 
        y: -4,
        transition: { duration: 0.2 }
      }}
    >
      <Card className={cn("transition-shadow duration-200 hover:shadow-lg", className)} {...props}>
        {children}
      </Card>
    </motion.div>
  )
}

