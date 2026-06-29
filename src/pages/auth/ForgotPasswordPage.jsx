import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../../components/AuthShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  const [response, setResponse] = useState(null);
  const auth = useAuth();

  const onSubmit = async ({ email }) => {
    const res = await auth.forgotPassword(email);
    setResponse(res);
  };

  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we’ll send a secure reset code immediately.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input className="input" placeholder="Email" type="email" {...register('email', { required: true })} />
        <button className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Sending reset code...' : 'Send reset code'}
        </button>

        {response?.emailSent && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100">
            A password reset email has been sent if the address exists. Check your inbox or spam folder, then go to Reset Password to enter your code.
          </div>
        )}

        {response?.emailSent === false && response?.devResetCode && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
            SMTP is not configured or the email could not be delivered. Use this code to reset your password during development:
            <div className="mt-3 rounded-2xl bg-white px-3 py-2 text-base font-semibold text-slate-900 dark:bg-slate-900 dark:text-white">{response.devResetCode}</div>
            <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
              Copy the code and open the Reset Password page to set a new password.
            </div>
          </div>
        )}

        <Link to="/reset-password" className="block text-center text-sm font-semibold text-spark-500 hover:text-spark-700 dark:text-spark-300">
          Already have a code? Reset password now
        </Link>
        <Link to="/login" className="block text-center text-sm font-semibold text-spark-500 hover:text-spark-700 dark:text-spark-300">
          Back to login
        </Link>
      </form>
    </AuthShell>
  );
}
