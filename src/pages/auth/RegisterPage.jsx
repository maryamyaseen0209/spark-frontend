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

export default function RegisterPage() {
  const { register, handleSubmit, reset, setValue, getValues, formState: { errors, isSubmitting } } = useForm({ defaultValues: { role: 'student' } });
  const [response, setResponse] = useState(null);
  const [pendingEmail, setPendingEmail] = useState('');
  const [devCode, setDevCode] = useState('');
  const auth = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      setResponse({ type: 'loading', message: pendingEmail ? 'Verifying your email...' : 'Sending verification code...' });
      if (!pendingEmail) {
        const res = await auth.startRegistration({ ...data, termsAccepted: data.termsAccepted ? 'true' : 'false' });
        setPendingEmail(res.email);
        setDevCode(res.devCode || '');
        setValue('email', res.email);
        setResponse({ type: 'success', message: res.message });
        return;
      }
      const res = await auth.register({ email: pendingEmail, code: data.code });
      setResponse({ type: 'success', message: res.message });
      reset();
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setResponse({ type: 'error', message: getApiErrorMessage(error) });
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Choose your role to unlock a personalized dashboard.">
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

        {!pendingEmail ? (
          <>
            <motion.div variants={staggerItem}>
              <input className="input" placeholder="Full name" {...register('fullName', { required: 'Full name is required' })} />
              <FieldError message={errors.fullName?.message} />
            </motion.div>

            <motion.div variants={staggerItem}>
              <input className="input" placeholder="Email" type="email" {...register('email', { required: 'Email is required' })} />
              <FieldError message={errors.email?.message} />
            </motion.div>

            <motion.div variants={staggerItem}>
              <PasswordInput registration={register('password', { required: 'Password is required', minLength: { value: 8, message: 'Use at least 8 characters' } })} />
              <FieldError message={errors.password?.message} />
            </motion.div>

            <motion.div variants={staggerItem}>
              <PasswordInput placeholder="Confirm password" registration={register('confirmPassword', { required: 'Confirm password is required', validate: (value) => value === getValues('password') || 'Passwords do not match' })} />
              <FieldError message={errors.confirmPassword?.message} />
            </motion.div>

            <motion.div variants={staggerItem}>
              <input className="input" placeholder="Institution name (optional)" {...register('institution')} />
            </motion.div>

            <motion.div variants={staggerItem}>
              <select className="input" {...register('role')}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </motion.div>

            <motion.p
              variants={staggerItem}
              className="rounded-xl border border-spark-500/20 bg-spark-500/10 px-3.5 py-2.5 text-xs text-spark-700 dark:text-spark-100"
            >
              Admin accounts are not publicly registered. Create or promote admins directly in MongoDB.
            </motion.p>

            <motion.label
              variants={staggerItem}
              className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
            >
              <input type="checkbox" {...register('termsAccepted', { required: 'You must accept the terms' })} /> I accept the terms
            </motion.label>
            <FieldError message={errors.termsAccepted?.message} />
          </>
        ) : (
          <>
            <motion.p
              variants={staggerItem}
              className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-2.5 text-sm text-emerald-700 dark:border-emerald-400/20 dark:text-emerald-100"
            >
              We sent a 6-digit code to <strong>{pendingEmail}</strong>. Enter it below to create your account.
            </motion.p>
            {devCode && (
              <motion.div
                variants={staggerItem}
                className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100"
              >
                SMTP is not configured or the email could not be delivered. Use this code to complete registration:
                <div className="mt-2 rounded-lg bg-white px-3 py-2 text-base font-semibold text-slate-900 dark:bg-slate-900 dark:text-white">{devCode}</div>
              </motion.div>
            )}
            <motion.div variants={staggerItem}>
              <input className="input text-center text-lg tracking-[0.4em]" placeholder="000000" maxLength={6} {...register('code', { required: 'Verification code is required', minLength: { value: 6, message: 'Enter all 6 digits' } })} />
              <FieldError message={errors.code?.message} />
            </motion.div>
            <motion.button
              type="button"
              variants={staggerItem}
              className="text-sm font-semibold text-spark-500 hover:text-spark-700 dark:text-spark-300"
              onClick={() => { setPendingEmail(''); setDevCode(''); }}
            >
              Use a different email
            </motion.button>
          </>
        )}

        <motion.button
          variants={staggerItem}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Please wait...' : pendingEmail ? 'Verify and enter dashboard' : 'Send verification code'}
        </motion.button>

        <motion.p variants={staggerItem} className="text-sm text-slate-500 dark:text-slate-400">
          Already registered? <Link to="/login" className="font-semibold text-spark-500">Log in</Link>
        </motion.p>
      </motion.form>
    </AuthShell>
  );
}