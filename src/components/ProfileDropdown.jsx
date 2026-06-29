import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserAvatar } from './UserAvatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const hoverTimeoutRef = useRef(null);

  const handleMouseEnter = () => {
    clearTimeout(hoverTimeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => setOpen(false), 200);
  };

  useEffect(() => {
    return () => clearTimeout(hoverTimeoutRef.current);
  }, []);

  const menuItems = [
    { label: 'Profile', icon: '👤', onClick: () => { navigate('/dashboard/profile'); setOpen(false); } },
    { label: 'Settings', icon: '⚙️', onClick: () => { navigate('/dashboard/settings'); setOpen(false); } },
    { label: theme === 'dark' ? 'Light Mode' : 'Dark Mode', icon: theme === 'dark' ? '☀️' : '🌙', onClick: () => { toggleTheme(); setOpen(false); } },
    { label: 'Logout', icon: '🚪', onClick: logout, danger: true },
  ];

  return (
    <div
      ref={containerRef}
      className="relative z-50"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title="Profile"
    >
      <UserAvatar
        name={user?.fullName || user?.name || 'User'}
        size="md"
      />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl shadow-black/20 dark:shadow-black/40 border border-slate-200 dark:border-slate-700 overflow-hidden"
            role="menu"
            aria-label="User menu"
          >
            {/* User info header */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
              <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                {user?.fullName || user?.name || 'User'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {user?.email || ''}
              </p>
              <span className="inline-block mt-1.5 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                {user?.role || 'student'}
              </span>
            </div>

            {/* Menu items */}
            <div className="py-1">
              {menuItems.map((item, i) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={item.onClick}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150
                    ${item.danger
                      ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  role="menuitem"
                  tabIndex={0}
                >
                  <span className="text-base w-5 text-center">{item.icon}</span>
                  <span>{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}