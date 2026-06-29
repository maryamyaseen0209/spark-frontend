import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext.jsx';

export default function ThemeToggle({ label = false, className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {label && <span className="hidden text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 sm:inline-flex">Theme</span>}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        onClick={toggleTheme}
        className="group relative h-9 w-[4.5rem] overflow-hidden rounded-full border border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/70 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:border-white/10 dark:bg-slate-800/90 dark:shadow-black/30 dark:focus:ring-blue-500 dark:focus:ring-offset-slate-900"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        role="switch"
        aria-checked={isDark}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-amber-200/80 via-sky-100 to-blue-200 opacity-100 transition-opacity duration-300 dark:opacity-0" />
        <span className="absolute inset-0 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 opacity-0 transition-opacity duration-300 dark:opacity-100" />
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 520, damping: 32 }}
          className={`absolute top-1 flex h-7 w-7 items-center justify-center rounded-full shadow-md ${isDark ? 'left-[2.35rem] bg-slate-700 text-amber-300' : 'left-1 bg-white text-amber-500'}`}
        >
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </motion.span>
      </motion.button>
    </div>
  );
}