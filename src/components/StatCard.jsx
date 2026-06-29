import { motion } from 'framer-motion';
import { staggerItem } from '../lib/animations.js';
import { Activity, BookOpen, BrainCircuit, FileText, Target, Users, Zap } from 'lucide-react';

const iconMap = {
  BrainCircuit: BrainCircuit,
  Target: Target,
  FileText: FileText,
  Zap: Zap,
  Users: Users,
  BookOpen: BookOpen,
  Activity: Activity,
};

export default function StatCard({ stat, index = 0 }) {
  const IconComponent = iconMap[stat.icon] || Activity;

  return (
    <motion.div
      variants={staggerItem}
      initial="initial"
      animate="animate"
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.03, y: -2 }}
      className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700/50 transition-colors duration-300 group"
    >
      {/* Gradient accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color || 'from-blue-500 to-indigo-500'}`} />

      {/* Shimmer hover effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full" />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {stat.label}
          </p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">
            {stat.value ?? 0}
          </p>
        </div>
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color || 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20'}`}>
          <IconComponent className="h-5 w-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
}