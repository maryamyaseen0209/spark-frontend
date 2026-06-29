import { motion } from 'framer-motion';

const avatarColors = [
  'bg-gradient-to-br from-blue-500 to-indigo-600',
  'bg-gradient-to-br from-violet-500 to-fuchsia-600',
  'bg-gradient-to-br from-emerald-400 to-teal-600',
  'bg-gradient-to-br from-amber-400 to-orange-600',
  'bg-gradient-to-br from-rose-400 to-pink-600',
  'bg-gradient-to-br from-cyan-400 to-blue-600',
  'bg-gradient-to-br from-purple-400 to-violet-600',
  'bg-gradient-to-br from-pink-400 to-rose-600',
];

export function UserAvatar({ name, size = 'md', onClick, className = '' }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  const colorIndex = (name || '').charCodeAt(0) % avatarColors.length;
  const gradient = avatarColors[colorIndex];

  const sizeMap = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-2xl',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`relative rounded-full ${sizeMap[size]} ${gradient} flex items-center justify-center font-bold text-white shadow-lg shadow-black/10 cursor-pointer select-none ${className}`}
      aria-label={`${name || 'User'} avatar`}
      role="button"
      tabIndex={0}
    >
      {initial}
    </motion.button>
  );
}