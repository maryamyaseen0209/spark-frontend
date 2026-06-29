import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const styles = {
  error: 'border-rose-200 bg-rose-50 text-rose-800 shadow-rose-100/70 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-100 dark:shadow-black/20',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800 shadow-emerald-100/70 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100 dark:shadow-black/20',
  info: 'border-sky-200 bg-sky-50 text-sky-800 shadow-sky-100/70 dark:border-sky-400/30 dark:bg-sky-500/10 dark:text-sky-100 dark:shadow-black/20',
  loading: 'border-blue-200 bg-blue-50 text-blue-800 shadow-blue-100/70 dark:border-spark-500/30 dark:bg-spark-500/10 dark:text-spark-50 dark:shadow-black/20',
};

const icons = { error: AlertCircle, success: CheckCircle2, info: Info, loading: Loader2 };
const defaultTitles = { error: 'Needs attention', success: 'Done', info: 'Update', loading: 'Please wait' };

export default function SystemAlert({ type = 'info', title, message }) {
  if (!message) return null;
  const Icon = icons[type] || Info;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-3 text-sm shadow-sm sm:p-4 ${styles[type] || styles.info}`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${type === 'loading' ? 'animate-spin' : ''}`} />
        <div className="min-w-0">
          <p className="font-semibold">{title || defaultTitles[type] || defaultTitles.info}</p>
          <p className="mt-1 break-words leading-6 opacity-90">{message}</p>
        </div>
      </div>
    </motion.div>
  );
}