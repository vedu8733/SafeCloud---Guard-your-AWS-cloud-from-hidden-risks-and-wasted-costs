"use client";
import Link from 'next/link';
import { Cloud } from 'lucide-react';
import { motion } from 'framer-motion';

export function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full flex items-center justify-between px-6 py-4 glass-card shadow-glass mb-6"
    >
      <Link href="/" className="flex items-center gap-2 font-bold text-2xl bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
        <Cloud className="w-7 h-7 text-brand-primary" />
        SafeCloud
      </Link>
      <div className="flex gap-6 text-base font-medium">
        <Link href="/dashboard" className="group relative">
          <span>Dashboard</span>
          <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-gradient-to-r from-brand-primary to-brand-accent transition-all group-hover:w-full" />
        </Link>
        <Link href="/connect" className="group relative">
          <span>Connect</span>
          <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-gradient-to-r from-brand-primary to-brand-accent transition-all group-hover:w-full" />
        </Link>
      </div>
    </motion.nav>
  );
}
