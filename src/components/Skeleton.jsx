import { motion } from 'framer-motion';

export function Skeleton({ className = '', variant = 'rect', width, height }) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      className={`relative overflow-hidden bg-slate-200 dark:bg-slate-700 rounded-lg ${className}`}
      style={{ width, height }}
      role="status"
      aria-label="Loading"
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent" />
    </motion.div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-lg border border-slate-100 dark:border-slate-700/50">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}