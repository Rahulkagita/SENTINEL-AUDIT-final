'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandMark } from '@/components/common/brand-mark';

const loaderMessages = [
  'Verifying session signatures...',
  'Checking tamper-evident registry...',
  'Validating client credentials...',
  'Securing cryptochain connection...',
];

export function SessionLoader() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % loaderMessages.length);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4">
      {/* Background Gradients */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="pointer-events-none absolute h-[30rem] w-[30rem] rounded-full bg-gradient-to-tr from-primary/10 to-accent/15 blur-3xl" />

      <div className="relative flex flex-col items-center">
        {/* Animated outer glowing rings */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: 360,
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -inset-4 rounded-full border border-primary/25 border-dashed"
        />

        <motion.div
          animate={{
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative flex items-center justify-center p-6 rounded-full bg-card shadow-elevated border border-border"
        >
          <BrandMark iconOnly size="lg" />
        </motion.div>
      </div>

      <div className="mt-8 text-center min-h-[3rem]">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground/80">
          SentinelAudit AI
        </h2>
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="mt-2 text-sm text-foreground/70"
          >
            {loaderMessages[msgIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress Bar simulation */}
      <div className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: 'easeInOut',
          }}
          className="h-full w-1/2 rounded-full bg-gradient-to-r from-primary to-accent"
        />
      </div>
    </div>
  );
}
