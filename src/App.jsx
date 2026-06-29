import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';
import VerifyEmailPage from './pages/auth/VerifyEmailPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import { useAuth } from './context/AuthContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import PageTransition from './components/PageTransition.jsx';
import { motion } from 'framer-motion';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="grid min-h-screen place-items-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
        />
        <p className="text-slate-500 dark:text-slate-400 text-sm">Loading Study SparkAI...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function AnimatedRoutes() {
  return (
      <Routes>
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPasswordPage /></PageTransition>} />
        <Route path="/verify-email" element={<PageTransition><VerifyEmailPage /></PageTransition>} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <PageTransition>
                <DashboardPage />
              </PageTransition>
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/:section" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <PageTransition>
                <DashboardPage />
              </PageTransition>
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SocketProvider>
          <NotificationProvider>
            <AnimatedRoutes />
          </NotificationProvider>
        </SocketProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}