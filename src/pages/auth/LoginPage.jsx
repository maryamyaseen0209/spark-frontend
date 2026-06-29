import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { getApiErrorMessage } from '../../api/client.js';
import AuthShell from '../../components/AuthShell.jsx';
import FieldError from '../../components/FieldError.jsx';
import PasswordInput from '../../components/PasswordInput.jsx';
import SystemAlert from '../../components/SystemAlert.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { staggerContainer, staggerItem } from '../../lib/animations.js';

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [response, setResponse] = useState(null);
  const auth = useAuth();
  const navigate = useNavigate();
  const onSubmit = async (data) => {
    try {
      setResponse({ type: 'loading', message: 'Signing you in securely...' });
      const res = await auth.login({ ...data, rememberMe: Boolean(data.rememberMe) });
      setResponse({ type: 'success', message: res.message });
      navigate('/dashboard');
    } catch (error) {
      setResponse({ type: 'error', message: getApiErrorMessage(error) });
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue your learning journey.">
      <motion.form
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 max-w-md mx-auto"
      >
        <motion.div variants={staggerItem}>
          <SystemAlert type={response?.type} message={response?.message} />
        </motion.div>

        <motion.div variants={staggerItem}>
          <input
            className="input"
            placeholder="Email"
            type="email"
            {...register('email', { required: 'Email is required' })}
          />
          <FieldError message={errors.email?.message} />
        </motion.div>

        <motion.div variants={staggerItem}>
          <PasswordInput registration={register('password', { required: 'Password is required' })} />
          <FieldError message={errors.password?.message} />
        </motion.div>

        <motion.label
          variants={staggerItem}
          className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
        >
          <input type="checkbox" {...register('rememberMe')} /> Remember me
        </motion.label>

        <motion.button
          variants={staggerItem}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </motion.button>

        <motion.div
          variants={staggerItem}
          className="flex flex-col gap-2 text-sm sm:flex-row sm:justify-between"
        >
          <Link to="/register" className="font-semibold text-spark-500 hover:text-spark-700 dark:hover:text-spark-50">
            Create account
          </Link>
          <Link to="/forgot-password" className="font-semibold text-spark-500 hover:text-spark-700 dark:hover:text-spark-50">
            Forgot password?
          </Link>
        </motion.div>
        <motion.div variants={staggerItem} className="text-xs text-slate-500 dark:text-slate-400">
          Need a password reset code? Request one on the Forgot Password page, then enter the code on Reset Password.
        </motion.div>
      </motion.form>
    </AuthShell>
  );
}