import { motion } from 'framer-motion';
import { BrainCircuit, MessagesSquare, ShieldCheck, Sparkles } from 'lucide-react';
import BrandLogo from './BrandLogo.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import SiteFooter from './SiteFooter.jsx';
import { floatingOrb, staggerContainer, staggerItem, scaleIn } from '../lib/animations.js';

export default function AuthShell({ title, subtitle, children }) {
  return (
    <main className="aurora-bg relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-slate-100 to-white px-4 py-6 transition-colors duration-500 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:px-6 lg:px-8">
      <motion.div variants={floatingOrb} animate="animate" className="pointer-events-none absolute left-[-5rem] top-24 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-500/20" />
      <motion.div variants={floatingOrb} animate="animate" transition={{ delay: 1 }} className="pointer-events-none absolute bottom-[-6rem] right-[-3rem] h-80 w-80 rounded-full bg-violet-400/20 blur-3xl dark:bg-fuchsia-500/20" />
      <motion.div className="pointer-events-none absolute top-24 right-1/4 hidden h-44 w-44 rounded-full bg-sky-300/20 blur-3xl dark:block dark:bg-sky-500/15" />

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <motion.section
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto grid max-w-5xl items-start gap-10 py-6 lg:grid-cols-[1.25fr_minmax(360px,420px)]"
      >
        <motion.div variants={staggerItem} className="hidden flex-col justify-center gap-6 py-4 lg:flex lg:pr-10">
          <BrandLogo showTagline className="mb-5" />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-blue-700 shadow-lg shadow-blue-200/40 backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-blue-200 dark:shadow-black/20"
          >
            <Sparkles className="h-4 w-4" /> Welcome to Spark AI
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.5 }}
            className="max-w-2xl text-3xl font-black leading-tight text-slate-950 dark:text-white sm:text-4xl lg:text-[3rem]"
          >
            Learn faster with AI-powered assignments, quizzes, and classroom tools.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-3 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300"
          >
            Join a modern learning workspace built for students and teachers who want engaging lessons, instant AI support, and secure collaboration.
          </motion.p>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mt-5 grid gap-3 sm:grid-cols-3"
          >
            {[
              ['Instant AI help', BrainCircuit],
              ['Smart classroom', MessagesSquare],
              ['Secure access', ShieldCheck],
            ].map(([label, Icon], i) => (
              <motion.div
                key={label}
                variants={staggerItem}
                transition={{ delay: 0.4 + i * 0.08 }}
                whileHover={{ y: -3, scale: 1.02 }}
                className="rounded-3xl border border-slate-200/80 bg-white/90 p-4 text-sm font-semibold text-slate-700 shadow-md shadow-slate-200/50 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:shadow-black/20"
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-spark-500/10 text-spark-600 dark:bg-spark-500/20 dark:text-spark-200">
                  <Icon className="h-5 w-5" />
                </div>
                {label}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Mobile brand */}
        <motion.div variants={staggerItem} className="flex justify-center lg:hidden">
          <BrandLogo />
        </motion.div>

        <motion.div
          variants={{ ...staggerItem, ...scaleIn }}
          whileHover={{ y: -2 }}
          className="glass-panel w-full max-w-lg px-6 py-10 sm:px-8 sm:py-12 mx-auto lg:mx-0"
        >
          {/* <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <span className="rounded-2xl bg-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-800 dark:bg-slate-800 dark:text-slate-200">Fast onboarding</span>
            <span className="rounded-2xl bg-blue-500/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">Secure auth</span>
            <span className="rounded-2xl bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">AI-ready</span>
          </div> */}
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg font-bold text-slate-950 dark:text-white sm:text-xl"
          >
            {title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26 }}
            className="mt-1 text-xs text-slate-600 dark:text-slate-400 sm:text-sm"
          >
            {subtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.4 }}
            className="mt-3"
          >
            {children}
          </motion.div>
        </motion.div>
      </motion.section>
      <SiteFooter compact />
    </main>
  );
}