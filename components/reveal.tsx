"use client";
import { motion, useReducedMotion } from "motion/react";
export function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={false}
      whileInView={reduce ? {} : { opacity: [0.65, 1], y: [18, 0] }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.65 }}
    >
      {children}
    </motion.div>
  );
}
