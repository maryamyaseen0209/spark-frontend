import { motion } from 'framer-motion';
import { BookOpenCheck, BrainCircuit, MessagesSquare, ShieldCheck } from 'lucide-react';
import BrandLogo from './BrandLogo.jsx';

const footerLinks = ['Classrooms', 'AI quizzes', 'Resources', 'Messaging'];
const trustItems = [
  { label: 'Smart study tools', icon: BrainCircuit },
  { label: 'Secure collaboration', icon: ShieldCheck },
  { label: 'Live classroom updates', icon: MessagesSquare },
];

export default function SiteFooter({ compact = false }) {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="relative z-10 mx-auto mt-8 max-w-7xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-2xl shadow-slate-200/60 backdrop-blur-xl transition-colors duration-500 dark:border-white/10 dark:bg-slate-950/70 dark:shadow-black/30 sm:p-6"
    >
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/70 to-transparent" />
      <div className="absolute right-[-4rem] top-[-5rem] h-44 w-44 rounded-full bg-blue-400/20 blur-3xl dark:bg-cyan-500/20" />
      <div className="absolute bottom-[-5rem] left-[-4rem] h-44 w-44 rounded-full bg-violet-400/20 blur-3xl dark:bg-fuchsia-500/20" />

      <div className={`relative grid gap-6 ${compact ? 'lg:grid-cols-[1.3fr_1fr]' : 'lg:grid-cols-[1.4fr_1fr_1fr]'}`}>
        <div>
          <BrandLogo showTagline />
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Study SparkAI brings classrooms, assignments, meetings, resources, AI quizzes, and notifications into one beautiful learning workspace.
          </p>
        </div>

        {!compact && (
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Explore</h3>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {footerLinks.map((link) => (
                <span key={link} className="rounded-full border border-slate-200/80 bg-white/70 px-3 py-2 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
                  {link}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Why learners stay</h3>
          <div className="mt-4 space-y-2">
            {trustItems.map(({ label, icon: Icon }) => (
              <motion.div key={label} whileHover={{ x: 4 }} className="flex items-center gap-3 rounded-2xl bg-slate-50/80 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-white/5 dark:text-slate-200">
                <Icon className="h-4 w-4 text-spark-500" />
                {label}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mt-6 flex flex-col gap-3 border-t border-slate-200/80 pt-4 text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} Study SparkAI. Built for focused digital learning.</span>
        <span className="inline-flex items-center gap-2"><BookOpenCheck className="h-4 w-4 text-blue-500" /> Learn smarter. Collaborate faster.</span>
      </div>
    </motion.footer>
  );
}