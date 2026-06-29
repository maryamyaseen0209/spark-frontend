import logoMark from '../assets/logo-mark.svg';

export default function BrandLogo({ showTagline = false, compact = false, inverse = false, markOnly = false, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img src={logoMark} alt="Study SparkAI logo" className={compact ? 'h-10 w-10' : 'h-12 w-12'} />
      {!markOnly && <div className="leading-tight">
        <p className={compact ? 'text-lg font-black tracking-tight' : 'text-xl font-black tracking-tight'}>
          <span className={inverse ? 'text-white' : 'text-slate-900 dark:text-white'}>Study </span>
          <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">SparkAI</span>
        </p>
        {showTagline && <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Ignite Learning. Empower Every Mind.</p>}
      </div>}
    </div>
  );
}
