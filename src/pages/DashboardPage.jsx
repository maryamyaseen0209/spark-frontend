import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Activity, Bell, BookOpen, FolderOpen, GraduationCap, LogOut, Menu, ShieldCheck, Sparkles, UserCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getApiErrorMessage } from '../api/client.js';
import AnalyticsPanel from '../components/AnalyticsPanel.jsx';
import AdminSuitePanel from '../components/AdminSuitePanel.jsx';
import AssignmentPanel from '../components/AssignmentPanel.jsx';
import BrandLogo from '../components/BrandLogo.jsx';
import ClassroomPanel from '../components/ClassroomPanel.jsx';
import MessagingPanel from '../components/MessagingPanel.jsx';
import MeetingPanel from '../components/MeetingPanel.jsx';
import NotificationCenter from '../components/NotificationCenter.jsx';
import QuizPanel from '../components/QuizPanel.jsx';
import ResourcePanel from '../components/ResourcePanel.jsx';
import StatCard from '../components/StatCard.jsx';
import ProfileDropdown from '../components/ProfileDropdown.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import SiteFooter from '../components/SiteFooter.jsx';
import { DashboardSkeleton } from '../components/Skeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { motion } from 'framer-motion';
import { staggerContainer, slideUp, fadeIn } from '../lib/animations.js';

const dashboardCopy = {
  student: { title: 'Student Dashboard', icon: GraduationCap, accent: 'from-blue-500 to-cyan-400' },
  teacher: { title: 'Teacher Dashboard', icon: BookOpen, accent: 'from-violet-500 to-fuchsia-400' },
  admin: { title: 'Admin Dashboard', icon: ShieldCheck, accent: 'from-amber-400 to-orange-500' },
};

export default function DashboardPage() {
  const { user, logout, updateProfile } = useAuth();
  const { unreadCount = 0, unreadByType = {} } = useNotifications() || {};
  const { section = 'home' } = useParams();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: '', institution: '', bio: '', theme: 'system', language: 'en', emailNotifications: true });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/dashboard')
      .then((res) => {
        setDashboard(res.data.dashboard);
      })
      .catch((error) => toast.error(getApiErrorMessage(error, 'Unable to load dashboard data.')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      fullName: user.fullName || '',
      institution: user.institution || '',
      bio: user.bio || '',
      theme: user.preferences?.theme || 'system',
      language: user.preferences?.language || 'en',
      emailNotifications: user.preferences?.emailNotifications ?? true,
    });
  }, [user]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        fullName: profileForm.fullName,
        institution: profileForm.institution,
        bio: profileForm.bio,
        preferences: {
          theme: profileForm.theme,
          language: profileForm.language,
          emailNotifications: profileForm.emailNotifications,
        },
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const stats = dashboard?.stats || [];
  const navItems = useMemo(() => [
    { id: 'home', label: 'Dashboard' },
    { id: 'classrooms', label: 'Classrooms' },
    ...(user?.role === 'student' ? [{ id: 'assignments', label: 'Assignments' }] : []),
    { id: 'quizzes', label: 'AI Quizzes', badge: unreadByType.quizzes },
    { id: 'analytics', label: user?.role === 'student' ? 'Progress' : 'Analytics' },
    { id: 'resources', label: 'Resources' },
    { id: 'meetings', label: 'Meetings', badge: unreadByType.meetings },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin Suite' }] : []),
    { id: 'messages', label: user?.role === 'student' ? 'Chat' : 'Messages', badge: unreadByType.messages },
    { id: 'notifications', label: 'Notifications' },
  ], [user?.role, unreadByType.messages, unreadByType.meetings, unreadByType.quizzes]);
  const routeSections = [...navItems, { id: 'profile' }, { id: 'settings' }];
  const activeSection = routeSections.some((item) => item.id === section) ? section : 'home';
  const DashboardIcon = dashboardCopy[user?.role]?.icon || Activity;
  const dashboardAccent = dashboardCopy[user?.role]?.accent || 'from-blue-500 to-indigo-500';

  return (
    <main className="aurora-bg min-h-screen px-2 py-3 transition-colors duration-500 sm:px-4 sm:py-5 lg:px-8 lg:py-6">
      <section className="mx-auto max-w-7xl">
        {/* Navbar */}
        <motion.nav
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="glass-panel sticky top-3 z-40 mb-4 p-2.5 sm:top-4 sm:mb-6 sm:p-4"
        >
          <div className="flex items-center justify-between gap-3 xl:hidden">
            <BrandLogo compact markOnly />
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-700/60 sm:h-10 sm:w-10 xl:hidden"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5 stroke-[3]" />}
            </button>
          </div>
          <div className={`${mobileMenuOpen ? 'mt-3 flex' : 'hidden'} flex-col gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 sm:gap-2 xl:mt-0 xl:flex xl:flex-row xl:flex-nowrap xl:items-center xl:justify-between xl:gap-3`}>
            <BrandLogo compact markOnly className="mb-2 hidden shrink-0 xl:flex xl:mb-0" />
            <div className="flex flex-col gap-1.5 sm:gap-2 xl:min-w-0 xl:flex-1 xl:flex-row xl:flex-nowrap xl:items-center xl:justify-end xl:overflow-hidden xl:whitespace-nowrap">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  className={`rounded-xl px-3 py-2 transition-all duration-200 sm:px-4 xl:shrink-0 xl:rounded-full xl:px-3 ${activeSection === item.id
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/25'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    }`}
                  to={item.id === 'home' ? '/dashboard' : `/dashboard/${item.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="relative inline-flex items-center">
                    {item.id === 'notifications' && <Bell className={`mr-1 h-4 w-4 ${unreadCount > 0 ? 'animate-pulse text-red-500' : ''}`} />}
                    {item.label}
                    {item.id === 'notifications' && unreadCount > 0 && (
                      <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white shadow-lg shadow-red-500/30 ring-2 ring-red-200 dark:ring-red-400/40">{unreadCount > 99 ? '99+' : unreadCount}</span>
                    )}
                    {item.id !== 'notifications' && item.badge > 0 && (
                      <span className="ml-2 inline-flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/40 ring-2 ring-red-100 dark:ring-red-400/30" aria-label="New items" />
                    )}
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-200 pt-3 dark:border-slate-700 xl:ml-2 xl:mt-0 xl:shrink-0 xl:justify-start xl:border-l xl:border-t-0 xl:pl-3 xl:pt-0">
              <ThemeToggle />
              <ProfileDropdown />
            </div>
          </div>
        </motion.nav>

        <motion.header
          variants={slideUp}
          initial="hidden"
          animate="visible"
          className="glass-panel relative overflow-hidden p-5 sm:p-6"
        >
          <div className={`absolute right-[-3rem] top-[-4rem] h-44 w-44 rounded-full bg-gradient-to-br ${dashboardAccent} opacity-20 blur-3xl`} />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <motion.div whileHover={{ rotate: 8, scale: 1.05 }} className={`rounded-2xl bg-gradient-to-br ${dashboardAccent} p-3 text-white shadow-lg shadow-blue-500/20`}>
                <DashboardIcon className="h-7 w-7" />
              </motion.div>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700 dark:border-white/10 dark:bg-white/10 dark:text-blue-200">
                  <Sparkles className="h-3.5 w-3.5" /> Live workspace
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                  {dashboardCopy[user?.role]?.title || 'Dashboard'}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Welcome back, {user?.fullName || 'learner'}. Manage learning, collaboration, resources, and insights from one polished workspace.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex">
              <Link to="/dashboard/profile" className="btn-secondary px-4 py-2 text-sm">View profile</Link>
              <Link to="/dashboard/notifications" className="btn-primary px-4 py-2 text-sm">Notifications</Link>
            </div>
          </div>
        </motion.header>

        {/* Dashboard Home */}
        {activeSection === 'home' && (
          <>
            {/* Stats Grid */}
            {loading ? (
              <DashboardSkeleton />
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
              >
                {stats.map((stat, i) => (
                  <StatCard key={stat.label} stat={stat} index={i} />
                ))}
              </motion.div>
            )}

            {/* Admin: User Breakdown */}
            {user?.role === 'admin' && dashboard?.userBreakdown && (
              <motion.div
                variants={slideUp}
                initial="hidden"
                animate="visible"
                className="card mt-6"
              >
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">User Breakdown</h2>
                <div className="grid gap-4 sm:grid-cols-4">
                  {[
                    { label: 'Students', value: dashboard.userBreakdown.students, color: 'bg-blue-500' },
                    { label: 'Teachers', value: dashboard.userBreakdown.teachers, color: 'bg-violet-500' },
                    { label: 'Admins', value: dashboard.userBreakdown.admins, color: 'bg-amber-500' },
                    { label: 'Total', value: dashboard.userBreakdown.total, color: 'bg-emerald-500' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-slate-50 dark:bg-slate-700/30 p-4 border border-slate-100 dark:border-slate-700/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{item.label}</p>
                      </div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
                {dashboard.lastUpdated && (
                  <p className="mt-4 text-xs text-slate-400">
                    Last updated: {new Date(dashboard.lastUpdated).toLocaleString()}
                  </p>
                )}
              </motion.div>
            )}

            {/* Admin: Usage Trend */}
            {user?.role === 'admin' && dashboard?.usageTrend?.length > 0 && (
              <motion.div
                variants={slideUp}
                initial="hidden"
                animate="visible"
                className="card mt-6"
              >
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Usage Trend (Last 7 Days)</h2>
                <div className="flex items-end gap-2 h-32">
                  {dashboard.usageTrend.map((day) => {
                    const max = Math.max(...dashboard.usageTrend.map(d => d.attempts), 1);
                    const height = (day.attempts / max) * 100;
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{day.attempts}</span>
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-indigo-400 rounded-t-md transition-all duration-300"
                          style={{ height: `${Math.max(height, 4)}%` }}
                        />
                        <span className="text-[10px] text-slate-400 truncate w-full text-center">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Teacher: Classroom Performance */}
            {user?.role === 'teacher' && dashboard?.classroomPerformance?.length > 0 && (
              <motion.div
                variants={slideUp}
                initial="hidden"
                animate="visible"
                className="card mt-6"
              >
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Classroom Performance</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {dashboard.classroomPerformance.map((cp) => (
                    <div key={cp.classroomId} className="rounded-xl bg-slate-50 dark:bg-slate-700/30 p-4 border border-slate-100 dark:border-slate-700/50">
                      <p className="font-semibold text-slate-900 dark:text-white">{cp.name}</p>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Students: {cp.studentCount}</span>
                        <span className="text-slate-500 dark:text-slate-400">Attempts: {cp.totalAttempts}</span>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Avg Score</span>
                          <span className="font-bold text-slate-900 dark:text-white">{cp.averageScore}%</span>
                        </div>
                        <div className="mt-1 w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                            style={{ width: `${cp.averageScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Student: Recent Attempts */}
            {user?.role === 'student' && dashboard?.recentAttempts?.length > 0 && (
              <motion.div
                variants={slideUp}
                initial="hidden"
                animate="visible"
                className="card mt-6"
              >
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Quiz Attempts</h2>
                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {dashboard.recentAttempts.map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">{attempt.quizTitle}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {attempt.subject && <>{attempt.subject} · </>}
                          {new Date(attempt.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${attempt.passed ? 'text-emerald-500' : 'text-red-500'}`}>
                          {attempt.score}%
                        </span>
                        {attempt.passed ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium">Passed</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">Failed</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Student: Performance Trend */}
            {user?.role === 'student' && dashboard?.performanceTrend?.length > 0 && (
              <motion.div
                variants={slideUp}
                initial="hidden"
                animate="visible"
                className="card mt-6"
              >
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Performance Trend</h2>
                <div className="flex items-end gap-2 h-32">
                  {dashboard.performanceTrend.map((point) => (
                    <div key={point.date} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{point.score}%</span>
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-indigo-400 rounded-t-md transition-all duration-300"
                        style={{ height: `${point.score}%` }}
                      />
                      <span className="text-[10px] text-slate-400 truncate w-full text-center">{point.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <AnalyticsPanel role={user?.role} analytics={dashboard?.analytics || {}} />

          </>
        )}

        {/* Section Panels */}
        <motion.div
          key={activeSection}
          variants={slideUp}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="mt-6"
        >
          {activeSection === 'classrooms' && <ClassroomPanel role={user?.role} />}
          {activeSection === 'assignments' && <AssignmentPanel role={user?.role} />}
          {activeSection === 'quizzes' && <QuizPanel role={user?.role} />}
          {activeSection === 'analytics' && <AnalyticsPanel role={user?.role} analytics={dashboard?.analytics || {}} />}
          {activeSection === 'admin' && user?.role === 'admin' && <AdminSuitePanel />}
          {activeSection === 'resources' && <ResourcePanel role={user?.role} />}
          {activeSection === 'meetings' && <MeetingPanel role={user?.role} />}
          {activeSection === 'messages' && <MessagingPanel />}
          {activeSection === 'notifications' && <NotificationCenter />}
        </motion.div>
        {activeSection === 'profile' && (
          <motion.div
            variants={slideUp}
            initial="hidden"
            animate="visible"
            className="card mt-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <UserCircle className="text-blue-500" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profile</h2>
            </div>
            <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-700/30 p-4 border border-slate-100 dark:border-slate-700/50">
                <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Name</p>
                <p className="mt-1 font-bold text-slate-900 dark:text-white">{user?.fullName}</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-700/30 p-4 border border-slate-100 dark:border-slate-700/50">
                <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Email</p>
                <p className="mt-1 font-bold text-slate-900 dark:text-white">{user?.email}</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-700/30 p-4 border border-slate-100 dark:border-slate-700/50">
                <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Role</p>
                <p className="mt-1 font-bold capitalize text-slate-900 dark:text-white">{user?.role}</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-700/30 p-4 border border-slate-100 dark:border-slate-700/50">
                <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Account</p>
                <p className="mt-1 font-bold text-emerald-500">Active</p>
              </div>
            </div>
            <form onSubmit={handleProfileSubmit} className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Full name
                <input value={profileForm.fullName} onChange={(event) => setProfileForm((form) => ({ ...form, fullName: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              </label>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Institution
                <input value={profileForm.institution} onChange={(event) => setProfileForm((form) => ({ ...form, institution: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              </label>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 sm:col-span-2">
                Bio
                <textarea value={profileForm.bio} onChange={(event) => setProfileForm((form) => ({ ...form, bio: event.target.value }))} rows={3} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              </label>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Theme preference
                <select value={profileForm.theme} onChange={(event) => setProfileForm((form) => ({ ...form, theme: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Language
                <input value={profileForm.language} onChange={(event) => setProfileForm((form) => ({ ...form, language: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              </label>
              <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200 sm:col-span-2">
                <input type="checkbox" checked={profileForm.emailNotifications} onChange={(event) => setProfileForm((form) => ({ ...form, emailNotifications: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-blue-500" />
                Email me important classroom and account notifications
              </label>
              <div className="sm:col-span-2">
                <button disabled={savingProfile} className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60">
                  {savingProfile ? 'Saving profile...' : 'Update profile'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
        {activeSection === 'settings' && (
          <motion.div
            variants={slideUp}
            initial="hidden"
            animate="visible"
            className="card mt-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <Bell className="text-blue-500" />
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Manage activity preferences and how Study SparkAI keeps you updated.</p>
              </div>
            </div>
            <form onSubmit={handleProfileSubmit} className="grid gap-4 lg:grid-cols-2">
              <label className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                Theme preference
                <select value={profileForm.theme} onChange={(event) => setProfileForm((form) => ({ ...form, theme: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
              <label className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                Language
                <input value={profileForm.language} onChange={(event) => setProfileForm((form) => ({ ...form, language: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              </label>
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                <input type="checkbox" checked={profileForm.emailNotifications} onChange={(event) => setProfileForm((form) => ({ ...form, emailNotifications: event.target.checked }))} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-500" />
                <span><span className="block">Email notifications</span><span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">Receive important classroom, quiz, and account updates by email.</span></span>
              </label>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">User activity</p>
                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-xl bg-white p-3 dark:bg-slate-800"><p className="text-xs uppercase text-slate-400">Role</p><p className="font-bold capitalize text-slate-900 dark:text-white">{user?.role}</p></div>
                  <div className="rounded-xl bg-white p-3 dark:bg-slate-800"><p className="text-xs uppercase text-slate-400">Account</p><p className="font-bold text-emerald-500">Active</p></div>
                </div>
              </div>
              <div className="lg:col-span-2">
                <button disabled={savingProfile} className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60">
                  {savingProfile ? 'Saving settings...' : 'Save settings'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
        <SiteFooter />
      </section>
    </main>
  );
}