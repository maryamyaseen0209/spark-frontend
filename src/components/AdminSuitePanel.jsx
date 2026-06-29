import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, Megaphone, SlidersHorizontal, Users, Activity } from 'lucide-react';
import { api, getApiErrorMessage } from '../api/client.js';

const emptyAnnouncement = { title: '', body: '', audience: 'all', status: 'published' };

export default function AdminSuitePanel() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({});
  const [analytics, setAnalytics] = useState({ roleBreakdown: {}, statusBreakdown: {}, quizTrend: [], newestUsers: [] });
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [moderation, setModeration] = useState([]);
  const [config, setConfig] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState(emptyAnnouncement);
  const [configForm, setConfigForm] = useState({ key: 'platform.brandName', value: 'Study SparkAI', description: 'Brand name shown across the app' });

  const loadAdminSuite = async () => {
    setLoading(true);
    try {
      const [overviewRes, analyticsRes, usersRes, announcementsRes, moderationRes, configRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/analytics'),
        api.get('/admin/users?limit=20'),
        api.get('/admin/announcements'),
        api.get('/admin/moderation'),
        api.get('/admin/config'),
      ]);
      setOverview(overviewRes.data.overview || {});
      setAnalytics(analyticsRes.data.analytics || {});
      setUsers(usersRes.data.users || []);
      setAnnouncements(announcementsRes.data.announcements || []);
      setModeration(moderationRes.data.cases || []);
      setConfig(configRes.data.config || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to load admin suite.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminSuite();
  }, []);

  const overviewCards = useMemo(() => [
    { label: 'Users', value: overview.users || 0, icon: Users },
    { label: 'Classrooms', value: overview.classrooms || 0, icon: ShieldCheck },
    { label: 'Quiz Attempts', value: overview.attempts || 0, icon: Activity },
    { label: 'Open Cases', value: overview.moderationOpen || 0, icon: SlidersHorizontal },
  ], [overview]);

  const submitAnnouncement = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    try {
      await api.post('/admin/announcements', announcementForm);
      toast.success('Announcement submitted.');
      setAnnouncementForm(emptyAnnouncement);
      await loadAdminSuite();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to submit announcement.'));
    }
  };

  const updateUserStatus = async (userId, status) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { status });
      toast.success('User status updated.');
      await loadAdminSuite();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to update user status.'));
    }
  };

  const saveConfig = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    try {
      await api.post('/admin/config', configForm);
      toast.success('Configuration saved.');
      await loadAdminSuite();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to save configuration.'));
    }
  };


  if (loading) {
    return (
      <div className="mt-8 flex h-96 items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
          <p className="mt-4 text-slate-400">Loading premium suite...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="relative mt-6 space-y-8 pb-12">
      {/* Animated Background Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-3xl animate-pulse" />
        <div className="absolute -right-60 bottom-40 h-[600px] w-[600px] rounded-full bg-violet-500/10 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Main Header */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 p-8 text-slate-900 shadow-xl border border-slate-200 overflow-hidden dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950 dark:text-white dark:border-white/10">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 p-3 shadow-inner">
            <ShieldCheck className="h-9 w-9 text-white" />
          </div>
          <div>
            <h2 className="text-4xl font-black tracking-tighter">Admin Control Suite</h2>
            <p className="mt-1 text-slate-300">Enterprise-grade management with elegance</p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="group rounded-2xl bg-slate-50/90 p-6 backdrop-blur-xl border border-slate-200 hover:border-cyan-400/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/10 dark:bg-white/5 dark:border-white/10"
            >
              <Icon className="mb-4 h-7 w-7 text-cyan-400 transition-transform group-hover:scale-110" />
              <p className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">{value}</p>
              <p className="mt-1 text-sm uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        {/* User Management */}
        <div className="xl:col-span-2 rounded-3xl bg-white/90 backdrop-blur-2xl border border-slate-200 p-8 shadow-xl dark:bg-white/5 dark:border-white/10 dark:shadow-2xl">
          <h3 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Users className="text-cyan-400" /> User Management
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 text-xs uppercase tracking-widest text-slate-500 dark:border-white/10 dark:text-slate-400">
                  <th className="pb-4 text-left text-slate-900 dark:text-slate-200">User</th>
                  <th className="pb-4 text-left text-slate-900 dark:text-slate-200">Role</th>
                  <th className="pb-4 text-left text-slate-900 dark:text-slate-200">Status</th>
                  <th className="pb-4 text-right text-slate-900 dark:text-slate-200">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((item) => (
                  <tr key={item._id} className="group hover:bg-white/5 transition-colors">
                    <td className="py-5">
                      <p className="font-semibold text-slate-900 dark:text-white">{item.fullName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.email}</p>
                    </td>
                    <td className="py-5 capitalize text-slate-300">{item.role}</td>
                    <td className="py-5">
                      <span className={`inline-block rounded-full px-4 py-1 text-xs font-medium ${item.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-5 text-right">
                      <button
                        onClick={() => updateUserStatus(item._id, item.status === 'suspended' ? 'active' : 'suspended')}
                        className="rounded-2xl bg-slate-100 px-6 py-2 text-xs font-semibold text-slate-900 hover:bg-cyan-500 hover:text-white transition-all active:scale-95 dark:bg-white/10 dark:text-white"
                      >
                        {item.status === 'suspended' ? 'Activate' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Broadcast Announcement */}
        <form
          onSubmit={submitAnnouncement}
          className="relative rounded-3xl border border-slate-200 bg-slate-50/90 p-8 backdrop-blur-2xl shadow-xl overflow-hidden group dark:bg-white/5 dark:border-white/10 dark:shadow-2xl"
        >
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl group-hover:bg-blue-500/20 transition-all" />
          
          <div className="relative mb-6 flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-blue-400" />
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Broadcast Announcement</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Reach your audience instantly</p>
            </div>
          </div>

          <input
            value={announcementForm.title}
            onChange={(e) => setAnnouncementForm((form) => ({ ...form, title: e.target.value }))}
            placeholder="Announcement title"
            className="mb-4 w-full rounded-2xl border border-slate-200 bg-white/90 px-5 py-3.5 text-slate-900 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition-all dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
          />
          <textarea
            value={announcementForm.body}
            onChange={(e) => setAnnouncementForm((form) => ({ ...form, body: e.target.value }))}
            placeholder="Write your message here..."
            rows={4}
            className="mb-4 w-full rounded-2xl border border-slate-200 bg-white/90 px-5 py-3.5 text-slate-900 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition-all resize-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
          />

          <div className="grid grid-cols-2 gap-4">
            <select
              value={announcementForm.audience}
              onChange={(e) => setAnnouncementForm((form) => ({ ...form, audience: e.target.value }))}
              className="input"
            >
              <option value="all">All</option>
              <option value="students">Students</option>
              <option value="teachers">Teachers</option>
              <option value="admins">Admins</option>
            </select>
            <select
              value={announcementForm.status}
              onChange={(e) => setAnnouncementForm((form) => ({ ...form, status: e.target.value }))}
              className="rounded-2xl border border-slate-200 bg-white/90 px-5 py-3.5 text-slate-900 focus:border-cyan-400 focus:outline-none transition-all dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <option value="published">Publish Now</option>
              <option value="draft">Save as Draft</option>
            </select>
          </div>

          <button className="mt-8 w-full rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.985] transition-all">
            {announcementForm.status === 'published' ? '🚀 Publish & Notify Users' : '💾 Save Draft'}
          </button>
        </form>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-8 xl:grid-cols-3">
        {/* Analytics */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-2xl border border-slate-200 p-8 shadow-xl dark:bg-white/5 dark:border-white/10 dark:shadow-2xl">
          <h3 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Platform Analytics</h3>
          <div className="space-y-4 text-slate-600 dark:text-slate-300">
            <p>Students: <span className="font-mono font-bold text-cyan-400">{analytics.roleBreakdown?.student || 0}</span></p>
            <p>Teachers: <span className="font-mono font-bold text-cyan-400">{analytics.roleBreakdown?.teacher || 0}</span></p>
            <p>Admins: <span className="font-mono font-bold text-cyan-400">{analytics.roleBreakdown?.admin || 0}</span></p>
          </div>
          <div className="mt-8 flex h-28 items-end gap-1">
            {(analytics.quizTrend || []).slice(-14).map((day, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-cyan-400 to-violet-400 transition-all hover:brightness-125"
                style={{ height: `${Math.max(day.attempts * 8, 12)}px` }}
                title={`${day.date}: ${day.attempts} attempts`}
              />
            ))}
          </div>
        </div>

        {/* Moderation Queue */}
        <div className="rounded-3xl bg-slate-50/90 backdrop-blur-2xl border border-slate-200 p-8 shadow-xl dark:bg-white/5 dark:border-white/10 dark:shadow-2xl">
          <h3 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Moderation Queue</h3>
          <div className="space-y-3">
            {moderation.slice(0, 5).map((item) => (
              <div key={item._id} className="rounded-2xl bg-slate-50 p-5 transition hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10">
                <p className="font-medium text-slate-900 dark:text-white">{item.reason}</p>
                <p className="mt-1 text-xs uppercase text-slate-500 dark:text-slate-400">{item.status}</p>
              </div>
            ))}
            {moderation.length === 0 && <p className="text-slate-400 py-8 text-center">No pending moderation cases.</p>}
          </div>
        </div>

        {/* System Config */}
        <form onSubmit={saveConfig} className="rounded-3xl bg-slate-50/90 backdrop-blur-2xl border border-slate-200 p-8 shadow-xl dark:bg-white/5 dark:border-white/10 dark:shadow-2xl">
          <h3 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">System Configuration</h3>
          
          <input
            value={configForm.key}
            onChange={(e) => setConfigForm((form) => ({ ...form, key: e.target.value }))}
            className="mb-4 w-full rounded-2xl border border-slate-200 bg-white/90 px-5 py-3.5 text-slate-900 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition-all dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
          />
          <input
            value={configForm.value}
            onChange={(e) => setConfigForm((form) => ({ ...form, value: e.target.value }))}
            className="mb-4 w-full rounded-2xl border border-slate-200 bg-white/90 px-5 py-3.5 text-slate-900 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition-all dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
          />
          <textarea
            value={configForm.description}
            onChange={(e) => setConfigForm((form) => ({ ...form, description: e.target.value }))}
            rows={3}
            className="mb-6 w-full rounded-2xl border border-slate-200 bg-white/90 px-5 py-3.5 text-slate-900 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition-all dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
          />

          <button className="w-full rounded-2xl bg-white py-4 text-base font-bold text-black hover:bg-slate-200 active:scale-[0.985] transition-all">
            Save Configuration
          </button>
          <p className="mt-4 text-center text-xs text-slate-400">{config.length} values stored</p>
        </form>
      </div>

      {/* Recent Announcements */}
      <div className="rounded-3xl bg-slate-50/90 backdrop-blur-2xl border border-slate-200 p-8 shadow-xl dark:bg-white/5 dark:border-white/10 dark:shadow-2xl">
        <h3 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Recent Announcements</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {announcements.slice(0, 6).map((item) => (
            <div key={item._id} className="rounded-2xl border border-slate-200 bg-white/90 p-6 hover:border-slate-300 transition-all dark:border-white/10 dark:bg-white/5 dark:hover:border-white/30">
              <p className="font-semibold text-slate-900 dark:text-white text-lg">{item.title}</p>
              <p className="mt-2 line-clamp-3 text-slate-600 dark:text-slate-400 text-sm">{item.body}</p>
              <p className="mt-4 text-xs uppercase tracking-widest text-slate-500">
                {item.audience} • {item.status}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}