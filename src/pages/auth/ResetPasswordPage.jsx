import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import AuthShell from '../../components/AuthShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getApiErrorMessage } from '../../api/client.js';

export default function ResetPasswordPage() {
  const { register, handleSubmit, watch, formState: { isSubmitting, errors } } = useForm();
  const auth = useAuth();
  const navigate = useNavigate();
  const [response, setResponse] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const passwordValue = watch('password', '');

  const onSubmit = async ({ email, code, password }) => {
    try {
      setResponse({ type: 'loading', message: 'Resetting your password...' });
      await auth.resetPassword(email, code, password);
      navigate('/login');
    } catch (error) {
      setResponse({ type: 'error', message: getApiErrorMessage(error, 'Unable to reset password. Check your code and try again.') });
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="Enter your email, reset code, and a new password.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Enter the email address where you requested the code, then paste the 6-digit reset code from your email.
          After that, choose a new password to complete the reset.
        </div>

        {response?.message && (
          <div className={`rounded-2xl px-4 py-3 text-sm ${response.type === 'error' ? 'border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-100' : 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100'}`}>
            {response.message}
          </div>
        )}

        <input className="input" placeholder="Email" type="email" {...register('email', { required: true })} />
        <input className="input" placeholder="Reset code" inputMode="numeric" pattern="[0-9]*" {...register('code', { required: true, minLength: 6, maxLength: 6 })} />
        <div className="relative">
          <input
            className="input pr-11"
            placeholder="New password"
            type={showPassword ? 'text' : 'password'}
            {...register('password', {
              required: 'New password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
              validate: (value) => !/\d/.test(value) || 'Password cannot contain digits',
            })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-3 inline-flex items-center text-slate-500"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && <p className="text-rose-600 text-sm">{errors.password.message}</p>}
        <div className="relative">
          <input
            className="input pr-11"
            placeholder="Confirm new password"
            type={showConfirm ? 'text' : 'password'}
            {...register('confirmPassword', {
              required: 'Confirm password is required',
              validate: (value) => value === passwordValue || 'Passwords do not match',
            })}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((prev) => !prev)}
            className="absolute inset-y-0 right-3 inline-flex items-center text-slate-500"
          >
            {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-rose-600 text-sm">{errors.confirmPassword.message}</p>}
        <button className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? 'Resetting password...' : 'Reset password'}</button>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
          The new password must not match your current password. If it does, the reset will be rejected.
        </div>
        <div className="flex flex-col gap-2 text-sm text-center text-slate-600 dark:text-slate-400">
          <Link to="/forgot-password" className="font-semibold text-spark-500 hover:text-spark-700 dark:hover:text-spark-50">
            Need a reset code? Request one here
          </Link>
          <Link to="/login" className="font-semibold text-spark-500 hover:text-spark-700 dark:hover:text-spark-50">
            Back to login
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
