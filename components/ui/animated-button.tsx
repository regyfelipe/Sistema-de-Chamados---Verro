"use client"

import { motion } from "framer-motion"
import { Button, ButtonProps } from "./button"
import { cn } from "@/lib/utils"

interface AnimatedButtonProps extends ButtonProps {
  children: React.ReactNode
}

export function AnimatedButton({ 
  children, 
  className,
  ...props 
}: AnimatedButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Button className={cn(className)} {...props}>
        {children}
      </Button>
    </motion.div>
  )
}

