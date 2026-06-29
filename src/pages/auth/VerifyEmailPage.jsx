import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell from '../../components/AuthShell.jsx';
import SystemAlert from '../../components/SystemAlert.jsx';
import { getApiErrorMessage } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [response, setResponse] = useState({ type: 'loading', message: 'Verifying your Study SparkAI email...' });

  useEffect(() => {
    const email = params.get('email');
    const code = params.get('code');
    if (!email || !code) {
      setResponse({ type: 'error', message: 'Verification link is missing email or code.' });
      return;
    }
    auth.register({ email, code })
      .then((res) => {
        setResponse({ type: 'success', message: res.message });
        setTimeout(() => navigate('/dashboard', { replace: true }), 600);
      })
      .catch((error) => setResponse({ type: 'error', message: getApiErrorMessage(error) }));
  }, [auth, navigate, params]);

  return <AuthShell title="Verify email" subtitle="Completing your secure account setup."><div className="space-y-4"><SystemAlert type={response.type} message={response.message} /><Link to="/register" className="btn-secondary block text-center">Back to registration</Link></div></AuthShell>;
}