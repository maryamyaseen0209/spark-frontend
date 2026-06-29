import { motion } from 'framer-motion';

export default function PageTransition({ children, className = '' }) {
  return (
    <motion.div
      className={`min-h-screen ${className}`}
    >
      {children}
    </motion.div>
  );
}